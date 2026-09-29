from __future__ import annotations

import logging
import math
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

class ExerciseType(str, Enum):
    SQUAT = 'squat'
    PUSHUP = 'pushup'
    LUNGE = 'lunge'
    JUMPING_JACK = 'jumping_jack'
    HIGH_KNEE = 'high_knee'
    BURPEE = 'burpee'
    PLANK = 'plank'
    SITUP = 'situp'
    LEG_RAISE = 'leg_raise'
    BICYCLE_CRUNCH = 'bicycle_crunch'


MET_VALUES: Dict[str, float] = {
    ExerciseType.SQUAT:           5.0,
    ExerciseType.PUSHUP:          8.0,
    ExerciseType.LUNGE:           5.5,
    ExerciseType.JUMPING_JACK:    7.5,
    ExerciseType.HIGH_KNEE:       8.5,
    ExerciseType.BURPEE:         11.0,
    ExerciseType.PLANK:           3.5,
    ExerciseType.SITUP:           4.5,
    ExerciseType.LEG_RAISE:       3.5,
    ExerciseType.BICYCLE_CRUNCH:  5.5,
}

MAX_BURN_RATE_PER_MIN_PER_KG: Dict[str, float] = {
    exercise: (met * 3.5 / 200) * 1.5
    for exercise, met in MET_VALUES.items()
}
ABSOLUTE_MAX_CALORIES_PER_MINUTE = 30.0
ABSOLUTE_MAX_TOTAL_SESSION_CALORIES = 5000.0  
ABSOLUTE_MIN_WEIGHT_KG = 20.0
ABSOLUTE_MAX_WEIGHT_KG = 500.0
ABSOLUTE_MAX_SESSION_MINUTES = 480.0 

MAX_REPS_PER_MINUTE: Dict[str, float] = {
    ExerciseType.SQUAT:          40,
    ExerciseType.PUSHUP:         60,
    ExerciseType.LUNGE:          30,
    ExerciseType.JUMPING_JACK:   80,
    ExerciseType.HIGH_KNEE:     100,
    ExerciseType.BURPEE:         20,
    ExerciseType.SITUP:          50,
    ExerciseType.LEG_RAISE:      40,
    ExerciseType.BICYCLE_CRUNCH: 60,
}

MIN_CALORIES_PER_REP: Dict[str, float] = {
    ExerciseType.SQUAT:          0.1,
    ExerciseType.PUSHUP:         0.1,
    ExerciseType.LUNGE:          0.1,
    ExerciseType.JUMPING_JACK:   0.05,
    ExerciseType.HIGH_KNEE:      0.05,
    ExerciseType.BURPEE:         0.2,
    ExerciseType.SITUP:          0.05,
    ExerciseType.LEG_RAISE:      0.05,
    ExerciseType.BICYCLE_CRUNCH: 0.05,
}

MAX_CALORIES_PER_REP: Dict[str, float] = {
    ExerciseType.SQUAT:          3.0,
    ExerciseType.PUSHUP:         2.5,
    ExerciseType.LUNGE:          3.0,
    ExerciseType.JUMPING_JACK:   1.5,
    ExerciseType.HIGH_KNEE:      1.5,
    ExerciseType.BURPEE:         5.0,
    ExerciseType.SITUP:          1.5,
    ExerciseType.LEG_RAISE:      1.5,
    ExerciseType.BICYCLE_CRUNCH: 1.5,
}

DEFAULT_TOLERANCE = 0.20
class ValidationSeverity(str, Enum):
    INFO = 'info'
    WARNING = 'warning'
    REJECTED = 'rejected'

@dataclass
class ValidationIssue:
    """A single validation finding."""
    field: str
    severity: ValidationSeverity
    message: str
    client_value: float
    server_value: float
    detail: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        result = {
            'field': self.field,
            'severity': self.severity.value,
            'message': self.message,
            'client_value': round(self.client_value, 4),
            'server_value': round(self.server_value, 4),
        }
        if self.detail:
            result['detail'] = self.detail
        return result


@dataclass
class CalorieValidationResult:
    """Complete validation result for a session."""
    is_valid: bool = True
    is_rejected: bool = False
    issues: List[ValidationIssue] = field(default_factory=list)
    server_calories: Dict[str, float] = field(default_factory=dict)
    client_calories: Dict[str, float] = field(default_factory=dict)
    total_server_calories: float = 0.0
    total_client_calories: float = 0.0

    def add_issue(self, issue: ValidationIssue):
        self.issues.append(issue)
        if issue.severity == ValidationSeverity.REJECTED:
            self.is_rejected = True
            self.is_valid = False
        elif issue.severity == ValidationSeverity.WARNING:
            self.is_valid = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            'is_valid': self.is_valid,
            'is_rejected': self.is_rejected,
            'total_server_calories': round(self.total_server_calories, 2),
            'total_client_calories': round(self.total_client_calories, 2),
            'issues_count': len(self.issues),
            'issues': [i.to_dict() for i in self.issues],
            'server_calories': {
                k: round(v, 2) for k, v in self.server_calories.items()
            },
        }


class CalorieValidationService:

    def __init__(self, tolerance: float = DEFAULT_TOLERANCE):
        self.tolerance = tolerance

    def validate_live_session(
        self,
        data: Dict[str, Any],
        user_weight: float,
        active_minutes: float = 0.0,
    ) -> CalorieValidationResult:
        result = CalorieValidationResult()

        if not self._validate_weight(user_weight, result):
            return result

        self._validate_active_minutes(active_minutes, result)

        exercise_configs = self._get_exercise_configs(data)

        total_server_calories = 0.0
        total_client_calories = 0.0

        for exercise_key, config in exercise_configs.items():
            reps = config['reps']
            client_cals = config['client_calories']
            is_time_based = config.get('is_time_based', False)

            server_cals = self._calculate_met_calories(
                exercise_key, user_weight, reps, active_minutes, is_time_based
            )

            result.server_calories[f'{exercise_key.value}_calories'] = server_cals
            result.client_calories[f'{exercise_key.value}_calories'] = client_cals

            total_server_calories += server_cals
            total_client_calories += client_cals

            self._validate_exercise_calories(
                exercise_key, reps, client_cals, server_cals,
                user_weight, active_minutes, is_time_based, result
            )
        client_total = data.get('total_calories', 0)
        result.total_server_calories = total_server_calories
        result.total_client_calories = client_total

        self._validate_total_calories(
            client_total, total_server_calories, total_client_calories,
            user_weight, active_minutes, result
        )

        result.server_calories['total_calories'] = total_server_calories

        return result

    def validate_end_workout(
        self,
        client_total_calories: float,
        duration_seconds: float,
        user_weight: float,
    ) -> CalorieValidationResult:
        result = CalorieValidationResult()

        if not self._validate_weight(user_weight, result):
            return result

        duration_minutes = duration_seconds / 60.0

        max_met = max(MET_VALUES.values())
        max_possible = self._met_formula(max_met, user_weight, duration_minutes)

        max_possible *= 1.5

        result.total_client_calories = client_total_calories
        result.total_server_calories = max_possible

        if client_total_calories > max_possible:
            result.add_issue(ValidationIssue(
                field='total_calories',
                severity=ValidationSeverity.REJECTED,
                message=(
                    f'Reported {client_total_calories:.1f} kcal exceeds physiological '
                    f'maximum of {max_possible:.1f} kcal for {duration_minutes:.1f} min '
                    f'at {user_weight:.1f} kg.'
                ),
                client_value=client_total_calories,
                server_value=max_possible,
                detail='Even elite athletes doing maximal HIIT cannot exceed this threshold.',
            ))

        if client_total_calories < 0:
            result.add_issue(ValidationIssue(
                field='total_calories',
                severity=ValidationSeverity.REJECTED,
                message='Calorie value cannot be negative.',
                client_value=client_total_calories,
                server_value=0,
            ))

        if duration_minutes > 0:
            rate = client_total_calories / duration_minutes
            if rate > ABSOLUTE_MAX_CALORIES_PER_MINUTE:
                result.add_issue(ValidationIssue(
                    field='total_calories',
                    severity=ValidationSeverity.REJECTED,
                    message=(
                        f'Burn rate of {rate:.1f} kcal/min is physiologically impossible. '
                        f'Maximum is {ABSOLUTE_MAX_CALORIES_PER_MINUTE} kcal/min.'
                    ),
                    client_value=rate,
                    server_value=ABSOLUTE_MAX_CALORIES_PER_MINUTE,
                ))

        return result

    @staticmethod
    def _met_formula(met: float, weight_kg: float, duration_minutes: float) -> float:
       
        return (met * 3.5 * weight_kg * duration_minutes) / 200.0

    def _calculate_met_calories(
        self,
        exercise_key: str,
        weight_kg: float,
        reps_or_seconds: int,
        total_active_minutes: float,
        is_time_based: bool = False,
    ) -> float:
        
        if reps_or_seconds <= 0:
            return 0.0

        met = MET_VALUES.get(exercise_key, 5.0)

        if is_time_based:
            # Plank: seconds → minutes
            duration_minutes = reps_or_seconds / 60.0
        else:
            # Rep-based: estimate time per rep (conservative: ~3-5s per rep)
            # We use a heuristic: each rep takes ~3s for fast exercises, ~5s for slow
            seconds_per_rep = self._get_seconds_per_rep(exercise_key)
            duration_minutes = (reps_or_seconds * seconds_per_rep) / 60.0

        return self._met_formula(met, weight_kg, duration_minutes)

    @staticmethod
    def _get_seconds_per_rep(exercise_key: str) -> float:
        
        estimates = {
            ExerciseType.SQUAT:          3.0,
            ExerciseType.PUSHUP:         2.5,
            ExerciseType.LUNGE:          4.0,
            ExerciseType.JUMPING_JACK:   1.5,
            ExerciseType.HIGH_KNEE:      1.0,
            ExerciseType.BURPEE:         5.0,
            ExerciseType.SITUP:          2.5,
            ExerciseType.LEG_RAISE:      3.0,
            ExerciseType.BICYCLE_CRUNCH: 2.0,
        }
        return estimates.get(exercise_key, 3.0)

    def _get_exercise_configs(self, data: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        
        return {
            ExerciseType.SQUAT: {
                'reps': data.get('squat_reps', 0),
                'client_calories': data.get('squat_calories', 0),
            },
            ExerciseType.PUSHUP: {
                'reps': data.get('pushup_reps', 0),
                'client_calories': data.get('pushup_calories', 0),
            },
            ExerciseType.LUNGE: {
                'reps': data.get('lunge_reps', 0),
                'client_calories': data.get('lunge_calories', 0),
            },
            ExerciseType.JUMPING_JACK: {
                'reps': data.get('jumping_jack_reps', 0),
                'client_calories': data.get('jumping_jack_calories', 0),
            },
            ExerciseType.HIGH_KNEE: {
                'reps': data.get('high_knee_reps', 0),
                'client_calories': data.get('high_knee_calories', 0),
            },
            ExerciseType.BURPEE: {
                'reps': data.get('burpee_reps', 0),
                'client_calories': data.get('burpee_calories', 0),
            },
            ExerciseType.PLANK: {
                'reps': data.get('plank_seconds', 0),
                'client_calories': data.get('plank_calories', 0),
                'is_time_based': True,
            },
            ExerciseType.SITUP: {
                'reps': data.get('situp_reps', 0),
                'client_calories': data.get('situp_calories', 0),
            },
            ExerciseType.LEG_RAISE: {
                'reps': data.get('leg_raise_reps', 0),
                'client_calories': data.get('leg_raise_calories', 0),
            },
            ExerciseType.BICYCLE_CRUNCH: {
                'reps': data.get('bicycle_crunch_reps', 0),
                'client_calories': data.get('bicycle_crunch_calories', 0),
            },
        }

    def _validate_weight(self, weight: float, result: CalorieValidationResult) -> bool:
        if weight < ABSOLUTE_MIN_WEIGHT_KG:
            result.add_issue(ValidationIssue(
                field='user_weight',
                severity=ValidationSeverity.REJECTED,
                message=f'Weight {weight} kg is below minimum ({ABSOLUTE_MIN_WEIGHT_KG} kg).',
                client_value=weight,
                server_value=ABSOLUTE_MIN_WEIGHT_KG,
            ))
            return False
        if weight > ABSOLUTE_MAX_WEIGHT_KG:
            result.add_issue(ValidationIssue(
                field='user_weight',
                severity=ValidationSeverity.REJECTED,
                message=f'Weight {weight} kg exceeds maximum ({ABSOLUTE_MAX_WEIGHT_KG} kg).',
                client_value=weight,
                server_value=ABSOLUTE_MAX_WEIGHT_KG,
            ))
            return False
        return True

    def _validate_active_minutes(
        self, active_minutes: float, result: CalorieValidationResult
    ):

        if active_minutes > ABSOLUTE_MAX_SESSION_MINUTES:
            result.add_issue(ValidationIssue(
                field='active_minutes',
                severity=ValidationSeverity.WARNING,
                message=(
                    f'Session duration {active_minutes:.1f} min exceeds '
                    f'maximum of {ABSOLUTE_MAX_SESSION_MINUTES} min.'
                ),
                client_value=active_minutes,
                server_value=ABSOLUTE_MAX_SESSION_MINUTES,
            ))
        if active_minutes < 0:
            result.add_issue(ValidationIssue(
                field='active_minutes',
                severity=ValidationSeverity.REJECTED,
                message='Active minutes cannot be negative.',
                client_value=active_minutes,
                server_value=0,
            ))

    def _validate_exercise_calories(
        self,
        exercise_key: str,
        reps: int,
        client_cals: float,
        server_cals: float,
        weight_kg: float,
        active_minutes: float,
        is_time_based: bool,
        result: CalorieValidationResult,
    ):
        cal_field = f'{exercise_key.value}_calories'

        if reps <= 0 and client_cals > 0:
            result.add_issue(ValidationIssue(
                field=cal_field,
                severity=ValidationSeverity.REJECTED,
                message=(
                    f'{exercise_key.value}: {client_cals:.2f} kcal claimed '
                    f'but 0 reps/seconds recorded.'
                ),
                client_value=client_cals,
                server_value=0,
            ))
            return

        if reps <= 0 and client_cals <= 0:
            return

        if not is_time_based and reps > 0:
            cals_per_rep = client_cals / reps
            max_per_rep = MAX_CALORIES_PER_REP.get(exercise_key, 5.0)

            if cals_per_rep > max_per_rep:
                result.add_issue(ValidationIssue(
                    field=cal_field,
                    severity=ValidationSeverity.REJECTED,
                    message=(
                        f'{exercise_key.value}: {cals_per_rep:.3f} kcal/rep exceeds '
                        f'physiological maximum of {max_per_rep} kcal/rep.'
                    ),
                    client_value=client_cals,
                    server_value=server_cals,
                    detail=f'At {reps} reps, max plausible = {max_per_rep * reps:.2f} kcal.',
                ))
                return

        if server_cals > 0:
            deviation = abs(client_cals - server_cals) / server_cals
        elif client_cals > 0:
            deviation = 1.0
        else:
            deviation = 0.0

        if deviation > 1.0:
            result.add_issue(ValidationIssue(
                field=cal_field,
                severity=ValidationSeverity.WARNING,
                message=(
                    f'{exercise_key.value}: Client value {client_cals:.2f} deviates '
                    f'{deviation:.0%} from server-calculated {server_cals:.2f}. '
                    f'Value will be overridden.'
                ),
                client_value=client_cals,
                server_value=server_cals,
                detail=(
                    'Large deviation indicates either timing discrepancy or '
                    'data manipulation. Server value used.'
                ),
            ))
        elif deviation > self.tolerance:
            result.add_issue(ValidationIssue(
                field=cal_field,
                severity=ValidationSeverity.INFO,
                message=(
                    f'{exercise_key.value}: Client {client_cals:.2f} differs from '
                    f'server {server_cals:.2f} by {deviation:.0%}. '
                    f'Server value applied.'
                ),
                client_value=client_cals,
                server_value=server_cals,
            ))

    def _validate_total_calories(
        self,
        client_total: float,
        server_total: float,
        sum_of_client_parts: float,
        weight_kg: float,
        active_minutes: float,
        result: CalorieValidationResult,
    ):
        if client_total < 0:
            result.add_issue(ValidationIssue(
                field='total_calories',
                severity=ValidationSeverity.REJECTED,
                message='Total calories cannot be negative.',
                client_value=client_total,
                server_value=0,
            ))
            return

        if client_total > ABSOLUTE_MAX_TOTAL_SESSION_CALORIES:
            result.add_issue(ValidationIssue(
                field='total_calories',
                severity=ValidationSeverity.REJECTED,
                message=(
                    f'Total {client_total:.1f} kcal exceeds absolute session '
                    f'maximum of {ABSOLUTE_MAX_TOTAL_SESSION_CALORIES} kcal.'
                ),
                client_value=client_total,
                server_value=server_total,
            ))
            return

        if active_minutes > 0:
            rate = client_total / active_minutes
            if rate > ABSOLUTE_MAX_CALORIES_PER_MINUTE:
                result.add_issue(ValidationIssue(
                    field='total_calories',
                    severity=ValidationSeverity.REJECTED,
                    message=(
                        f'Burn rate {rate:.1f} kcal/min exceeds physiological '
                        f'maximum of {ABSOLUTE_MAX_CALORIES_PER_MINUTE} kcal/min.'
                    ),
                    client_value=rate,
                    server_value=ABSOLUTE_MAX_CALORIES_PER_MINUTE,
                ))
                return

        if sum_of_client_parts > 0:
            parts_diff = abs(client_total - sum_of_client_parts)
            if parts_diff > 1.0:
                result.add_issue(ValidationIssue(
                    field='total_calories',
                    severity=ValidationSeverity.INFO,
                    message=(
                        f'Client total {client_total:.2f} does not match sum of '
                        f'exercise calories {sum_of_client_parts:.2f}. '
                        f'Server-recalculated total used.'
                    ),
                    client_value=client_total,
                    server_value=server_total,
                ))

_instance: Optional[CalorieValidationService] = None

def get_calorie_validation_service(
    tolerance: float = DEFAULT_TOLERANCE,
) -> CalorieValidationService:

    global _instance
    if _instance is None:
        _instance = CalorieValidationService(tolerance=tolerance)
    return _instance
