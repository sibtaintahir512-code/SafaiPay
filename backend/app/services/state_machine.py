from typing import Dict, Set, Optional
from fastapi import HTTPException, status
from app.models.pickup import PickupRequest, PickupStatus
from app.models.user import User

# Explicit workflow state transition mapping
VALID_TRANSITIONS: Dict[str, Set[str]] = {
    PickupStatus.REQUESTED.value: {
        PickupStatus.ASSIGNED.value,
        PickupStatus.CANCELLED.value,
    },
    PickupStatus.ASSIGNED.value: {
        PickupStatus.ACCEPTED.value,
        PickupStatus.REJECTED.value,
        PickupStatus.ASSIGNED.value,  # Reassignment
        PickupStatus.CANCELLED.value,
    },
    PickupStatus.REJECTED.value: {
        PickupStatus.ASSIGNED.value,  # Reassigned to another collector
        PickupStatus.CANCELLED.value,
    },
    PickupStatus.ACCEPTED.value: {
        PickupStatus.IN_PROGRESS.value,
        PickupStatus.CANCELLED.value,
        PickupStatus.ASSIGNED.value,  # Reassignment if collector forfeits
    },
    PickupStatus.IN_PROGRESS.value: {
        PickupStatus.WEIGHT_VERIFIED.value,
        PickupStatus.DISPUTED.value,
        PickupStatus.CANCELLED.value,
    },
    PickupStatus.WEIGHT_VERIFIED.value: {
        PickupStatus.CUSTOMER_CONFIRMED.value,
        PickupStatus.DISPUTED.value,
    },
    PickupStatus.CUSTOMER_CONFIRMED.value: {
        PickupStatus.PAYMENT_PENDING.value,
        PickupStatus.DISPUTED.value,
    },
    PickupStatus.PAYMENT_PENDING.value: {
        PickupStatus.PAYMENT_COMPLETED.value,
        PickupStatus.PAYMENT_FAILED.value,
        PickupStatus.DISPUTED.value,
    },
    PickupStatus.PAYMENT_FAILED.value: {
        PickupStatus.PAYMENT_PENDING.value,    # Retry
        PickupStatus.PAYMENT_COMPLETED.value,  # Direct retry success
        PickupStatus.DISPUTED.value,
        PickupStatus.CANCELLED.value,
    },
    PickupStatus.PAYMENT_COMPLETED.value: {
        PickupStatus.INVENTORY_READY.value,
        PickupStatus.DISPUTED.value,
    },
    PickupStatus.DISPUTED.value: {
        PickupStatus.WEIGHT_VERIFIED.value,
        PickupStatus.CUSTOMER_CONFIRMED.value,
        PickupStatus.PAYMENT_PENDING.value,
        PickupStatus.CANCELLED.value,
    },
    PickupStatus.INVENTORY_READY.value: set(),  # Terminal state for collection cycle
    PickupStatus.CANCELLED.value: set(),        # Terminal state
}

class StateMachineError(HTTPException):
    def __init__(self, current_state: str, requested_state: str, allowed_states: Set[str]):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid workflow state transition: Cannot transition pickup from "
                f"'{current_state}' to '{requested_state}'. "
                f"Allowed transitions from '{current_state}' are: {sorted(list(allowed_states)) if allowed_states else 'None (Terminal state)'}."
            )
        )

def validate_and_apply_transition(
    pickup: PickupRequest,
    target_status: PickupStatus,
    actor_user: Optional[User] = None,
    notes: Optional[str] = None
) -> None:
    """Validate and transition a pickup request state according to the formal state machine."""
    current_status = pickup.status
    target_val = target_status.value if isinstance(target_status, PickupStatus) else str(target_status)

    allowed = VALID_TRANSITIONS.get(current_status, set())
    if target_val not in allowed:
        raise StateMachineError(current_status, target_val, allowed)

    # Apply state transition
    pickup.status = target_val
