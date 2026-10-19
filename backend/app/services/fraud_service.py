"""Fraud detection and weight variance evaluation service."""
from typing import Dict, Any

class FraudService:
    @staticmethod
    def evaluate_weight_anomaly(estimated_kg: float, verified_kg: float) -> Dict[str, Any]:
        """Detects whether weighed quantity deviates by >25% from customer estimate."""
        if estimated_kg <= 0:
            return {"is_anomaly": False, "variance_pct": 0.0}
        variance_pct = abs(verified_kg - estimated_kg) / estimated_kg * 100.0
        return {
            "is_anomaly": variance_pct > 25.0,
            "variance_pct": round(variance_pct, 1),
            "severity": "HIGH" if variance_pct > 100.0 else "MEDIUM" if variance_pct > 25.0 else "NONE"
        }

__all__ = ["FraudService"]
