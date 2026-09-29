import numpy as np
from typing import Dict, Any

class CaloriePredictor:

    MET_VALUES = {
        'walking': 3.5,
        'jogging': 7.0,
        'running': 9.8,
        'cycling': 7.5,
        'swimming': 8.0,
        'hiit': 10.0,
        'strength': 5.0,
        'yoga': 2.5,
        'stretching': 2.3,
        'general': 5.0,
        'cardio': 7.0,
        'crossfit': 9.0,
    }
    
    FITNESS_MULTIPLIERS = {
        'beginner': 0.85,
        'intermediate': 1.0,
        'advanced': 1.1,
        'athlete': 1.2
    }
    
    def __init__(self):
        self.model = None
        
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
       
        weight = features.get('weight', 70)
        duration_minutes = features.get('duration', 0) / 60
        heart_rate = features.get('heart_rate', 100)
        exercise_type = features.get('exercise_type', 'general').lower()
        fitness_level = features.get('fitness_level', 'intermediate')
        form_quality = features.get('form_quality', 80) / 100
        movement_speed = features.get('movement_speed', 1.0)
        context_multiplier = features.get('context_multiplier', 1.0)
        age = features.get('age', 30)
        gender = features.get('gender', 'other')
        
        met = self.MET_VALUES.get(exercise_type, 5.0)
        
        hr_factor = self._calculate_hr_factor(heart_rate, age)
        adjusted_met = met * hr_factor
        
        base_calories = adjusted_met * weight * (duration_minutes / 60)
        
        fitness_multiplier = self.FITNESS_MULTIPLIERS.get(fitness_level, 1.0)
        gender_multiplier = 1.0 if gender == 'male' else 0.9 if gender == 'female' else 0.95
        
        form_factor = 0.8 + (form_quality * 0.4) 
        
        speed_factor = 0.5 + (movement_speed * 0.5) 
        
        predicted_calories = (
            base_calories 
            * fitness_multiplier 
            * gender_multiplier 
            * form_factor 
            * speed_factor 
            * context_multiplier
        )
        
        confidence = self._calculate_confidence(features)
        
        return {
            'calories': round(max(0, predicted_calories), 1),
            'confidence': round(confidence, 2),
            'met_value': round(adjusted_met, 2),
            'breakdown': {
                'base_calories': round(base_calories, 1),
                'fitness_adjustment': fitness_multiplier,
                'form_adjustment': form_factor,
                'speed_adjustment': speed_factor,
                'context_adjustment': context_multiplier
            }
        }
    
    def _calculate_hr_factor(self, heart_rate: float, age: int) -> float:
        max_hr = 220 - age
        hr_percentage = heart_rate / max_hr
        
        if hr_percentage < 0.5:
            return 0.7
        elif hr_percentage < 0.6:
            return 0.85
        elif hr_percentage < 0.7:
            return 1.0
        elif hr_percentage < 0.8:
            return 1.15
        elif hr_percentage < 0.9:
            return 1.3
        else:
            return 1.45
    
    def _calculate_confidence(self, features: Dict[str, Any]) -> float:
        confidence = 0.7 
        
        if features.get('heart_rate'):
            confidence += 0.1
        if features.get('movement_speed'):
            confidence += 0.05
        if features.get('form_quality'):
            confidence += 0.05
        if features.get('duration', 0) > 0:
            confidence += 0.1
        
        return min(confidence, 0.98)
    
    def batch_predict(self, feature_list: list) -> list:
        return [self.predict(f) for f in feature_list]
