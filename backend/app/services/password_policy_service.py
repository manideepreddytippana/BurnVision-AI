
from __future__ import annotations

import re
import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

COMMON_WEAK_PASSWORDS = frozenset({
    'password', 'password1', 'password123', 'password1234',
    '12345678', '123456789', '1234567890', '12345678901',
    'qwerty123', 'qwertyuiop', 'letmein123',
    'admin1234', 'admin12345', 'administrator',
    'welcome123', 'welcome1234',
    'changeme1', 'changeme123',
    'iloveyou1', 'trustno1',
    'sunshine1', 'princess1', 'football1', 'baseball1',
    'abc12345', 'abc123456', 'abcdefgh',
    'monkey123', 'dragon123', 'master123', 'shadow123',
    'passw0rd', 'p@ssw0rd', 'p@ssword', 'pa$$word',
    'burnvision', 'burnvision1', 'burnvision123',
    'workout123', 'fitness123', 'exercise123',
    'qwerty12', 'asdfghjk', 'zxcvbnm1',
    '11111111', '22222222', '00000000', '99999999',
    'aaaaaaaa', 'aaaaaaaaa',
})

@dataclass
class PasswordValidationResult:
    is_valid: bool = True
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    strength_score: int = 0  # 0-100
    strength_label: str = 'weak'

    def add_error(self, message: str):
        self.errors.append(message)
        self.is_valid = False

    def add_warning(self, message: str):
        self.warnings.append(message)

    def to_dict(self) -> Dict[str, Any]:
        return {
            'is_valid': self.is_valid,
            'errors': self.errors,
            'warnings': self.warnings,
            'strength_score': self.strength_score,
            'strength_label': self.strength_label,
        }

class PasswordPolicyService:
    def __init__(self):
        self.min_length = 8
        self.max_length = 128
        self.require_uppercase = True
        self.require_lowercase = True
        self.require_digit = True
        self.require_special = True
        self.max_consecutive_identical = 3
        self.check_common_passwords = True
        self.check_user_context = True
        self._keyboard_sequences = [
            'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
            '1234567890', '0987654321'
        ]

    def validate_password(
        self, password: str, email: Optional[str] = None, name: Optional[str] = None
    ) -> PasswordValidationResult:
        result = PasswordValidationResult()

        if not password:
            result.add_error('Password is required.')
            return result

        if len(password) < self.min_length:
            result.add_error(
                f'Password must be at least {self.min_length} characters long.'
            )

        if len(password) > self.max_length:
            result.add_error(
                f'Password must not exceed {self.max_length} characters.'
            )

        if self.require_uppercase and not re.search(r'[A-Z]', password):
            result.add_error(
                'Password must contain at least one uppercase letter (A-Z).'
            )

        if self.require_lowercase and not re.search(r'[a-z]', password):
            result.add_error(
                'Password must contain at least one lowercase letter (a-z).'
            )

        if self.require_digit and not re.search(r'[0-9]', password):
            result.add_error(
                'Password must contain at least one digit (0-9).'
            )

        if self.require_special and not re.search(
            r'[!@#$%^&*()_+\-=\[\]{}|;:\'",.<>?/\\`~]', password
        ):
            result.add_error(
                'Password must contain at least one special character '
                '(!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\`~).'
            )

        if self.max_consecutive_identical > 0:
            pattern = r'(.)\1{' + str(self.max_consecutive_identical) + r',}'
            if re.search(pattern, password):
                result.add_error(
                    f'Password must not contain more than '
                    f'{self.max_consecutive_identical} consecutive identical characters.'
                )

        if self.check_common_passwords:
            if password.lower() in COMMON_WEAK_PASSWORDS:
                result.add_error(
                    'This password is too common and easily guessed. '
                    'Please choose a more unique password.'
                )

        if self.check_user_context:
            self._check_context_similarity(password, email, name, result)

        self._check_keyboard_sequences(password, result)
        result.strength_score = self._calculate_strength(password)
        result.strength_label = self._strength_label(result.strength_score)

        if result.is_valid and result.strength_score < 60:
            result.add_warning(
                'Your password meets minimum requirements but could be stronger. '
                'Consider making it longer or adding more variety.'
            )

        return result

    def get_policy_description(self) -> Dict[str, Any]:
       
        rules = []
        rules.append(f'At least {self.min_length} characters long')
        rules.append(f'No more than {self.max_length} characters')
        if self.require_uppercase:
            rules.append('At least one uppercase letter (A-Z)')
        if self.require_lowercase:
            rules.append('At least one lowercase letter (a-z)')
        if self.require_digit:
            rules.append('At least one digit (0-9)')
        if self.require_special:
            rules.append('At least one special character (!@#$%^&*...)')
        if self.max_consecutive_identical > 0:
            rules.append(
                f'No more than {self.max_consecutive_identical} '
                f'consecutive identical characters'
            )
        if self.check_common_passwords:
            rules.append('Must not be a commonly used password')
        if self.check_user_context:
            rules.append('Must not be similar to your email or name')

        return {
            'min_length': self.min_length,
            'max_length': self.max_length,
            'rules': rules,
        }

    def _check_context_similarity(
        self,
        password: str,
        email: Optional[str],
        name: Optional[str],
        result: PasswordValidationResult,
    ):
        pw_lower = password.lower()

        if email:
            local_part = email.split('@')[0].lower()
            if len(local_part) >= 4 and local_part in pw_lower:
                result.add_error(
                    'Password must not contain your email address.'
                )
            elif len(pw_lower) >= 4 and pw_lower in local_part:
                result.add_error(
                    'Password is too similar to your email address.'
                )

        if name:
            name_lower = name.lower().strip()
            name_parts = [p for p in name_lower.split() if len(p) >= 4]
            for part in name_parts:
                if part in pw_lower:
                    result.add_error(
                        'Password must not contain your name.'
                    )
                    break

    def _check_keyboard_sequences(
        self, password: str, result: PasswordValidationResult
    ):
        pw_lower = password.lower()
        for seq in self._keyboard_sequences:
            for i in range(len(seq) - 3):
                substring = seq[i:i + 4]
                if substring in pw_lower:
                    result.add_error(
                        'Password must not contain keyboard patterns '
                        f'(e.g., "{substring}").'
                    )
                    return
            seq_rev = seq[::-1]
            for i in range(len(seq_rev) - 3):
                substring = seq_rev[i:i + 4]
                if substring in pw_lower:
                    result.add_error(
                        'Password must not contain keyboard patterns '
                        f'(e.g., "{substring}").'
                    )
                    return

    def _calculate_strength(self, password: str) -> int:
        score = 0

        length = len(password)
        if length >= 16:
            score += 30
        elif length >= 12:
            score += 25
        elif length >= 10:
            score += 20
        elif length >= 8:
            score += 15
        else:
            score += max(0, length * 2)

        has_upper = bool(re.search(r'[A-Z]', password))
        has_lower = bool(re.search(r'[a-z]', password))
        has_digit = bool(re.search(r'[0-9]', password))
        has_special = bool(re.search(r'[^A-Za-z0-9]', password))

        variety_count = sum([has_upper, has_lower, has_digit, has_special])
        score += variety_count * 10

        if length > 0:
            unique_ratio = len(set(password)) / length
            score += int(unique_ratio * 15)
        pw_lower = password.lower()
        has_pattern = False
        for seq in self._keyboard_sequences:
            for i in range(len(seq) - 3):
                if seq[i:i + 4] in pw_lower:
                    has_pattern = True
                    break
            if has_pattern:
                break

        if not has_pattern:
            score += 15

        return min(100, score)

    @staticmethod
    def _strength_label(score: int) -> str:
        if score >= 80:
            return 'strong'
        elif score >= 60:
            return 'good'
        elif score >= 40:
            return 'fair'
        else:
            return 'weak'

_instance: Optional[PasswordPolicyService] = None

def get_password_policy_service() -> PasswordPolicyService:
    global _instance
    if _instance is None:
        _instance = PasswordPolicyService()
    return _instance
