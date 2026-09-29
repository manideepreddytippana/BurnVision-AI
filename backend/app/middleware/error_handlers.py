from __future__ import annotations
import logging
import os
import uuid
from typing import Any, Dict, Optional, Tuple

from flask import Flask, Response, jsonify, request
from werkzeug.exceptions import HTTPException

logger = logging.getLogger(__name__)

_DEBUG_ERRORS = os.getenv(
    'DEBUG_ERROR_RESPONSES', 'false'
).lower() in ('true', '1', 'yes')

def _build_error_response(
    status_code: int,
    message: str,
    error_code: Optional[str] = None,
    correlation_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> Tuple[Response, int]:
    
    if correlation_id is None:
        correlation_id = str(uuid.uuid4())[:8]

    body: Dict[str, Any] = {
        'error': {
            'code': error_code or _status_to_error_code(status_code),
            'message': message,
            'correlation_id': correlation_id,
        }
    }

    if details and _DEBUG_ERRORS:
        body['error']['debug'] = details

    return jsonify(body), status_code

_SAFE_MESSAGES = {
    400: 'The request was malformed or contained invalid parameters.',
    401: 'Authentication is required to access this resource.',
    403: 'You do not have permission to access this resource.',
    404: 'The requested resource was not found.',
    405: 'This HTTP method is not allowed for this endpoint.',
    406: 'The requested content type is not supported.',
    408: 'The request timed out. Please try again.',
    409: 'The request conflicts with the current state of the resource.',
    413: 'The request payload is too large.',
    415: 'The media type of the request is not supported.',
    422: 'The request data failed validation.',
    423: 'This resource is temporarily locked.',
    429: 'Too many requests. Please slow down and try again later.',
    500: 'An unexpected error occurred. Please try again later.',
    502: 'The server received an invalid response from an upstream service.',
    503: 'The service is temporarily unavailable. Please try again later.',
    504: 'The upstream service did not respond in time.',
}

_ERROR_CODES = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    405: 'METHOD_NOT_ALLOWED',
    408: 'REQUEST_TIMEOUT',
    409: 'CONFLICT',
    413: 'PAYLOAD_TOO_LARGE',
    415: 'UNSUPPORTED_MEDIA_TYPE',
    422: 'VALIDATION_ERROR',
    423: 'LOCKED',
    429: 'RATE_LIMIT_EXCEEDED',
    500: 'INTERNAL_SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT',
}

def _status_to_error_code(status_code: int) -> str:
    return _ERROR_CODES.get(status_code, 'UNKNOWN_ERROR')

def _safe_message(status_code: int) -> str:
    return _SAFE_MESSAGES.get(
        status_code,
        'An unexpected error occurred. Please try again later.'
    )

def safe_error_response(
    status_code: int = 500,
    message: Optional[str] = None,
    error_code: Optional[str] = None,
    log_exception: Optional[Exception] = None,
    log_context: Optional[str] = None,
) -> Tuple[Response, int]:
    
    correlation_id = str(uuid.uuid4())[:8]

    if log_exception:
        logger.error(
            "[%s] %s | path=%s method=%s | %s: %s",
            correlation_id,
            log_context or 'unhandled_error',
            request.path if request else 'unknown',
            request.method if request else 'unknown',
            type(log_exception).__name__,
            str(log_exception),
            exc_info=True,
        )

    user_message = message or _safe_message(status_code)

    return _build_error_response(
        status_code=status_code,
        message=user_message,
        error_code=error_code,
        correlation_id=correlation_id,
        details={
            'exception_type': type(log_exception).__name__,
            'exception_message': str(log_exception),
        } if log_exception else None,
    )

def init_error_handlers(app: Flask):
    
    @app.errorhandler(Exception)
    def handle_unhandled_exception(e):
        
        if isinstance(e, HTTPException):
            return handle_http_exception(e)

        correlation_id = str(uuid.uuid4())[:8]

        logger.error(
            "[%s] Unhandled exception | path=%s method=%s ip=%s | %s: %s",
            correlation_id,
            request.path,
            request.method,
            request.remote_addr,
            type(e).__name__,
            str(e),
            exc_info=True,
        )

        return _build_error_response(
            status_code=500,
            message=_safe_message(500),
            correlation_id=correlation_id,
            details={
                'exception_type': type(e).__name__,
                'exception_message': str(e),
            },
        )

    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        
        correlation_id = str(uuid.uuid4())[:8]

        if e.code >= 500:
            logger.error(
                "[%s] HTTP %d | path=%s method=%s | %s",
                correlation_id, e.code, request.path, request.method,
                e.description,
            )
        else:
            logger.warning(
                "[%s] HTTP %d | path=%s method=%s",
                correlation_id, e.code, request.path, request.method,
            )

        return _build_error_response(
            status_code=e.code,
            message=_safe_message(e.code),
            correlation_id=correlation_id,
        )

    logger.info(
        "Error handlers initialized | debug_errors=%s",
        _DEBUG_ERRORS,
    )
