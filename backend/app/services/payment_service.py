import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Optional, Tuple, Dict, Any
from enum import Enum
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.payment import Payment, PaymentStatus, CollectorEarning
from app.models.pickup import PickupRequest, PickupStatus
from app.services.state_machine import validate_and_apply_transition
from app.services.audit_service import log_audit_event

class PaymentMethod(str, Enum):
    MOCK_RAAST = "MOCK_RAAST"
    BANK_TRANSFER = "BANK_TRANSFER"
    DIGITAL_WALLET = "DIGITAL_WALLET"
    CASH_CONFIRMATION = "CASH_CONFIRMATION"

class PaymentGatewayInterface(ABC):
    """Abstract interface for payment rails.
    SafaiPay does NOT directly hold customer deposits or act as a bank.
    Pluggable adapters connect to Raast, commercial banks, or wallet PSPs.
    """

    @abstractmethod
    async def create_payment_intent(
        self,
        db: AsyncSession,
        pickup: PickupRequest,
        amount_pkr: float,
        payer_id: uuid.UUID,
        payee_id: uuid.UUID,
        method: PaymentMethod = PaymentMethod.MOCK_RAAST
    ) -> Payment:
        pass

    @abstractmethod
    async def process_mock_payment(
        self,
        db: AsyncSession,
        payment_id: uuid.UUID,
        simulate_failure: bool = False,
        failure_reason: Optional[str] = None
    ) -> Tuple[Payment, Optional[CollectorEarning]]:
        pass

    @abstractmethod
    async def retry_failed_payment(
        self,
        db: AsyncSession,
        payment_id: uuid.UUID
    ) -> Tuple[Payment, CollectorEarning]:
        pass

    @abstractmethod
    async def reconcile_transaction(
        self,
        db: AsyncSession,
        transaction_reference: str
    ) -> Dict[str, Any]:
        pass

class MockPaymentService(PaymentGatewayInterface):
    @classmethod
    async def create_payment_intent(
        cls,
        db: AsyncSession,
        pickup: PickupRequest,
        amount_pkr: float,
        payer_id: uuid.UUID,
        payee_id: uuid.UUID,
        method: PaymentMethod = PaymentMethod.MOCK_RAAST
    ) -> Payment:
        """Create a mock payment record in PENDING state with selected rail."""
        query = select(Payment).where(
            Payment.pickup_id == pickup.id,
            Payment.status == PaymentStatus.COMPLETED.value
        )
        existing_paid = (await db.execute(query)).scalar_one_or_none()
        if existing_paid:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Payment already completed for pickup '{pickup.tracking_number}'. Duplicate payment rejected."
            )

        rail_prefix = {
            PaymentMethod.MOCK_RAAST: "RAAST",
            PaymentMethod.BANK_TRANSFER: "IBFT",
            PaymentMethod.DIGITAL_WALLET: "WALLET",
            PaymentMethod.CASH_CONFIRMATION: "CASH",
        }.get(method, "SIM")

        ref_id = f"{rail_prefix}-{uuid.uuid4().hex[:12].upper()}"
        payment = Payment(
            id=uuid.uuid4(),
            pickup_id=pickup.id,
            transaction_reference=ref_id,
            payer_id=payer_id,
            payee_id=payee_id,
            payment_method=method.value if isinstance(method, PaymentMethod) else str(method),
            amount_pkr=amount_pkr,
            status=PaymentStatus.PENDING.value,
            retry_count=0
        )
        db.add(payment)
        
        # Transition pickup state to payment_pending
        validate_and_apply_transition(pickup, PickupStatus.PAYMENT_PENDING)
        await db.flush()
        return payment

    @classmethod
    async def process_mock_payment(
        cls,
        db: AsyncSession,
        payment_id: uuid.UUID,
        simulate_failure: bool = False,
        failure_reason: Optional[str] = None
    ) -> Tuple[Payment, Optional[CollectorEarning]]:
        """Simulate payment execution via sandbox processing."""
        query = select(Payment).where(Payment.id == payment_id)
        result = await db.execute(query)
        payment = result.scalar_one_or_none()

        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment record not found."
            )

        if payment.status == PaymentStatus.COMPLETED.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Payment is already completed. Duplicate confirmation rejected."
            )

        query_pickup = select(PickupRequest).where(PickupRequest.id == payment.pickup_id)
        pickup = (await db.execute(query_pickup)).scalar_one_or_none()

        if simulate_failure:
            payment.status = PaymentStatus.FAILED.value
            payment.failure_reason = failure_reason or "Simulated sandbox insufficient funds / rail timeout"
            if pickup:
                validate_and_apply_transition(pickup, PickupStatus.PAYMENT_FAILED)
            await db.commit()
            return payment, None

        # Successful payment flow
        payment.status = PaymentStatus.COMPLETED.value
        payment.completed_at = datetime.now(timezone.utc)
        payment.failure_reason = None

        if pickup:
            validate_and_apply_transition(pickup, PickupStatus.PAYMENT_COMPLETED)

        # Create collector earnings record
        earning = CollectorEarning(
            id=uuid.uuid4(),
            collector_id=payment.payee_id,
            pickup_id=payment.pickup_id,
            payment_id=payment.id,
            gross_amount_pkr=payment.amount_pkr,
            net_earnings_pkr=payment.amount_pkr,
            earned_date=datetime.now(timezone.utc).date()
        )
        db.add(earning)
        await db.commit()
        await db.refresh(payment)
        await db.refresh(earning)

        return payment, earning

    @classmethod
    async def retry_failed_payment(
        cls,
        db: AsyncSession,
        payment_id: uuid.UUID
    ) -> Tuple[Payment, CollectorEarning]:
        """Retry a previously failed payment."""
        query = select(Payment).where(Payment.id == payment_id)
        result = await db.execute(query)
        payment = result.scalar_one_or_none()

        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment record not found."
            )

        if payment.status != PaymentStatus.FAILED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot retry payment in '{payment.status}' status. Only FAILED payments can be retried."
            )

        payment.retry_count += 1
        payment.status = PaymentStatus.PENDING.value

        query_pickup = select(PickupRequest).where(PickupRequest.id == payment.pickup_id)
        pickup = (await db.execute(query_pickup)).scalar_one_or_none()
        if pickup:
            validate_and_apply_transition(pickup, PickupStatus.PAYMENT_PENDING)

        await db.commit()
        return await cls.process_mock_payment(db, payment.id, simulate_failure=False)

    @classmethod
    async def reconcile_transaction(
        cls,
        db: AsyncSession,
        transaction_reference: str
    ) -> Dict[str, Any]:
        """Reconciliation report for banking/PSP audit verification."""
        query = select(Payment).where(Payment.transaction_reference == transaction_reference)
        res = await db.execute(query)
        payment = res.scalar_one_or_none()
        if not payment:
            raise HTTPException(status_code=404, detail="Transaction reference not found.")

        return {
            "transaction_reference": payment.transaction_reference,
            "payment_method": payment.payment_method,
            "amount_pkr": float(payment.amount_pkr),
            "status": payment.status,
            "retry_count": payment.retry_count,
            "completed_at": payment.completed_at.isoformat() if payment.completed_at else None,
            "compliance_notice": "SafaiPay is an informal circular-economy technology platform, NOT a bank, depository, or licensed money services business."
        }

    @classmethod
    async def handle_payment_webhook(
        cls,
        db: AsyncSession,
        payload: Dict[str, Any],
        signature: Optional[str] = None
    ) -> Dict[str, Any]:
        """Webhook adapter structure for banking / Raast partners."""
        ref = payload.get("transaction_reference")
        event_status = payload.get("status", "SUCCESS")
        if not ref:
            raise HTTPException(status_code=400, detail="Missing transaction_reference in webhook.")

        query = select(Payment).where(Payment.transaction_reference == ref)
        res = await db.execute(query)
        payment = res.scalar_one_or_none()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment record for reference not found.")

        if event_status == "SUCCESS":
            return {"status": "ACKNOWLEDGED", "transaction_reference": ref, "action": "PROCESSED"}
        else:
            payment.status = PaymentStatus.FAILED.value
            payment.failure_reason = payload.get("reason", "PSP Webhook Reported Failure")
            await db.commit()
            return {"status": "ACKNOWLEDGED", "transaction_reference": ref, "action": "FAILED"}

__all__ = ["MockPaymentService", "PaymentGatewayInterface", "PaymentMethod"]
