import os
import logging
from flask import request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

logger = logging.getLogger(__name__)

def _get_rate_limit_key():

    try:
        from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if identity:
            return f"user:{identity}|ip:{get_remote_address()}"
    except Exception:
        pass

    return get_remote_address()

RATE_LIMIT_AUTH = os.getenv(
    "RATE_LIMIT_AUTH",
    "5 per minute; 20 per hour"
)

RATE_LIMIT_COMPUTE = os.getenv(
    "RATE_LIMIT_COMPUTE",
    "10 per minute; 100 per hour"
)

RATE_LIMIT_WRITE = os.getenv(
    "RATE_LIMIT_WRITE",
    "30 per minute; 300 per hour"
)

RATE_LIMIT_READ = os.getenv(
    "RATE_LIMIT_READ",
    "60 per minute; 1000 per hour"
)

RATE_LIMIT_ADMIN = os.getenv(
    "RATE_LIMIT_ADMIN",
    "30 per minute; 500 per hour"
)

RATE_LIMIT_DEFAULT = os.getenv(
    "RATE_LIMIT_DEFAULT",
    "60 per minute; 1000 per hour"
)

RATE_LIMIT_STORAGE_URI = os.getenv(
    "RATE_LIMIT_STORAGE_URI",
    "memory://"
)

RATE_LIMIT_ENABLED = os.getenv(
    "RATE_LIMIT_ENABLED",
    "true"
).lower() in ("true", "1", "yes")


limiter = Limiter(
    key_func=_get_rate_limit_key,
    default_limits=RATE_LIMIT_DEFAULT.split(";"),
    storage_uri=RATE_LIMIT_STORAGE_URI,
    strategy="fixed-window",
    enabled=RATE_LIMIT_ENABLED,
)

def _rate_limit_exceeded_handler(e):
   
    logger.warning(
        "Rate limit exceeded | key=%s path=%s method=%s limit=%s",
        _get_rate_limit_key(),
        request.path,
        request.method,
        str(e.description),
    )

    retry_after = getattr(e, "retry_after", 60)
    if retry_after is None:
        retry_after = 60

    response = jsonify({
        "error": {
            "code": "RATE_LIMIT_EXCEEDED",
            "message": "Too many requests. Please slow down and try again later.",
            "retry_after": retry_after,
            "detail": str(e.description),
        }
    })
    response.status_code = 429
    response.headers["Retry-After"] = str(retry_after)
    response.headers["Content-Type"] = "application/json"
    return response

def init_rate_limiter(app):

    limiter.init_app(app)

    app.errorhandler(429)(_rate_limit_exceeded_handler)

    if RATE_LIMIT_ENABLED:
        logger.info(
            "Rate limiter initialized | storage=%s default=%s",
            RATE_LIMIT_STORAGE_URI,
            RATE_LIMIT_DEFAULT,
        )
    else:
        logger.info("Rate limiter is DISABLED (RATE_LIMIT_ENABLED=false)")

    return limiter
