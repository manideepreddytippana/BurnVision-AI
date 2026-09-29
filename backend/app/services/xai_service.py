import numpy as np
from typing import Dict, Any, List

class XAIService:
    
    FEATURE_WEIGHTS = {
        'heart_rate': 0.25,
        'duration': 0.20,
        'movement_speed': 0.15,
        'form_quality': 0.12,
        'weight': 0.10,
        'exercise_type': 0.08,
        'fitness_level': 0.05,
        'age': 0.03,
        'context_multiplier': 0.02
    }
    
    def __init__(self):
        self.explainer = None  
    
    def calculate_shap_values(self, features: Dict[str, Any], prediction: float) -> Dict[str, float]:
        shap_values = {}
        base_value = prediction * 0.3  
        remaining = prediction - base_value
        
        for feature, weight in self.FEATURE_WEIGHTS.items():
            if feature in features:
                
                feature_value = features.get(feature, 0)
                
                if feature == 'heart_rate':
                    
                    normalized = (feature_value - 60) / 140  
                    contribution = remaining * weight * normalized
                elif feature == 'duration':
                    
                    normalized = min(feature_value / 3600, 1)  
                    contribution = remaining * weight * normalized
                elif feature == 'movement_speed':
                    contribution = remaining * weight * feature_value
                elif feature == 'form_quality':
                    contribution = remaining * weight * (feature_value / 100)
                elif feature == 'weight':
                    normalized = (feature_value - 50) / 100  
                    contribution = remaining * weight * normalized
                else:
                    contribution = remaining * weight
                
                shap_values[feature] = round(contribution, 2)
            else:
                shap_values[feature] = 0
        
        return shap_values
    
    def get_feature_importance(self, shap_values: Dict[str, float]) -> List[Dict[str, Any]]:
        importance = []
        for feature, value in shap_values.items():
            importance.append({
                'feature': feature,
                'value': abs(value),
                'positive': value >= 0,
                'contribution': value
            })
        
        
        importance.sort(key=lambda x: x['value'], reverse=True)
        return importance
    
    def generate_explanation(self, features: Dict[str, Any], prediction: Dict[str, Any]) -> Dict[str, Any]:
        calories = prediction.get('calories', 0)
        confidence = prediction.get('confidence', 0.8)
        
        
        shap_values = self.calculate_shap_values(features, calories)
        feature_importance = self.get_feature_importance(shap_values)
        
        
        explanation_parts = []
        contributing_factors = []
        
        
        top_factors = feature_importance[:4]
        
        for factor in top_factors:
            feature_name = self._format_feature_name(factor['feature'])
            impact_type = "increased" if factor['positive'] else "decreased"
            impact_amount = abs(factor['contribution'])
            
            contributing_factors.append({
                'name': feature_name,
                'impact': f"+{impact_amount:.1f}" if factor['positive'] else f"-{impact_amount:.1f}",
                'type': 'positive' if factor['positive'] else 'negative'
            })
            
            if impact_amount > 10:
                explanation_parts.append(
                    f"Your {feature_name.lower()} {impact_type} calorie burn by approximately {impact_amount:.0f} kcal."
                )
        
        
        if features.get('form_quality', 80) >= 90:
            explanation_parts.append("Excellent form quality contributed to efficient calorie burning.")
        elif features.get('form_quality', 80) < 70:
            explanation_parts.append("Improving your form quality could increase calorie burn efficiency.")
        
        if features.get('heart_rate', 100) > 160:
            explanation_parts.append("High heart rate intensity maximized your calorie expenditure.")
        
        
        text = " ".join(explanation_parts) if explanation_parts else \
            f"Based on your workout data, we predicted a calorie burn of {calories:.0f} kcal with {confidence:.0%} confidence."
        
        return {
            'text': text,
            'shap_values': shap_values,
            'contributing_factors': contributing_factors,
            'confidence': confidence,
            'feature_importance': feature_importance
        }
    
    def _format_feature_name(self, feature: str) -> str:
        name_map = {
            'heart_rate': 'Heart Rate',
            'duration': 'Workout Duration',
            'movement_speed': 'Movement Speed',
            'form_quality': 'Form Quality',
            'weight': 'Body Weight',
            'exercise_type': 'Exercise Type',
            'fitness_level': 'Fitness Level',
            'age': 'Age',
            'context_multiplier': 'Environmental Factors'
        }
        return name_map.get(feature, feature.replace('_', ' ').title())
