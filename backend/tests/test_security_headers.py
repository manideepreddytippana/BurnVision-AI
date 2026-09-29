"""
Tests for Security Headers Middleware
======================================

Verifies that every response from the API includes the enterprise-standard
security headers per OWASP Secure Headers Project.
"""
import pytest
from app import create_app, db


@pytest.fixture
def app():
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "RATE_LIMIT_ENABLED": False,
    })
    with app.app_context():
        db.create_all()
        yield app
    with app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


class TestSecurityHeaders:
    """Verify all OWASP-recommended security headers are present."""

    def test_x_content_type_options(self, client):
        """Prevents MIME-sniffing attacks."""
        response = client.get('/api/health')
        assert response.headers.get('X-Content-Type-Options') == 'nosniff'

    def test_x_frame_options(self, client):
        """Prevents clickjacking via iframe embedding."""
        response = client.get('/api/health')
        assert response.headers.get('X-Frame-Options') == 'DENY'

    def test_x_xss_protection(self, client):
        """Set to 0 per OWASP — legacy XSS auditor can introduce vulns."""
        response = client.get('/api/health')
        assert response.headers.get('X-XSS-Protection') == '0'

    def test_content_security_policy(self, client):
        """Restricts resource loading (default-src 'none' for pure API)."""
        response = client.get('/api/health')
        csp = response.headers.get('Content-Security-Policy')
        assert csp is not None
        assert "default-src 'none'" in csp
        assert "frame-ancestors 'none'" in csp

    def test_referrer_policy(self, client):
        """Controls referrer leakage."""
        response = client.get('/api/health')
        assert response.headers.get('Referrer-Policy') == 'strict-origin-when-cross-origin'

    def test_permissions_policy(self, client):
        """Disables sensitive browser APIs (camera, mic, etc.)."""
        response = client.get('/api/health')
        pp = response.headers.get('Permissions-Policy')
        assert pp is not None
        assert 'camera=()' in pp
        assert 'microphone=()' in pp
        assert 'geolocation=()' in pp

    def test_cache_control_on_api_routes(self, client):
        """API responses must not be cached (credential leakage risk)."""
        response = client.get('/api/health')
        cc = response.headers.get('Cache-Control')
        assert cc is not None
        assert 'no-store' in cc
        assert 'no-cache' in cc

    def test_pragma_no_cache(self, client):
        """Legacy cache prevention for HTTP/1.0 clients."""
        response = client.get('/api/health')
        assert response.headers.get('Pragma') == 'no-cache'

    def test_cross_origin_opener_policy(self, client):
        """Prevents cross-origin window reference attacks (Spectre)."""
        response = client.get('/api/health')
        assert response.headers.get('Cross-Origin-Opener-Policy') == 'same-origin'

    def test_cross_origin_resource_policy(self, client):
        """Prevents cross-origin resource loading."""
        response = client.get('/api/health')
        assert response.headers.get('Cross-Origin-Resource-Policy') == 'same-origin'

    def test_server_header_removed(self, client):
        """Server header must not leak technology stack."""
        response = client.get('/api/health')
        server = response.headers.get('Server', '')
        # Should either be empty or not contain Flask/Werkzeug
        if server:
            assert 'werkzeug' not in server.lower()
            assert 'flask' not in server.lower()

    def test_x_powered_by_removed(self, client):
        """X-Powered-By must not be present."""
        response = client.get('/api/health')
        assert response.headers.get('X-Powered-By') is None

    def test_hsts_not_on_http(self, client):
        """HSTS should NOT be sent over plain HTTP (only HTTPS)."""
        response = client.get('/api/health')
        # In test mode we're on HTTP, so HSTS should be absent
        assert response.headers.get('Strict-Transport-Security') is None

    def test_hsts_on_https_proxy(self, client):
        """HSTS should be sent when behind an HTTPS reverse proxy."""
        response = client.get(
            '/api/health',
            headers={'X-Forwarded-Proto': 'https'}
        )
        hsts = response.headers.get('Strict-Transport-Security')
        assert hsts is not None
        assert 'max-age=' in hsts
        assert 'includeSubDomains' in hsts

    def test_headers_on_post_route(self, client):
        """Headers apply to all HTTP methods, not just GET."""
        response = client.post(
            '/api/auth/login',
            json={'email': 'test@test.com', 'password': 'test'},
            content_type='application/json'
        )
        # Even on a 401, security headers should be present
        assert response.headers.get('X-Content-Type-Options') == 'nosniff'
        assert response.headers.get('X-Frame-Options') == 'DENY'
        assert response.headers.get('Content-Security-Policy') is not None

    def test_headers_on_404(self, client):
        """Security headers must be present even on error responses."""
        response = client.get('/api/nonexistent')
        assert response.headers.get('X-Content-Type-Options') == 'nosniff'
        assert response.headers.get('X-Frame-Options') == 'DENY'
