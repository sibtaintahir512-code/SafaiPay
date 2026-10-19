from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.payment import Payment, PaymentStatus
from app.models.pickup import PickupRequest, PickupStatus
from app.models.user import User
from app.schemas.payment import PaymentResponse, MockPaymentProcessRequest
from app.api.deps import get_current_user, require_roles
from app.services.payment_service import MockPaymentService
from app.services.state_machine import validate_and_apply_transition

router = APIRouter(prefix="/payments", tags=["Mock Payments & Settlement"])

@router.get("/{id}", response_model=PaymentResponse)
async def get_payment(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve details of a mock payment transaction."""
    query = select(Payment).where(Payment.id == id)
    payment = (await db.execute(query)).scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found.")

    is_payer = str(payment.payer_id) == str(current_user.id)
    is_payee = str(payment.payee_id) == str(current_user.id)
    is_admin = "ADMIN" in current_user.role_names

    if not (is_payer or is_payee or is_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: You cannot view this payment.")

    return payment

@router.post("/{id}/process-mock", response_model=PaymentResponse)
async def process_mock_payment(
    id: str,
    payload: MockPaymentProcessRequest = MockPaymentProcessRequest(),
    current_user: User = Depends(require_roles(["ADMIN", "CUSTOMER"])),
    db: AsyncSession = Depends(get_db)
):
    """Execute mock payment simulation. Supports simulating failure for testing."""
    payment, _ = await MockPaymentService.process_mock_payment(
        db=db,
        payment_id=id,
        simulate_failure=payload.simulate_failure,
        failure_reason=payload.failure_reason
    )
    return payment

@router.post("/{id}/retry", response_model=PaymentResponse)
async def retry_failed_payment(
    id: str,
    current_user: User = Depends(require_roles(["ADMIN", "CUSTOMER"])),
    db: AsyncSession = Depends(get_db)
):
    """Retry a failed mock payment transaction."""
    payment, _ = await MockPaymentService.retry_failed_payment(db=db, payment_id=id)
    return payment

@router.post("/pickups/{pickup_id}/ready-for-inventory", status_code=status.HTTP_200_OK)
async def mark_inventory_ready(
    pickup_id: str,
    current_user: User = Depends(require_roles(["ADMIN", "COLLECTOR"])),
    db: AsyncSession = Depends(get_db)
):
    """Transition completed pickup to inventory_ready for recycler aggregation."""
    query = select(PickupRequest).where(PickupRequest.id == pickup_id)
    pickup = (await db.execute(query)).scalar_one_or_none()
    if not pickup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup not found.")

    validate_and_apply_transition(pickup, PickupStatus.INVENTORY_READY)
    await db.commit()
    await db.refresh(pickup)
    return {"message": "Pickup marked as inventory_ready for recycling aggregation.", "status": pickup.status}

@router.post("/by-pickup/{pickup_id}/process", response_model=PaymentResponse)
async def process_payment_by_pickup(
    pickup_id: str,
    payload: MockPaymentProcessRequest = MockPaymentProcessRequest(),
    current_user: User = Depends(require_roles(["ADMIN", "CUSTOMER"])),
    db: AsyncSession = Depends(get_db)
):
    """Execute mock payment simulation by pickup ID."""
    query = select(Payment).where(Payment.pickup_id == pickup_id).order_by(Payment.created_at.desc())
    payment = (await db.execute(query)).scalars().first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record for this pickup not found.")

    payment, _ = await MockPaymentService.process_mock_payment(
        db=db,
        payment_id=payment.id,
        simulate_failure=payload.simulate_failure,
        failure_reason=payload.failure_reason
    )
    return payment

@router.get("/by-pickup/{pickup_id}", response_model=PaymentResponse)
async def get_payment_by_pickup(
    pickup_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve payment details by pickup ID."""
    query = select(Payment).where(Payment.pickup_id == pickup_id).order_by(Payment.created_at.desc())
    payment = (await db.execute(query)).scalars().first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record for this pickup not found.")
    return payment

