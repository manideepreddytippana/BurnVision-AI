from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger(__name__)

DEFAULT_LOCKOUT_THRESHOLDS: Dict[int, int] = {
    5:  1,
    6:  5,
    7:  15,
    8:  30,
    9:  60,
    10: 120,
}

DEFAULT_MAX_FAILURES_BEFORE_LOCKOUT = 5
DEFAULT_LOCKOUT_RESET_AFTER_MINUTES = 1440
DEFAULT_MAX_LOCKOUT_MINUTES = 120

@dataclass
class LockoutStatus:
    is_locked: bool
    failed_attempts: int
    locked_until: Optional[datetime]
    remaining_seconds: int = 0
    message: str = ''

    def to_dict(self) -> Dict[str, Any]:
        result = {
            'is_locked': self.is_locked,
            'failed_attempts': self.failed_attempts,
            'message': self.message,
        }
        if self.is_locked and self.locked_until:
            result['locked_until'] = self.locked_until.isoformat()
            result['remaining_seconds'] = self.remaining_seconds
        return result

class AccountLockoutService:
    def __init__(
        self,
        max_failures_before_lockout: int = DEFAULT_MAX_FAILURES_BEFORE_LOCKOUT,
        lockout_thresholds: Optional[Dict[int, int]] = None,
        max_lockout_minutes: int = DEFAULT_MAX_LOCKOUT_MINUTES,
        counter_reset_minutes: int = DEFAULT_LOCKOUT_RESET_AFTER_MINUTES,
    ):
        self.max_failures = max_failures_before_lockout
        self.lockout_thresholds = lockout_thresholds or DEFAULT_LOCKOUT_THRESHOLDS
        self.max_lockout_minutes = max_lockout_minutes
        self.counter_reset_minutes = counter_reset_minutes

    def check_lockout(self, user) -> LockoutStatus:
        now = datetime.utcnow()
        failed_count = user.failed_login_count or 0

        if (
            user.last_failed_login
            and failed_count > 0
            and (now - user.last_failed_login) > timedelta(minutes=self.counter_reset_minutes)
        ):
            user.failed_login_count = 0
            user.locked_until = None
            return LockoutStatus(
                is_locked=False,
                failed_attempts=0,
                locked_until=None,
                message='',
            )

        if user.locked_until and now < user.locked_until:
            remaining = (user.locked_until - now).total_seconds()
            remaining_minutes = int(remaining / 60) + 1

            return LockoutStatus(
                is_locked=True,
                failed_attempts=failed_count,
                locked_until=user.locked_until,
                remaining_seconds=int(remaining),
                message=(
                    f'Account is temporarily locked due to {failed_count} failed login attempts. '
                    f'Please try again in {remaining_minutes} minute{"s" if remaining_minutes != 1 else ""}.'
                ),
            )

        return LockoutStatus(
            is_locked=False,
            failed_attempts=failed_count,
            locked_until=None,
            message='',
        )

    def record_failed_attempt(self, user, ip_address: Optional[str] = None) -> LockoutStatus:
        
        now = datetime.utcnow()
        user.failed_login_count = (user.failed_login_count or 0) + 1
        user.last_failed_login = now

        failed_count = user.failed_login_count

        logger.warning(
            'Failed login attempt #%d for user_id=%s email=%s ip=%s',
            failed_count, user.id, user.email, ip_address or 'unknown',
        )

        lockout_minutes = self._get_lockout_duration(failed_count)

        if lockout_minutes > 0:
            user.locked_until = now + timedelta(minutes=lockout_minutes)

            logger.warning(
                'Account locked for user_id=%s: %d minutes (attempt #%d)',
                user.id, lockout_minutes, failed_count,
            )

            return LockoutStatus(
                is_locked=True,
                failed_attempts=failed_count,
                locked_until=user.locked_until,
                remaining_seconds=lockout_minutes * 60,
                message=(
                    f'Too many failed login attempts ({failed_count}). '
                    f'Account locked for {lockout_minutes} minute{"s" if lockout_minutes != 1 else ""}.'
                ),
            )

        remaining_attempts = self.max_failures - failed_count
        if remaining_attempts > 0:
            message = (
                f'Invalid credentials. '
                f'{remaining_attempts} attempt{"s" if remaining_attempts != 1 else ""} '
                f'remaining before account lockout.'
            )
        else:
            message = 'Invalid credentials.'

        return LockoutStatus(
            is_locked=False,
            failed_attempts=failed_count,
            locked_until=None,
            message=message,
        )

    def record_successful_login(self, user):
        
        if user.failed_login_count and user.failed_login_count > 0:
            logger.info(
                'Successful login after %d failed attempts for user_id=%s',
                user.failed_login_count, user.id,
            )

        user.failed_login_count = 0
        user.locked_until = None
        user.last_failed_login = None

    def admin_unlock_account(self, user) -> Dict[str, Any]:
        
        previous_failures = user.failed_login_count or 0
        was_locked = user.locked_until and datetime.utcnow() < user.locked_until

        user.failed_login_count = 0
        user.locked_until = None
        user.last_failed_login = None

        logger.info(
            'Admin unlocked account for user_id=%s (was_locked=%s, previous_failures=%d)',
            user.id, was_locked, previous_failures,
        )

        return {
            'user_id': user.id,
            'was_locked': was_locked,
            'previous_failed_attempts': previous_failures,
            'status': 'unlocked',
        }

    def _get_lockout_duration(self, failed_count: int) -> int:
       
        if failed_count < self.max_failures:
            return 0

        duration = 0
        for threshold, minutes in sorted(self.lockout_thresholds.items()):
            if failed_count >= threshold:
                duration = minutes

        return min(duration, self.max_lockout_minutes)

_instance: Optional[AccountLockoutService] = None

def get_account_lockout_service() -> AccountLockoutService:
    """Get or create the singleton AccountLockoutService."""
    global _instance
    if _instance is None:
        _instance = AccountLockoutService()
    return _instance
