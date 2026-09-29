import pytest
from app import create_app, db
from app.models import User, TokenBlocklist
from flask_jwt_extended import create_access_token, decode_token

@pytest.fixture
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "RATE_LIMIT_ENABLED": False
    })

    with app.app_context():
        db.create_all()
        # Create a test user
        user = User(
            email="testlogout@example.com",
            name="Logout Tester",
            age=30,
            gender="male",
            height=175.0,
            weight=70.0,
            fitness_level="intermediate"
        )
        user.set_password("TestP@ss123!")
        db.session.add(user)
        db.session.commit()
        
        yield app

    with app.app_context():
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_logout_blocks_access_token(client, app):
    with app.app_context():
        user = User.query.filter_by(email="testlogout@example.com").first()
        access_token = create_access_token(identity=str(user.id))

    # Should be able to access protected route before logout
    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200

    # Logout
    response = client.post("/api/auth/logout", headers=headers)
    assert response.status_code == 200
    assert response.json["message"] == "Logged out successfully"

    # Should NOT be able to access protected route after logout
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 401
    assert "revoked" in response.json["message"].lower()

def test_logout_with_refresh_token(client, app):
    from flask_jwt_extended import create_refresh_token
    with app.app_context():
        user = User.query.filter_by(email="testlogout@example.com").first()
        refresh_token = create_refresh_token(identity=str(user.id))

    headers = {"Authorization": f"Bearer {refresh_token}"}
    
    # Logout using refresh token
    response = client.post("/api/auth/logout", headers=headers)
    assert response.status_code == 200

    # Should NOT be able to use refresh token after logout
    response = client.post("/api/auth/refresh", headers=headers)
    assert response.status_code == 401
    assert "revoked" in response.json["message"].lower()

def test_blocklist_model(app):
    with app.app_context():
        tb = TokenBlocklist(jti="test-jti-12345")
        db.session.add(tb)
        db.session.commit()

        retrieved = TokenBlocklist.query.filter_by(jti="test-jti-12345").first()
        assert retrieved is not None
        assert retrieved.jti == "test-jti-12345"
        assert retrieved.created_at is not None
