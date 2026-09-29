from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional

from flask import Flask, Response, request

logger = logging.getLogger(__name__)

# Content Security Policy: Restricts where content can be loaded from.
DEFAULT_CSP = (
    "default-src 'none'; "
    "frame-ancestors 'none'; "
    "form-action 'none'; "
    "base-uri 'none'"
)

# Strict-Transport-Security: Force HTTPS for 1 year + include subdomains.
DEFAULT_HSTS = "max-age=31536000; includeSubDomains; preload"

# Permissions-Policy: Disables access to sensitive browser APIs.
DEFAULT_PERMISSIONS_POLICY = (
    "accelerometer=(), "
    "autoplay=(), "
    "camera=(), "
    "cross-origin-isolated=(), "
    "display-capture=(), "
    "encrypted-media=(), "
    "fullscreen=(), "
    "geolocation=(), "
    "gyroscope=(), "
    "keyboard-map=(), "
    "magnetometer=(), "
    "microphone=(), "
    "midi=(), "
    "payment=(), "
    "picture-in-picture=(), "
    "publickey-credentials-get=(), "
    "screen-wake-lock=(), "
    "sync-xhr=(), "
    "usb=(), "
    "xr-spatial-tracking=()"
)


class SecurityHeadersMiddleware:

    def __init__(self, app: Optional[Flask] = None):
        self._config: Dict[str, Any] = {}
        if app is not None:
            self.init_app(app)

    def init_app(self, app: Flask):

        self._config = {
            'enabled': os.getenv(
                'SECURITY_HEADERS_ENABLED', 'true'
            ).lower() in ('true', '1', 'yes'),

            'csp': os.getenv('SECURITY_CSP', DEFAULT_CSP),

            'hsts_enabled': os.getenv(
                'SECURITY_HSTS_ENABLED', 'true'
            ).lower() in ('true', '1', 'yes'),
            'hsts': os.getenv('SECURITY_HSTS', DEFAULT_HSTS),

            'permissions_policy': os.getenv(
                'SECURITY_PERMISSIONS_POLICY', DEFAULT_PERMISSIONS_POLICY
            ),
            'referrer_policy': os.getenv(
                'SECURITY_REFERRER_POLICY', 'strict-origin-when-cross-origin'
            ),
            'server_header': os.getenv('SECURITY_SERVER_HEADER', ''),
        }

        if not self._config['enabled']:
            logger.info("Security headers middleware is DISABLED")
            return

        app.after_request(self._apply_security_headers)

        logger.info(
            "Security headers middleware initialized | "
            "HSTS=%s CSP_length=%d",
            'enabled' if self._config['hsts_enabled'] else 'disabled',
            len(self._config['csp']),
        )

    def _apply_security_headers(self, response: Response) -> Response:
        
        h = response.headers

        # Prevents browsers from MIME-sniffing the response away from declared Content-Type.
        h['X-Content-Type-Options'] = 'nosniff'

        # Prevents the page from being embedded in an iframe.
        h['X-Frame-Options'] = 'DENY'

        # X-XSS-Protection, Set to 0 per OWASP recommendation.
        h['X-XSS-Protection'] = '0'

        # Content-Security-Policy, Controls which resources the browser is allowed to load.
        if self._config['csp']:
            h['Content-Security-Policy'] = self._config['csp']

        # Forces browsers to only connect via HTTPS.
        if self._config['hsts_enabled']:
            is_https = (
                request.is_secure
                or request.headers.get('X-Forwarded-Proto', '') == 'https'
            )
            if is_https:
                h['Strict-Transport-Security'] = self._config['hsts']

        # Controls how much referrer information is sent with requests.
        h['Referrer-Policy'] = self._config['referrer_policy']

        # Disables access to powerful browser APIs that an API server has no need for (camera, microphone or other things)
        if self._config['permissions_policy']:
            h['Permissions-Policy'] = self._config['permissions_policy']

        # Prevent caching of authenticated API responses.
        if request.path.startswith('/api/'):
            if 'Cache-Control' not in h:
                h['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
                h['Pragma'] = 'no-cache'
                h['Expires'] = '0'

        h['Cross-Origin-Opener-Policy'] = 'same-origin'
        h['Cross-Origin-Resource-Policy'] = 'same-origin'
        
        # to remove the tech stack from the header 
        server_val = self._config['server_header']
        if server_val:
            h['Server'] = server_val
        else:
            h.pop('Server', None)

        h.pop('X-Powered-By', None)

        return response

    def get_applied_headers(self) -> Dict[str, str]:
       
        headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '0',
            'Content-Security-Policy': self._config.get('csp', DEFAULT_CSP),
            'Referrer-Policy': self._config.get(
                'referrer_policy', 'strict-origin-when-cross-origin'
            ),
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Resource-Policy': 'same-origin',
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
        }
        if self._config.get('hsts_enabled', True):
            headers['Strict-Transport-Security'] = self._config.get(
                'hsts', DEFAULT_HSTS
            )
        if self._config.get('permissions_policy'):
            headers['Permissions-Policy'] = self._config['permissions_policy']
        return headers

def init_security_headers(app: Flask) -> SecurityHeadersMiddleware:
    """
    Initialize security headers middleware on the Flask app.

    Usage in create_app():
        from app.middleware.security_headers import init_security_headers
        init_security_headers(app)
    """
    middleware = SecurityHeadersMiddleware(app)
    return middleware
