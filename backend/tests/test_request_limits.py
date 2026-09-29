"""
Tests for Request Size Limits
=============================
Verifies that the application rejects requests that exceed the MAX_CONTENT_LENGTH,
protecting against Denial of Service (DoS) and memory exhaustion.
"""
import pytest
from app import create_app, db

@pytest.fixture
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "RATE_LIMIT_ENABLED": False,
        "MAX_CONTENT_LENGTH": 1024 * 1024  # Force 1MB for tests
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

def test_request_within_limit(client):
    """Verify that normal-sized payloads are processed successfully."""
    # Create a payload well under 1MB
    payload = {"data": "A" * 1024}  # 1 KB string
    
    response = client.post(
        '/api/auth/login', 
        json=payload
    )
    # It might be 401 or 422 because it's invalid login data, 
    # but it MUST NOT be 413 Payload Too Large
    assert response.status_code != 413

def test_request_exceeds_limit(client):
    """Verify that payloads exceeding MAX_CONTENT_LENGTH are rejected with 413."""
    # Create a payload over 1MB
    payload = {"data": "A" * (2 * 1024 * 1024)}  # 2 MB string
    
    response = client.post(
        '/api/auth/login', 
        json=payload
    )
    
    # 413 Payload Too Large
    assert response.status_code == 413
    assert "payload is too large" in response.json['error']['message'].lower()
