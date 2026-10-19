"""Analytics and circular impact computation service."""
from typing import Dict, Any

class AnalyticsService:
    @staticmethod
    def calculate_co2_offset(diverted_kg: float) -> float:
        """Estimates kg of CO2 equivalent abated per kg of diverted recyclable."""
        # 1 kg diverted recyclable saves approx 1.35 kg CO2e
        return round(diverted_kg * 1.35, 2)

__all__ = ["AnalyticsService"]
