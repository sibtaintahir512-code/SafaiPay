import datetime
from typing import Any, Dict, Optional, Union
import bcrypt
import jwt
from app.core.config import settings

def get_password_hash(password: str) -> str:
    """Hash a plaintext password using bcrypt with salt."""
    salt = bcrypt.gensalt(rounds=12)
    pwd_bytes = password.encode("utf-8")
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against the stored bcrypt hash."""
    try:
        plain_bytes = plain_password.encode("utf-8")
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(plain_bytes, hash_bytes)
    except Exception:
        return False

def create_access_token(
    subject: Union[str, Any],
    roles: list,
    expires_delta: Optional[datetime.timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None
) -> str:
    """Generate a signed JWT access token containing subject and role claims."""
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "roles": roles,
        "exp": expire,
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "type": "access"
    }
    if extra_claims:
        to_encode.update(extra_claims)

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(
    subject: Union[str, Any],
    expires_delta: Optional[datetime.timedelta] = None
) -> str:
    """Generate a signed JWT refresh token."""
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "type": "refresh"
    }

    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except (jwt.PyJWTError, Exception):
        return None

# Canonical alias
decode_access_token = decode_token

import re
import os

def mask_pii(text: Optional[str]) -> str:
    """Mask sensitive PII (CNIC, phone numbers, emails, tokens, database/redis URLs, passwords) in logs and audit trails."""
    if not text:
        return ""
    s = str(text)

    # 1. Mask CNIC (e.g. 42101-1234567-1 -> 42101-*******-1)
    s = re.sub(r'(\b\d{5})-\d{7}-(\d\b)', r'\1-*******-\2', s)

    # 2. Mask Pakistani mobile numbers (+923001234567 or 03001234567)
    s = re.sub(r'(\+?923\d{2}|\b03\d{2})\d{4}(\d{3}\b)', r'\1****\2', s)

    # 3. Mask email addresses (user@domain.com -> u***@domain.com)
    s = re.sub(r'(\b[a-zA-Z0-9_.+-])[a-zA-Z0-9_.+-]+@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\b)', r'\1***@\2', s)

    # 4. Mask JWT tokens
    s = re.sub(r'(Bearer\s+)?ey[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]+', r'Bearer ey***[MASKED_TOKEN]', s)

    # 5. Mask Database connection credentials (PostgreSQL / Supabase)
    s = re.sub(r'(postgres(?:ql)?(?:\+asyncpg)?://[^:]+:)[^@]+(@)', r'\1***\2', s)

    # 6. Mask Redis credentials (Upstash TLS / redis)
    s = re.sub(r'(rediss?://[^:]+:)[^@]+(@)', r'\1***\2', s)

    # 7. Mask passwords in JSON / query / logging strings
    s = re.sub(r'([\"\'\b]password[\"\'\s]*[:=]\s*[\"\'])[^\"]+([\"\'])', r'\1***[MASKED_PASSWORD]\2', s, flags=re.IGNORECASE)

    return s

def sanitize_filename(filename: Optional[str], default: str = "upload.jpg") -> str:
    """Sanitize user-provided filename to prevent path traversal and shell injection across OS platforms."""
    if not filename:
        return default
    # Handle both POSIX and Windows path separators
    clean = filename.replace("\\", "/").split("/")[-1].strip()
    safe = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean)
    # Remove leading dots or slashes
    safe = safe.lstrip('.').strip()
    return safe or default
