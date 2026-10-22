"""Distributed rate limiter with Upstash / Redis backend and resilient in-memory sliding-window fallback."""
import re
import time
import logging
import threading
from typing import Dict, List, Optional, Tuple
from fastapi import Request, HTTPException, status
from app.core.config import settings

logger = logging.getLogger("safaipay.ratelimit")

# Global Redis client connection pool (optional / lazy-loaded)
_redis_client = None
_redis_checked = False

def mask_redis_url(url: str) -> str:
    """Mask password and sensitive credentials in Redis connection strings."""
    if not url:
        return ""
    return re.sub(r"://([^:]+):([^@]+)@", r"://\1:***@", url)

def get_redis_client():
    global _redis_client, _redis_checked
    if _redis_checked:
        return _redis_client
    _redis_checked = True
    try:
        import redis
        client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_timeout=1.5,
            socket_connect_timeout=1.5
        )
        client.ping()
        _redis_client = client
        logger.info(f"Connected to Redis for distributed rate limiting at {mask_redis_url(settings.REDIS_URL)}")
    except Exception as e:
        if settings.ENVIRONMENT == "production":
            logger.warning("Production Redis connection failed for distributed rate limiting.")
        else:
            logger.info("Redis unavailable, using in-memory sliding window fallback.")
        _redis_client = None
    return _redis_client

def check_redis_health() -> Tuple[bool, str]:
    """Probe Redis connectivity safely without leaking passwords, tokens, or raw host URLs."""
    try:
        client = get_redis_client()
        if client:
            client.ping()
            return True, "Redis distributed rate limiter operational."
        return False, "Redis service disconnected. In-memory sliding window fallback active."
    except Exception:
        return False, "Redis connection probe error."

import ipaddress

def get_client_ip(request: Request) -> str:
    """Extract and sanitize client IP considering reverse proxies (Render, Vercel, Cloudflare).
    
    Prevents arbitrary header spoofing by validating candidates against valid IPv4/IPv6 syntax.
    """
    # 1. Direct Cloudflare / Reverse Proxy headers if present
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        try:
            return str(ipaddress.ip_address(cf_ip.strip()))
        except ValueError:
            pass

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        try:
            return str(ipaddress.ip_address(real_ip.strip()))
        except ValueError:
            pass

    # 2. Inspect X-Forwarded-For chain safely
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        parts = [p.strip() for p in forwarded.split(",") if p.strip()]
        for part in parts:
            try:
                parsed = ipaddress.ip_address(part)
                return str(parsed)
            except ValueError:
                continue

    # 3. Direct client connection host
    if request.client and request.client.host:
        try:
            return str(ipaddress.ip_address(request.client.host))
        except ValueError:
            pass

    return "127.0.0.1"

class DistributedRateLimiter:
    """Sliding-window rate limiter utilizing Redis when online, with thread-safe in-memory fallback."""

    def __init__(self, requests_limit: int = 10, window_seconds: int = 60, name: str = "default"):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.name = name
        self._in_memory_records: Dict[str, List[float]] = {}
        self._lock = threading.Lock()

    def check(self, key: str) -> None:
        client = get_redis_client()
        if client:
            try:
                now = time.time()
                redis_key = f"ratelimit:{self.name}:{key}"
                pipe = client.pipeline()
                # Remove timestamps older than window
                pipe.zremrangebyscore(redis_key, 0, now - self.window_seconds)
                # Count remaining
                pipe.zcard(redis_key)
                # Add current request timestamp
                pipe.zadd(redis_key, {str(now): now})
                # Set TTL on the set
                pipe.expire(redis_key, self.window_seconds + 5)
                results = pipe.execute()
                current_count = results[1]

                if current_count >= self.requests_limit:
                    oldest_entries = client.zrange(redis_key, 0, 0, withscores=True)
                    oldest_ts = oldest_entries[0][1] if oldest_entries else now
                    retry_after = max(1, int(self.window_seconds - (now - oldest_ts)))
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail=f"Rate limit exceeded for {self.name}. Please try again after {retry_after} seconds.",
                        headers={"Retry-After": str(retry_after)}
                    )
                return
            except HTTPException:
                raise
            except Exception as e:
                logger.debug("Redis rate limit check error, falling back to memory.")

        # Redis unavailable: Check production policy
        if settings.ENVIRONMENT == "production" and getattr(settings, "REDIS_FALLBACK_MODE", "warning") == "fail_closed":
            logger.error(f"Production fail-closed mode: Redis unavailable for {self.name}, rejecting request.")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Rate limiting service temporarily unavailable."
            )
        elif settings.ENVIRONMENT == "production":
            logger.warning(f"Production warning: Redis unavailable for {self.name}; using local in-memory sliding window.")

        # In-memory sliding window fallback
        now = time.time()
        with self._lock:
            timestamps = self._in_memory_records.get(key, [])
            valid_timestamps = [t for t in timestamps if now - t < self.window_seconds]
            self._in_memory_records[key] = valid_timestamps

            if len(valid_timestamps) >= self.requests_limit:
                retry_after = max(1, int(self.window_seconds - (now - valid_timestamps[0])))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded for {self.name}. Please try again after {retry_after} seconds.",
                    headers={"Retry-After": str(retry_after)}
                )

            self._in_memory_records[key].append(now)

    def reset(self, key: Optional[str] = None):
        client = get_redis_client()
        if client:
            try:
                if key:
                    client.delete(f"ratelimit:{self.name}:{key}")
                else:
                    keys = client.keys(f"ratelimit:{self.name}:*")
                    if keys:
                        client.delete(*keys)
            except Exception:
                pass

        with self._lock:
            if key:
                self._in_memory_records.pop(key, None)
            else:
                self._in_memory_records.clear()

# Dedicated rate limiters
auth_rate_limiter = DistributedRateLimiter(requests_limit=10, window_seconds=60, name="Authentication")
otp_rate_limiter = DistributedRateLimiter(requests_limit=5, window_seconds=60, name="OTP Verification")
password_reset_rate_limiter = DistributedRateLimiter(requests_limit=5, window_seconds=60, name="Password Reset")
file_upload_rate_limiter = DistributedRateLimiter(requests_limit=15, window_seconds=60, name="File Upload")
ai_inference_rate_limiter = DistributedRateLimiter(requests_limit=20, window_seconds=60, name="AI Inference")

async def rate_limit_auth(request: Request):
    """FastAPI dependency to rate-limit authentication endpoints by IP."""
    if settings.ENVIRONMENT == "testing" and not request.headers.get("X-Enforce-Rate-Limit"):
        return
    client_ip = get_client_ip(request)
    auth_rate_limiter.check(client_ip)

async def rate_limit_otp(request: Request):
    """FastAPI dependency to rate-limit OTP request and verify endpoints by IP."""
    if settings.ENVIRONMENT == "testing" and not request.headers.get("X-Enforce-Rate-Limit"):
        return
    client_ip = get_client_ip(request)
    otp_rate_limiter.check(client_ip)

async def rate_limit_password_reset(request: Request):
    """FastAPI dependency to rate-limit password reset requests."""
    if settings.ENVIRONMENT == "testing" and not request.headers.get("X-Enforce-Rate-Limit"):
        return
    client_ip = get_client_ip(request)
    password_reset_rate_limiter.check(client_ip)

async def rate_limit_file_upload(request: Request):
    """FastAPI dependency to rate-limit photo and file uploads."""
    if settings.ENVIRONMENT == "testing" and not request.headers.get("X-Enforce-Rate-Limit"):
        return
    client_ip = get_client_ip(request)
    file_upload_rate_limiter.check(client_ip)

async def rate_limit_ai_inference(request: Request):
    """FastAPI dependency to rate-limit resource-intensive AI classification."""
    if settings.ENVIRONMENT == "testing" and not request.headers.get("X-Enforce-Rate-Limit"):
        return
    client_ip = get_client_ip(request)
    ai_inference_rate_limiter.check(client_ip)
