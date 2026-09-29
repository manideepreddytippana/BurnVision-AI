"""
Tests for the CalorieValidationService.

Covers:
  - MET formula correctness (matches frontend calculateMETCalories)
  - Per-exercise calorie validation
  - Physiological bounds enforcement
  - Rejection of impossible values
  - Tolerance-based deviation detection
  - End-workout validation
  - Edge cases (zero reps, zero weight, negative values)

These tests import only the validation service module directly,
avoiding the full Flask app initialization.
"""

import sys
import os
import pytest

# Ensure the backend dir is on sys.path so we can import the service
# module directly without triggering the full app __init__.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.calorie_validation_service import (
    CalorieValidationService,
    CalorieValidationResult,
    ValidationSeverity,
    MET_VALUES,
    ABSOLUTE_MAX_CALORIES_PER_MINUTE,
    ABSOLUTE_MAX_TOTAL_SESSION_CALORIES,
    ExerciseType,
    get_calorie_validation_service,
)


@pytest.fixture
def service():
    """Fresh service instance per test (not singleton)."""
    return CalorieValidationService(tolerance=0.20)


class TestMETFormula:
    """Verify the MET formula matches the frontend's calculateMETCalories."""

    def test_formula_matches_frontend(self, service):
        """
        Frontend: (met * 3.5 * weightKg * durationMinutes) / 200
        Example: squat (MET=5.0), 70kg, 10min = (5.0 * 3.5 * 70 * 10) / 200 = 61.25
        """
        result = service._met_formula(met=5.0, weight_kg=70, duration_minutes=10)
        assert result == pytest.approx(61.25, rel=1e-6)

    def test_formula_zero_duration(self, service):
        result = service._met_formula(met=8.0, weight_kg=80, duration_minutes=0)
        assert result == 0.0

    def test_formula_burpee_heavy_user(self, service):
        """Burpee (MET=11.0), 120kg, 5min = (11 * 3.5 * 120 * 5) / 200 = 115.5"""
        result = service._met_formula(met=11.0, weight_kg=120, duration_minutes=5)
        assert result == pytest.approx(115.5, rel=1e-6)


class TestLiveSessionValidation:
    """Test the main validate_live_session method."""

    def _make_payload(self, **overrides):
        """Create a valid minimal payload."""
        base = {
            'squat_reps': 20, 'squat_calories': 5.0,
            'pushup_reps': 0, 'pushup_calories': 0,
            'lunge_reps': 0, 'lunge_calories': 0,
            'jumping_jack_reps': 0, 'jumping_jack_calories': 0,
            'high_knee_reps': 0, 'high_knee_calories': 0,
            'burpee_reps': 0, 'burpee_calories': 0,
            'plank_seconds': 0, 'plank_calories': 0,
            'situp_reps': 0, 'situp_calories': 0,
            'leg_raise_reps': 0, 'leg_raise_calories': 0,
            'bicycle_crunch_reps': 0, 'bicycle_crunch_calories': 0,
            'total_calories': 5.0,
            'active_minutes': 5.0,
        }
        base.update(overrides)
        return base

    def test_valid_session_passes(self, service):
        """A realistic session should pass validation."""
        # Server will recalculate: 20 squats × ~3s/rep = 1 min, MET=5.0, 70kg
        # = (5.0 * 3.5 * 70 * 1) / 200 = 6.125 kcal
        payload = self._make_payload(squat_reps=20, squat_calories=6.0, total_calories=6.0)
        result = service.validate_live_session(payload, user_weight=70.0, active_minutes=5.0)

        assert not result.is_rejected
        assert 'squat_calories' in result.server_calories
        assert result.server_calories['squat_calories'] > 0

    def test_reject_negative_calories(self, service):
        payload = self._make_payload(total_calories=-50)
        result = service.validate_live_session(payload, user_weight=70.0, active_minutes=5.0)

        assert result.is_rejected
        rejected_issues = [i for i in result.issues if i.severity == ValidationSeverity.REJECTED]
        assert len(rejected_issues) > 0

    def test_reject_calories_with_zero_reps(self, service):
        """Claiming 100 calories for 0 reps should be rejected."""
        payload = self._make_payload(squat_reps=0, squat_calories=100.0, total_calories=100.0)
        result = service.validate_live_session(payload, user_weight=70.0, active_minutes=5.0)

        assert result.is_rejected
        rejected_fields = [i.field for i in result.issues if i.severity == ValidationSeverity.REJECTED]
        assert 'squat_calories' in rejected_fields

    def test_reject_impossible_per_rep_rate(self, service):
        """2 squats claiming 500 calories → rejected (250 cal/rep is absurd)."""
        payload = self._make_payload(squat_reps=2, squat_calories=500.0, total_calories=500.0)
        result = service.validate_live_session(payload, user_weight=70.0, active_minutes=5.0)

        assert result.is_rejected

    def test_reject_exceeds_absolute_max(self, service):
        """Total exceeding 5000 kcal → rejected."""
        payload = self._make_payload(total_calories=6000.0)
        result = service.validate_live_session(payload, user_weight=70.0, active_minutes=60.0)

        assert result.is_rejected

    def test_reject_impossible_burn_rate(self, service):
        """500 kcal in 1 minute → 500 kcal/min → rejected."""
        payload = self._make_payload(
            squat_reps=10, squat_calories=500.0, total_calories=500.0
        )
        result = service.validate_live_session(payload, user_weight=70.0, active_minutes=1.0)

        assert result.is_rejected

    def test_reject_invalid_weight_too_low(self, service):
        payload = self._make_payload()
        result = service.validate_live_session(payload, user_weight=5.0, active_minutes=5.0)

        assert result.is_rejected
        assert any(i.field == 'user_weight' for i in result.issues)

    def test_reject_invalid_weight_too_high(self, service):
        payload = self._make_payload()
        result = service.validate_live_session(payload, user_weight=600.0, active_minutes=5.0)

        assert result.is_rejected

    def test_server_recalculates_all_exercises(self, service):
        """All 10 exercises should have server-recalculated values."""
        payload = self._make_payload(
            squat_reps=10, squat_calories=3.0,
            pushup_reps=15, pushup_calories=5.0,
            lunge_reps=8, lunge_calories=2.0,
            jumping_jack_reps=20, jumping_jack_calories=4.0,
            high_knee_reps=30, high_knee_calories=5.0,
            burpee_reps=5, burpee_calories=3.0,
            plank_seconds=60, plank_calories=2.0,
            situp_reps=15, situp_calories=2.0,
            leg_raise_reps=10, leg_raise_calories=1.5,
            bicycle_crunch_reps=20, bicycle_crunch_calories=3.0,
            total_calories=30.5,
        )
        result = service.validate_live_session(payload, user_weight=75.0, active_minutes=15.0)

        assert not result.is_rejected
        # All exercise types should have server values
        for exercise in ExerciseType:
            key = f'{exercise.value}_calories'
            assert key in result.server_calories, f'Missing server value for {key}'

        assert result.server_calories['total_calories'] > 0

    def test_deviation_warning_for_inflated_values(self, service):
        """Client claims 10x server value → should be rejected (per-rep check)."""
        # Server recalc for 10 squats at 70kg ≈ 3.06 kcal
        # Client claims 60 kcal → 6.0 kcal/rep, max is 3.0 → REJECTED
        payload = self._make_payload(squat_reps=10, squat_calories=60.0, total_calories=60.0)
        result = service.validate_live_session(payload, user_weight=70.0, active_minutes=5.0)

        assert result.is_rejected

    def test_moderate_deviation_info(self, service):
        """30% deviation should produce INFO level issue."""
        # Server recalc for 20 squats at 70kg ≈ 6.125 kcal
        # Client claims 8.0 → ~30% deviation
        payload = self._make_payload(squat_reps=20, squat_calories=8.0, total_calories=8.0)
        result = service.validate_live_session(payload, user_weight=70.0, active_minutes=5.0)

        assert not result.is_rejected
        info_issues = [i for i in result.issues if i.severity == ValidationSeverity.INFO]
        assert len(info_issues) > 0

    def test_zero_activity_session_passes(self, service):
        """Empty session (all zeros) should pass."""
        payload = self._make_payload(
            squat_reps=0, squat_calories=0, total_calories=0
        )
        result = service.validate_live_session(payload, user_weight=70.0, active_minutes=0)

        assert not result.is_rejected

    def test_plank_time_based_validation(self, service):
        """Plank uses seconds, not reps. 60s plank at 70kg → should calculate correctly."""
        # Server: MET=3.5, 70kg, 1 min = (3.5 * 3.5 * 70 * 1) / 200 = 4.2875
        payload = self._make_payload(
            squat_reps=0, squat_calories=0,
            plank_seconds=60, plank_calories=4.0,
            total_calories=4.0,
        )
        result = service.validate_live_session(payload, user_weight=70.0, active_minutes=5.0)

        assert not result.is_rejected
        assert result.server_calories['plank_calories'] == pytest.approx(4.2875, rel=0.01)


class TestEndWorkoutValidation:
    """Test the validate_end_workout method."""

    def test_valid_workout_passes(self, service):
        result = service.validate_end_workout(
            client_total_calories=200.0,
            duration_seconds=1800,  # 30 min
            user_weight=70.0,
        )
        assert not result.is_rejected

    def test_reject_negative_calories(self, service):
        result = service.validate_end_workout(
            client_total_calories=-100.0,
            duration_seconds=1800,
            user_weight=70.0,
        )
        assert result.is_rejected

    def test_reject_impossible_rate(self, service):
        """1000 kcal in 1 minute → impossible."""
        result = service.validate_end_workout(
            client_total_calories=1000.0,
            duration_seconds=60,  # 1 min
            user_weight=70.0,
        )
        assert result.is_rejected

    def test_reject_exceeds_max_for_duration(self, service):
        """Claims more than max MET * 1.5 can produce for given duration."""
        # 10 minutes at 70kg, max MET (11.0): (11 * 3.5 * 70 * 10) / 200 * 1.5 = 202.125
        result = service.validate_end_workout(
            client_total_calories=5000.0,
            duration_seconds=600,  # 10 min
            user_weight=70.0,
        )
        assert result.is_rejected

    def test_reject_invalid_weight(self, service):
        result = service.validate_end_workout(
            client_total_calories=100.0,
            duration_seconds=1800,
            user_weight=10.0,  # Below minimum
        )
        assert result.is_rejected


class TestValidationResultSerialization:
    """Test that validation results serialize correctly."""

    def test_to_dict_structure(self, service):
        payload = {
            'squat_reps': 10, 'squat_calories': 3.0,
            'pushup_reps': 0, 'pushup_calories': 0,
            'lunge_reps': 0, 'lunge_calories': 0,
            'jumping_jack_reps': 0, 'jumping_jack_calories': 0,
            'high_knee_reps': 0, 'high_knee_calories': 0,
            'burpee_reps': 0, 'burpee_calories': 0,
            'plank_seconds': 0, 'plank_calories': 0,
            'situp_reps': 0, 'situp_calories': 0,
            'leg_raise_reps': 0, 'leg_raise_calories': 0,
            'bicycle_crunch_reps': 0, 'bicycle_crunch_calories': 0,
            'total_calories': 3.0,
        }
        result = service.validate_live_session(payload, user_weight=70.0, active_minutes=5.0)
        d = result.to_dict()

        assert 'is_valid' in d
        assert 'is_rejected' in d
        assert 'total_server_calories' in d
        assert 'total_client_calories' in d
        assert 'issues_count' in d
        assert 'issues' in d
        assert 'server_calories' in d
        assert isinstance(d['issues'], list)

    def test_issue_to_dict(self, service):
        """Test individual issue serialization."""
        payload = {
            'squat_reps': 0, 'squat_calories': 100.0,
            'pushup_reps': 0, 'pushup_calories': 0,
            'lunge_reps': 0, 'lunge_calories': 0,
            'jumping_jack_reps': 0, 'jumping_jack_calories': 0,
            'high_knee_reps': 0, 'high_knee_calories': 0,
            'burpee_reps': 0, 'burpee_calories': 0,
            'plank_seconds': 0, 'plank_calories': 0,
            'situp_reps': 0, 'situp_calories': 0,
            'leg_raise_reps': 0, 'leg_raise_calories': 0,
            'bicycle_crunch_reps': 0, 'bicycle_crunch_calories': 0,
            'total_calories': 100.0,
        }
        result = service.validate_live_session(payload, user_weight=70.0, active_minutes=5.0)

        assert len(result.issues) > 0
        issue_dict = result.issues[0].to_dict()
        assert 'field' in issue_dict
        assert 'severity' in issue_dict
        assert 'message' in issue_dict
        assert 'client_value' in issue_dict
        assert 'server_value' in issue_dict


class TestSingletonAccessor:
    """Test the singleton accessor."""

    def test_returns_instance(self):
        svc = get_calorie_validation_service()
        assert isinstance(svc, CalorieValidationService)

    def test_returns_same_instance(self):
        svc1 = get_calorie_validation_service()
        svc2 = get_calorie_validation_service()
        assert svc1 is svc2


class TestEdgeCases:
    """Edge case coverage."""

    def test_all_exercises_at_max_reps(self, service):
        """Maxed out reps should still be within plausible bounds."""
        payload = {
            'squat_reps': 500, 'squat_calories': 100.0,
            'pushup_reps': 500, 'pushup_calories': 100.0,
            'lunge_reps': 500, 'lunge_calories': 100.0,
            'jumping_jack_reps': 500, 'jumping_jack_calories': 50.0,
            'high_knee_reps': 500, 'high_knee_calories': 50.0,
            'burpee_reps': 100, 'burpee_calories': 100.0,
            'plank_seconds': 300, 'plank_calories': 20.0,
            'situp_reps': 200, 'situp_calories': 30.0,
            'leg_raise_reps': 200, 'leg_raise_calories': 20.0,
            'bicycle_crunch_reps': 300, 'bicycle_crunch_calories': 30.0,
            'total_calories': 600.0,
        }
        result = service.validate_live_session(payload, user_weight=80.0, active_minutes=60.0)
        # Should not be rejected (high reps in 60 min is plausible)
        assert not result.is_rejected

    def test_very_light_user(self, service):
        """25kg user (child) doing light exercise."""
        payload = {
            'squat_reps': 5, 'squat_calories': 0.5,
            'pushup_reps': 0, 'pushup_calories': 0,
            'lunge_reps': 0, 'lunge_calories': 0,
            'jumping_jack_reps': 0, 'jumping_jack_calories': 0,
            'high_knee_reps': 0, 'high_knee_calories': 0,
            'burpee_reps': 0, 'burpee_calories': 0,
            'plank_seconds': 0, 'plank_calories': 0,
            'situp_reps': 0, 'situp_calories': 0,
            'leg_raise_reps': 0, 'leg_raise_calories': 0,
            'bicycle_crunch_reps': 0, 'bicycle_crunch_calories': 0,
            'total_calories': 0.5,
        }
        result = service.validate_live_session(payload, user_weight=25.0, active_minutes=2.0)
        assert not result.is_rejected

    def test_negative_active_minutes_rejected(self, service):
        payload = {
            'squat_reps': 5, 'squat_calories': 2.0,
            'pushup_reps': 0, 'pushup_calories': 0,
            'lunge_reps': 0, 'lunge_calories': 0,
            'jumping_jack_reps': 0, 'jumping_jack_calories': 0,
            'high_knee_reps': 0, 'high_knee_calories': 0,
            'burpee_reps': 0, 'burpee_calories': 0,
            'plank_seconds': 0, 'plank_calories': 0,
            'situp_reps': 0, 'situp_calories': 0,
            'leg_raise_reps': 0, 'leg_raise_calories': 0,
            'bicycle_crunch_reps': 0, 'bicycle_crunch_calories': 0,
            'total_calories': 2.0,
        }
        result = service.validate_live_session(payload, user_weight=70.0, active_minutes=-5.0)
        assert result.is_rejected
