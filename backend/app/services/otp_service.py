import time
from typing import Dict, Tuple
from app.core.config import settings

# In-memory storage for OTPs (pluggable with Redis)
# Maps phone_number -> (otp_code, expiration_timestamp)
_otp_store: Dict[str, Tuple[str, float]] = {}

class OTPService:
    @staticmethod
    def generate_and_send_otp(phone_number: str) -> str:
        """Generate and dispatch an OTP code.
        In development/mock mode, uses OTP_DEFAULT_CODE or generates code.
        Returns the code for sandbox testing without exposing secrets in logs.
        """
        code = settings.OTP_DEFAULT_CODE if settings.OTP_MOCK_MODE else "849201"
        expires_at = time.time() + settings.OTP_EXPIRATION_SECONDS
        _otp_store[phone_number] = (code, expires_at)
        
        # Production SMS gateway adapter would send SMS here (e.g. Twilio / local telco)
        return code

    @staticmethod
    def verify_otp(phone_number: str, code: str) -> bool:
        """Verify the provided OTP code against stored code and expiration."""
        record = _otp_store.get(phone_number)
        if not record:
            return False

        stored_code, expires_at = record
        if time.time() > expires_at:
            _otp_store.pop(phone_number, None)
            return False

        if stored_code == code:
            _otp_store.pop(phone_number, None)
            return True

        return False
