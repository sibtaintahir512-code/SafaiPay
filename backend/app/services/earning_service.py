"""Collector earning calculation service."""
from typing import Dict, Any

class EarningService:
    @staticmethod
    def calculate_commission(weight_kg: float, material_rate: float) -> float:
        """Calculates standard collector commission at ~35-40% of baseline value."""
        return round(weight_kg * (material_rate * 0.35), 2)

__all__ = ["EarningService"]
