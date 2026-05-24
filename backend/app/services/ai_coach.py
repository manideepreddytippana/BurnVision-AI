from typing import Dict, Any, List
from datetime import datetime, timedelta

class AICoachService:
    """
    AI Coach service providing personalized workout recommendations,
    intensity advice, and rest guidance.
    """
    
    
    WORKOUT_TEMPLATES = {
        'beginner': [
            {'name': 'Easy Walk', 'duration': 20, 'intensity': 'low', 'calories_target': 100},
            {'name': 'Light Stretching', 'duration': 15, 'intensity': 'low', 'calories_target': 50},
            {'name': 'Basic Bodyweight', 'duration': 25, 'intensity': 'moderate', 'calories_target': 150},
        ],
        'intermediate': [
            {'name': 'Moderate Run', 'duration': 30, 'intensity': 'moderate', 'calories_target': 250},
            {'name': 'Strength Circuit', 'duration': 40, 'intensity': 'moderate', 'calories_target': 300},
            {'name': 'HIIT Starter', 'duration': 20, 'intensity': 'high', 'calories_target': 200},
        ],
        'advanced': [
            {'name': 'Interval Training', 'duration': 45, 'intensity': 'high', 'calories_target': 400},
            {'name': 'Heavy Strength', 'duration': 60, 'intensity': 'high', 'calories_target': 350},
            {'name': 'Endurance Run', 'duration': 50, 'intensity': 'moderate', 'calories_target': 450},
        ],
        'athlete': [
            {'name': 'Competition Prep', 'duration': 90, 'intensity': 'high', 'calories_target': 700},
            {'name': 'Max Strength', 'duration': 75, 'intensity': 'very_high', 'calories_target': 500},
            {'name': 'Double Session', 'duration': 120, 'intensity': 'high', 'calories_target': 900},
        ]
    }
    
    def __init__(self):
        pass
    
    def get_recommendations(self, user, recent_workouts: List) -> List[Dict[str, Any]]:
        """
        Generate personalized recommendations based on user profile and history.
        """
        recommendations = []
        fitness_level = user.fitness_level or 'intermediate'
        
        
        workout_days = len(recent_workouts)
        total_calories = sum(w.total_calories or 0 for w in recent_workouts)
        avg_form = sum(w.form_quality_score or 80 for w in recent_workouts) / max(workout_days, 1)
        
        
        if workout_days < 2:
            recommendations.append({
                'id': 1,
                'type': 'frequency',
                'title': 'Increase Workout Frequency',
                'description': f'You\'ve only worked out {workout_days} times recently. Aim for 3-4 sessions per week.',
                'priority': 'high',
                'action': 'Schedule more workouts'
            })
        elif workout_days > 6:
            recommendations.append({
                'id': 2,
                'type': 'rest',
                'title': 'Consider Rest Days',
                'description': 'You\'ve been very active! Remember to include rest for recovery.',
                'priority': 'medium',
                'action': 'Schedule rest day'
            })
        
        
        if avg_form < 75:
            recommendations.append({
                'id': 3,
                'type': 'form',
                'title': 'Focus on Form Quality',
                'description': f'Your average form score is {avg_form:.0f}%. Better form means better results.',
                'priority': 'high',
                'action': 'Review form guides'
            })
        elif avg_form > 90:
            recommendations.append({
                'id': 4,
                'type': 'progress',
                'title': 'Excellent Form!',
                'description': 'Your form quality is outstanding. Consider increasing intensity.',
                'priority': 'low',
                'action': 'Try harder exercises'
            })
        
        
        if total_calories < 1000:
            recommendations.append({
                'id': 5,
                'type': 'intensity',
                'title': 'Boost Your Calorie Burn',
                'description': 'Try adding more intensity or duration to your workouts.',
                'priority': 'medium',
                'action': 'Try HIIT workout'
            })
        
        
        hour = datetime.now().hour
        if 6 <= hour <= 9:
            recommendations.append({
                'id': 6,
                'type': 'timing',
                'title': 'Great Morning Workout Time',
                'description': 'Morning workouts boost metabolism for the rest of the day!',
                'priority': 'info',
                'action': 'Start workout now'
            })
        
        return recommendations[:5]  
    
    def suggest_workout(self, user, goal: str, available_time: int, energy_level: str) -> Dict[str, Any]:
        """
        Suggest a specific workout based on user preferences and current state.
        """
        fitness_level = user.fitness_level or 'intermediate'
        templates = self.WORKOUT_TEMPLATES.get(fitness_level, self.WORKOUT_TEMPLATES['intermediate'])
        
        
        suitable_workouts = [w for w in templates if w['duration'] <= available_time]
        
        if not suitable_workouts:
            
            base = templates[0]
            return {
                'name': f"Quick {base['name']}",
                'duration': available_time,
                'intensity': 'moderate' if energy_level == 'medium' else 'low',
                'exercises': self._generate_exercise_list(goal, available_time, energy_level),
                'calories_target': int(base['calories_target'] * (available_time / base['duration'])),
                'warmup': 3,
                'cooldown': 2,
                'tips': ['Focus on quality over quantity', 'Stay hydrated']
            }
        
        
        if energy_level == 'high':
            workout = max(suitable_workouts, key=lambda x: x['calories_target'])
        elif energy_level == 'low':
            workout = min(suitable_workouts, key=lambda x: x['intensity'] == 'high')
        else:
            workout = suitable_workouts[len(suitable_workouts) // 2]
        
        return {
            'name': workout['name'],
            'duration': workout['duration'],
            'intensity': workout['intensity'],
            'exercises': self._generate_exercise_list(goal, workout['duration'], energy_level),
            'calories_target': workout['calories_target'],
            'warmup': 5,
            'cooldown': 5,
            'tips': self._get_workout_tips(goal, energy_level)
        }
    
    def _generate_exercise_list(self, goal: str, duration: int, energy_level: str) -> List[Dict]:
        """Generate exercise list based on goal and duration"""
        exercises = []
        
        if goal == 'weight_loss' or goal == 'cardio':
            exercises = [
                {'name': 'Jumping Jacks', 'duration': 60, 'reps': None},
                {'name': 'High Knees', 'duration': 45, 'reps': None},
                {'name': 'Burpees', 'duration': 30, 'reps': 10},
                {'name': 'Plank Hold', 'duration': 45, 'reps': None},
            ]
        elif goal == 'strength':
            exercises = [
                {'name': 'Squats', 'duration': 60, 'reps': 15},
                {'name': 'Push-ups', 'duration': 60, 'reps': 12},
                {'name': 'Lunges', 'duration': 60, 'reps': 12},
                {'name': 'Plank', 'duration': 45, 'reps': None},
            ]
        elif goal == 'flexibility':
            exercises = [
                {'name': 'Forward Fold', 'duration': 30, 'reps': None},
                {'name': 'Cat-Cow Stretch', 'duration': 60, 'reps': 10},
                {'name': 'Hip Flexor Stretch', 'duration': 30, 'reps': None},
                {'name': 'Shoulder Stretch', 'duration': 30, 'reps': None},
            ]
        else:
            exercises = [
                {'name': 'Warm-up March', 'duration': 60, 'reps': None},
                {'name': 'Bodyweight Squats', 'duration': 60, 'reps': 15},
                {'name': 'Push-ups', 'duration': 60, 'reps': 10},
                {'name': 'Cool-down Stretch', 'duration': 60, 'reps': None},
            ]
        
        return exercises
    
    def _get_workout_tips(self, goal: str, energy_level: str) -> List[str]:
        """Get tips based on goal and energy level"""
        tips = ['Stay hydrated throughout your workout']
        
        if energy_level == 'low':
            tips.append("Listen to your body and take breaks as needed")
            tips.append("Focus on maintaining good form rather than intensity")
        elif energy_level == 'high':
            tips.append("Push yourself but don't sacrifice form")
            tips.append("Try to minimize rest between sets")
        
        if goal == 'weight_loss':
            tips.append("Keep your heart rate elevated for maximum calorie burn")
        elif goal == 'strength':
            tips.append("Focus on controlled movements and full range of motion")
        
        return tips
    
    def get_intensity_advice(self, user, recent_workouts: List) -> Dict[str, Any]:
        """
        Analyze training patterns and advise on intensity adjustments.
        """
        if not recent_workouts:
            return {
                'current_trend': 'unknown',
                'recommendation': 'Start with moderate intensity and gradually increase',
                'suggested_adjustment': None,
                'reasoning': 'No recent workout data available for analysis'
            }
        
        
        form_scores = [w.form_quality_score or 80 for w in recent_workouts]
        calories_per_workout = [w.total_calories or 0 for w in recent_workouts]
        
        avg_form = sum(form_scores) / len(form_scores)
        avg_calories = sum(calories_per_workout) / len(calories_per_workout)
        
        
        if len(calories_per_workout) >= 3:
            recent_trend = calories_per_workout[-3:]
            if recent_trend[-1] > recent_trend[0] * 1.1:
                trend = 'increasing'
            elif recent_trend[-1] < recent_trend[0] * 0.9:
                trend = 'decreasing'
            else:
                trend = 'stable'
        else:
            trend = 'stable'
        
        
        if avg_form < 75:
            recommendation = 'Reduce intensity and focus on form quality'
            adjustment = -15
        elif trend == 'decreasing' and avg_form > 85:
            recommendation = 'Consider increasing intensity - your form is solid'
            adjustment = 10
        elif trend == 'increasing':
            recommendation = 'Great progress! Maintain current intensity'
            adjustment = 0
        else:
            recommendation = 'Try adding one high-intensity session per week'
            adjustment = 5
        
        return {
            'current_trend': trend,
            'recommendation': recommendation,
            'suggested_adjustment': adjustment,
            'reasoning': f'Based on {len(recent_workouts)} workouts with {avg_form:.0f}% average form',
            'metrics': {
                'avg_form_score': round(avg_form, 1),
                'avg_calories': round(avg_calories, 1),
                'workout_count': len(recent_workouts)
            }
        }
    
    def get_rest_recommendation(self, user, recent_workouts: List) -> Dict[str, Any]:
        """
        Analyze training load and recommend rest days.
        """
        if not recent_workouts:
            return {
                'needs_rest': False,
                'recommended_rest_days': 0,
                'message': 'Start working out to build your fitness base!',
                'fatigue_score': 0
            }
        
        
        now = datetime.utcnow()
        last_7_days = [w for w in recent_workouts 
                       if w.start_time and (now - w.start_time).days <= 7]
        
        consecutive_days = 0
        prev_date = None
        for workout in sorted(last_7_days, key=lambda x: x.start_time, reverse=True):
            if prev_date is None:
                prev_date = workout.start_time.date()
                consecutive_days = 1
            elif (prev_date - workout.start_time.date()).days == 1:
                consecutive_days += 1
                prev_date = workout.start_time.date()
            else:
                break
        
        
        workout_count = len(last_7_days)
        total_intensity = sum(1 for w in last_7_days if (w.total_calories or 0) > 300)
        
        fatigue_score = min(100, (workout_count * 10) + (consecutive_days * 15) + (total_intensity * 10))
        
        
        if consecutive_days >= 5:
            needs_rest = True
            rest_days = 2
            message = "You've trained 5+ consecutive days. Take 2 rest days to recover."
        elif fatigue_score > 70:
            needs_rest = True
            rest_days = 1
            message = "Training load is high. Consider taking a rest day tomorrow."
        elif consecutive_days >= 3 and total_intensity >= 2:
            needs_rest = True
            rest_days = 1
            message = "Good training consistency! An active recovery day would help."
        else:
            needs_rest = False
            rest_days = 0
            message = "You're managing your training load well. Keep it up!"
        
        return {
            'needs_rest': needs_rest,
            'recommended_rest_days': rest_days,
            'message': message,
            'fatigue_score': fatigue_score,
            'training_stats': {
                'workouts_last_7_days': workout_count,
                'consecutive_training_days': consecutive_days,
                'high_intensity_sessions': total_intensity
            }
        }
