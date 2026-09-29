"""
Tests for AccountLockoutService
"""
import pytest
from datetime import datetime, timedelta
from app.services.account_lockout_service import AccountLockoutService, get_account_lockout_service

class DummyUser:
    def __init__(self, id=1, email="test@example.com"):
        self.id = id
        self.email = email
        self.failed_login_count = 0
        self.locked_until = None
        self.last_failed_login = None

@pytest.fixture
def service():
    return AccountLockoutService(
        max_failures_before_lockout=5,
        lockout_thresholds={5: 1, 6: 5, 7: 15},
        max_lockout_minutes=120,
        counter_reset_minutes=1440
    )

class TestAccountLockoutService:
    def test_successful_login_resets_counters(self, service):
        user = DummyUser()
        user.failed_login_count = 3
        user.last_failed_login = datetime.utcnow()
        
        service.record_successful_login(user)
        
        assert user.failed_login_count == 0
        assert user.locked_until is None
        assert user.last_failed_login is None

    def test_check_lockout_when_not_locked(self, service):
        user = DummyUser()
        status = service.check_lockout(user)
        assert not status.is_locked
        assert status.failed_attempts == 0

    def test_progressive_lockout(self, service):
        user = DummyUser()
        
        # 4 failed attempts, no lockout
        for _ in range(4):
            status = service.record_failed_attempt(user)
            assert not status.is_locked
            assert user.failed_login_count <= 4
            
        # 5th failed attempt -> 1 min lockout
        status = service.record_failed_attempt(user)
        assert status.is_locked
        assert status.remaining_seconds == 60
        assert user.locked_until is not None
        
        # Fast forward time to expire lockout
        user.locked_until = datetime.utcnow() - timedelta(minutes=1)
        status = service.check_lockout(user)
        assert not status.is_locked
        
        # 6th failed attempt -> 5 min lockout
        status = service.record_failed_attempt(user)
        assert status.is_locked
        assert status.remaining_seconds == 300

    def test_auto_reset_after_inactivity(self, service):
        user = DummyUser()
        user.failed_login_count = 4
        # Last failed login was 25 hours ago
        user.last_failed_login = datetime.utcnow() - timedelta(hours=25)
        
        status = service.check_lockout(user)
        assert not status.is_locked
        assert user.failed_login_count == 0
        assert status.failed_attempts == 0

    def test_admin_unlock(self, service):
        user = DummyUser()
        user.failed_login_count = 6
        user.locked_until = datetime.utcnow() + timedelta(minutes=5)
        user.last_failed_login = datetime.utcnow()
        
        result = service.admin_unlock_account(user)
        assert result['status'] == 'unlocked'
        assert result['was_locked'] is True
        assert user.failed_login_count == 0
        assert user.locked_until is None

    def test_singleton(self):
        s1 = get_account_lockout_service()
        s2 = get_account_lockout_service()
        assert s1 is s2
