import numpy as np
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

class AnomalyDetectionService:

    THRESHOLDS = {
        'fatigue_score': 75,
        'overtraining_days': 5,
        'injury_risk': 80,
        'form_degradation': 15,
        'velocity_deviation': 2.0
    }
    
    def __init__(self):
        self.isolation_forest = None  
        self.autoencoder = None  
    
    def detect_anomalies(self, user_id: int, workout_history: List, current_metrics: Dict) -> Dict[str, Any]:

        alerts = []
        
        
        overtraining_result = self._check_overtraining(workout_history)
        if overtraining_result['detected']:
            alerts.append({
                'type': 'overtraining',
                'severity': overtraining_result['severity'],
                'message': overtraining_result['message'],
                'suggestion': overtraining_result['suggestion']
            })
        
        fatigue_result = self._check_fatigue(workout_history, current_metrics)
        if fatigue_result['detected']:
            alerts.append({
                'type': 'fatigue',
                'severity': fatigue_result['severity'],
                'message': fatigue_result['message'],
                'suggestion': fatigue_result['suggestion']
            })
            
        injury_result = self._check_injury_risk(current_metrics, workout_history)
        if injury_result['detected']:
            alerts.append({
                'type': 'injury_risk',
                'severity': injury_result['severity'],
                'message': injury_result['message'],
                'suggestion': injury_result['suggestion']
            })
        
        return {
            'alerts': alerts,
            'overall_risk_score': self._calculate_overall_risk(alerts),
            'analysis_timestamp': datetime.utcnow().isoformat()
        }
    
    def _check_overtraining(self, workout_history: List) -> Dict[str, Any]:
        """Detect overtraining syndrome indicators"""
        if not workout_history:
            return {'detected': False}
        
        now = datetime.utcnow()
        last_week = [w for w in workout_history 
                     if w.start_time and (now - w.start_time).days <= 7]
        
        
        high_intensity_days = sum(1 for w in last_week if (w.total_calories or 0) > 400)
        
        consecutive_days = self._count_consecutive_days(workout_history)
        
        form_scores = [w.form_quality_score or 80 for w in last_week]
        if len(form_scores) >= 3:
            recent_avg = sum(form_scores[-3:]) / 3
            earlier_avg = sum(form_scores[:3]) / min(3, len(form_scores))
            performance_decline = earlier_avg - recent_avg
        else:
            performance_decline = 0
        
        if consecutive_days >= self.THRESHOLDS['overtraining_days']:
            if high_intensity_days >= 4:
                return {
                    'detected': True,
                    'severity': 'critical',
                    'message': f'High-intensity training for {consecutive_days} consecutive days detected. Signs of overtraining.',
                    'suggestion': 'Take 2-3 rest days immediately. Consider active recovery activities only.'
                }
            else:
                return {
                    'detected': True,
                    'severity': 'warning',
                    'message': f'Training for {consecutive_days} consecutive days without rest.',
                    'suggestion': 'Schedule a rest day within the next 24 hours.'
                }
        
        if performance_decline > self.THRESHOLDS['form_degradation']:
            return {
                'detected': True,
                'severity': 'warning',
                'message': 'Form quality has declined by {:.0f}% over recent workouts.'.format(performance_decline),
                'suggestion': 'This may indicate accumulated fatigue. Consider reducing workout intensity.'
            }
        
        return {'detected': False}
    
    def _check_fatigue(self, workout_history: List, current_metrics: Dict) -> Dict[str, Any]:
        if not workout_history:
            return {'detected': False}
        
        fatigue_score = 0
        now = datetime.utcnow()
        last_3_days = [w for w in workout_history 
                       if w.start_time and (now - w.start_time).days <= 3]
        
        total_calories_3d = sum(w.total_calories or 0 for w in last_3_days)
        workout_count_3d = len(last_3_days)
        
        if workout_count_3d >= 3:
            fatigue_score += 25
        if total_calories_3d > 1000:
            fatigue_score += 20
        
        form_scores = [w.form_quality_score or 80 for w in workout_history[:5]]
        if form_scores and form_scores[0] - form_scores[-1] > 10:
            fatigue_score += 25
        
        if current_metrics.get('resting_heart_rate', 0) > 80:
            fatigue_score += 15
        
        if current_metrics.get('sleep_hours', 8) < 6:
            fatigue_score += 15
        
        if fatigue_score >= self.THRESHOLDS['fatigue_score']:
            return {
                'detected': True,
                'severity': 'warning',
                'message': f'Elevated fatigue score detected ({fatigue_score}%). Your recovery may be compromised.',
                'suggestion': 'Focus on sleep quality, hydration, and consider lighter workouts for 1-2 days.',
                'score': fatigue_score
            }
        elif fatigue_score >= 50:
            return {
                'detected': True,
                'severity': 'info',
                'message': f'Moderate fatigue level ({fatigue_score}%). Monitor your recovery.',
                'suggestion': 'Ensure adequate sleep and nutrition. Consider reducing workout intensity.',
                'score': fatigue_score
            }
        
        return {'detected': False, 'score': fatigue_score}
    
    def _check_injury_risk(self, current_metrics: Dict, workout_history: List) -> Dict[str, Any]:
        """Detect injury risk indicators"""
        risk_score = 0
        risk_factors = []
        
        form_score = current_metrics.get('form_quality', 80)
        if form_score < 60:
            risk_score += 40
            risk_factors.append('poor form quality')
        elif form_score < 75:
            risk_score += 20
            risk_factors.append('suboptimal form')
        
        
        if current_metrics.get('asymmetry_score', 0) > 15:
            risk_score += 25
            risk_factors.append('movement asymmetry detected')
        
        velocity = current_metrics.get('movement_velocity', 0)
        avg_velocity = current_metrics.get('avg_velocity', velocity)
        if avg_velocity > 0 and abs(velocity - avg_velocity) > avg_velocity * self.THRESHOLDS['velocity_deviation']:
            risk_score += 20
            risk_factors.append('unusual movement speed')
        
        if workout_history and len(workout_history) >= 7:
            recent_load = sum(w.total_calories or 0 for w in workout_history[:3])
            previous_load = sum(w.total_calories or 0 for w in workout_history[3:7])
            if previous_load > 0 and (recent_load / previous_load) > 1.5:
                risk_score += 15
                risk_factors.append('sudden training load increase')
        
        if risk_score >= self.THRESHOLDS['injury_risk']:
            return {
                'detected': True,
                'severity': 'critical',
                'message': f'High injury risk detected! Factors: {", ".join(risk_factors)}',
                'suggestion': 'Stop current exercise and reassess your form. Consider consulting a fitness professional.',
                'score': risk_score,
                'factors': risk_factors
            }
        elif risk_score >= 50:
            return {
                'detected': True,
                'severity': 'warning',
                'message': f'Moderate injury risk: {", ".join(risk_factors)}',
                'suggestion': 'Pay attention to your form and consider reducing intensity.',
                'score': risk_score,
                'factors': risk_factors
            }
        
        return {'detected': False, 'score': risk_score, 'factors': risk_factors}
    
    def _count_consecutive_days(self, workout_history: List) -> int:
        """Count consecutive training days"""
        if not workout_history:
            return 0
        
        sorted_workouts = sorted(
            [w for w in workout_history if w.start_time],
            key=lambda x: x.start_time,
            reverse=True
        )
        
        if not sorted_workouts:
            return 0
        consecutive = 1
        prev_date = sorted_workouts[0].start_time.date()
        
        for workout in sorted_workouts[1:]:
            curr_date = workout.start_time.date()
            if (prev_date - curr_date).days == 1:
                consecutive += 1
                prev_date = curr_date
            elif prev_date != curr_date:
                break
        
        return consecutive
    
    def _calculate_overall_risk(self, alerts: List[Dict]) -> int:
        if not alerts:
            return 0
        
        severity_weights = {'critical': 40, 'warning': 25, 'info': 10}
        
        total_risk = 0
        for alert in alerts:
            weight = severity_weights.get(alert['severity'], 10)
            total_risk += weight
        
        return min(100, total_risk)
    
    def create_alert(self, user_id: int, detection_result: Dict) -> Optional[Dict]:
        if not detection_result.get('detected'):
            return None
        
        return {
            'user_id': user_id,
            'alert_type': detection_result.get('type', 'unknown'),
            'severity': detection_result.get('severity', 'info'),
            'message': detection_result.get('message', ''),
            'suggestion': detection_result.get('suggestion', ''),
            'is_read': False,
            'owner_notified': detection_result.get('severity') == 'critical'
        }
