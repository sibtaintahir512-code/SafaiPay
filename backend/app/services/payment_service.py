import uuid
from datetime import datetime, timezone
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.payment import Payment, PaymentStatus, CollectorEarning
from app.models.pickup import PickupRequest, PickupStatus
from app.services.state_machine import validate_and_apply_transition
from app.services.audit_service import log_audit_event

class MockPaymentService:
    @staticmethod
    async def create_payment_intent(
        db: AsyncSession,
        pickup: PickupRequest,
        amount_pkr: float,
        payer_id: uuid.UUID,
        payee_id: uuid.UUID
    ) -> Payment:
        """Create a mock payment record in PENDING state."""
        # Check if an active or completed payment already exists for this pickup
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

        ref_id = f"SIM-PAY-{uuid.uuid4().hex[:12].upper()}"
        payment = Payment(
            id=uuid.uuid4(),
            pickup_id=pickup.id,
            transaction_reference=ref_id,
            payer_id=payer_id,
            payee_id=payee_id,
            amount_pkr=amount_pkr,
            status=PaymentStatus.PENDING.value,
            retry_count=0
        )
        db.add(payment)
        
        # Transition pickup state to payment_pending
        validate_and_apply_transition(pickup, PickupStatus.PAYMENT_PENDING)
        await db.flush()
        return payment

    @staticmethod
    async def process_mock_payment(
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

        # Get parent pickup
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
            net_earnings_pkr=payment.amount_pkr,  # Full transparent payout for MVP
            earned_date=datetime.now(timezone.utc).date()
        )
        db.add(earning)
        await db.commit()
        await db.refresh(payment)
        await db.refresh(earning)

        return payment, earning

    @staticmethod
    async def retry_failed_payment(
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
        
        # Now process mock payment successfully
        return await MockPaymentService.process_mock_payment(db, payment.id, simulate_failure=False)
