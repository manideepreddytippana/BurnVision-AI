"""
Tests for PasswordPolicyService
"""
import pytest
from app.services.password_policy_service import PasswordPolicyService, get_password_policy_service

@pytest.fixture
def service():
    return PasswordPolicyService()

class TestPasswordPolicy:
    def test_valid_strong_password(self, service):
        result = service.validate_password('Str0ngP@ssw0rd!', email='test@example.com', name='John Doe')
        assert result.is_valid
        assert result.strength_score > 60

    def test_too_short(self, service):
        result = service.validate_password('P@ss1', email='test@example.com', name='John')
        assert not result.is_valid
        assert any('8 characters' in err for err in result.errors)

    def test_missing_uppercase(self, service):
        result = service.validate_password('str0ngp@ssw0rd!', email='test@example.com', name='John')
        assert not result.is_valid
        assert any('uppercase' in err for err in result.errors)

    def test_missing_special(self, service):
        result = service.validate_password('Str0ngPassw0rd', email='test@example.com', name='John')
        assert not result.is_valid
        assert any('special character' in err for err in result.errors)

    def test_common_password(self, service):
        result = service.validate_password('P@ssw0rd', email='test@example.com', name='John')
        assert not result.is_valid
        assert any('too common' in err for err in result.errors)

    def test_email_similarity(self, service):
        result = service.validate_password('John123!@#$', email='john@example.com', name='John Doe')
        assert not result.is_valid
        assert any('email' in err.lower() or 'name' in err.lower() for err in result.errors)

    def test_keyboard_sequence(self, service):
        result = service.validate_password('Qwerty!12345', email='test@example.com', name='John')
        assert not result.is_valid
        assert any('keyboard' in err.lower() for err in result.errors)
        
    def test_consecutive_identical(self, service):
        result = service.validate_password('aaaa!1234abcd', email='test@example.com', name='John')
        assert not result.is_valid
        assert any('consecutive' in err.lower() for err in result.errors)

    def test_singleton(self):
        s1 = get_password_policy_service()
        s2 = get_password_policy_service()
        assert s1 is s2
