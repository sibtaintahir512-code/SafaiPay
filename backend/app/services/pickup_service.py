"""Pickup service orchestrator."""
from app.services.state_machine import PickupStateMachine

class PickupService:
    @staticmethod
    def transition_state(current_state: str, action: str) -> str:
        return PickupStateMachine.get_next_state(current_state, action)

__all__ = ["PickupService"]
