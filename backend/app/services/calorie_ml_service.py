import os
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error, explained_variance_score
from typing import Dict, Any, Optional, Tuple
from app.services.data_preprocessor import DataPreprocessor

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("Warning: XGBoost not available")

try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False
    print("Warning: LightGBM not available")

class CalorieMLService:
    
    DEFAULT_TRAIN_SPLIT = 0.8
    MODELS_DIR = Path(__file__).parent.parent / 'models' / 'trained'
    DATASET_DIR = Path(__file__).parent.parent / 'caloriedset' / 'calorie-burnt-15k'
    
    MODEL_TYPES = {
        'linear_regression': 'Linear Regression',
        'random_forest': 'Random Forest',
        'xgboost': 'XGBoost',
        'lightgbm': 'LightGBM',
        'ensemble': 'Ensemble (All Models)'
    }
    
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.label_encoder = LabelEncoder()
        self.is_initialized = False
        self.model_metrics: Dict[str, Dict] = {}
        self.preprocessor = DataPreprocessor(name='standard')
        self._ensure_models_dir()
        self._load_or_train_default_models()
    
    def _ensure_models_dir(self):
        self.MODELS_DIR.mkdir(parents=True, exist_ok=True)
    
    def _load_dataset(self) -> pd.DataFrame:
        exercise_path = self.DATASET_DIR / 'raw_exercise.csv'
        calories_path = self.DATASET_DIR / 'raw_calories.csv'
        
        exercise_df = pd.read_csv(exercise_path)
        calories_df = pd.read_csv(calories_path)
        
        df = pd.merge(exercise_df, calories_df, on='User_ID')
        
        df['Gender_Encoded'] = self.label_encoder.fit_transform(df['Gender'])
        
        return df
    
    
    FEATURE_COLS = ['Gender_Encoded', 'Age', 'Height', 'Weight', 'Duration', 'Heart_Rate', 'Body_Temp']
    
    def _prepare_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        X = df[self.FEATURE_COLS].values
        y = df['Calories'].values
        return X, y
    
    def _get_model_path(self, model_type: str, train_split: float) -> Path:
        split_str = str(int(train_split * 100))
        return self.MODELS_DIR / f'{model_type}_{split_str}.pkl'
    
    def _train_model(self, model_type: str, X_train: np.ndarray, y_train: np.ndarray) -> Any:
        if model_type == 'linear_regression':
            model = LinearRegression()
        elif model_type == 'random_forest':
            model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
        elif model_type == 'xgboost':
            if not XGBOOST_AVAILABLE:
                raise ValueError("XGBoost is not installed")
            model = xgb.XGBRegressor(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42)
        elif model_type == 'lightgbm':
            if not LIGHTGBM_AVAILABLE:
                raise ValueError("LightGBM is not installed")
            model = lgb.LGBMRegressor(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42, verbose=-1)
        else:
            raise ValueError(f"Unknown model type: {model_type}")
        
        model.fit(X_train, y_train)
        return model
    
    def _load_or_train_default_models(self):
        df = self._load_dataset()
        
        preprocessor_path = self.MODELS_DIR / 'preprocessor_standard.pkl'
        X, y = self.preprocessor.preprocess_training_data(
            df, self.FEATURE_COLS, 'Calories'
        )
        self.preprocessor.save(preprocessor_path)
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, train_size=self.DEFAULT_TRAIN_SPLIT, random_state=42
        )
        
        model_types = ['linear_regression', 'random_forest']
        if XGBOOST_AVAILABLE:
            model_types.append('xgboost')
        if LIGHTGBM_AVAILABLE:
            model_types.append('lightgbm')
        
        for model_type in model_types:
            model_path = self._get_model_path(model_type, self.DEFAULT_TRAIN_SPLIT)
            
            if model_path.exists():
                
                self.models[model_type] = joblib.load(model_path)
                print(f"Loaded pre-trained {model_type} model")
            else:
                
                print(f"Training {model_type} model...")
                model = self._train_model(model_type, X_train, y_train)
                joblib.dump(model, model_path)
                self.models[model_type] = model
                print(f"Saved {model_type} model to {model_path}")
                       
            y_pred = self.models[model_type].predict(X_test)
            mae = mean_absolute_error(y_test, y_pred)
            mse = mean_squared_error(y_test, y_pred)
            rmse = np.sqrt(mse)
            r2 = r2_score(y_test, y_pred)
            explained_var = explained_variance_score(y_test, y_pred)
                       
            tolerance = 0.05  
            within_tolerance = np.abs(y_pred - y_test) <= (np.abs(y_test) * tolerance)
            accuracy_pct = np.mean(within_tolerance) * 100           
            
            errors = y_pred - y_test
            if np.std(errors) > 0:
                precision = 1 - (np.std(errors) / np.mean(np.abs(y_test))) 
                precision = max(0, min(1, precision))  
            else:
                precision = 1.0
            
            self.model_metrics[model_type] = {
                'r2_score': round(float(r2), 4),
                'mae': round(float(mae), 2),
                'rmse': round(float(rmse), 2),
                'mse': round(float(mse), 2),
                'explained_variance': round(float(explained_var), 4),
                'accuracy_percentage': round(float(accuracy_pct), 1),
                'precision': round(float(precision), 4),
                'train_split': self.DEFAULT_TRAIN_SPLIT,
                'test_samples': len(y_test),
                'error_std': round(float(np.std(errors)), 2)
            }
        
        encoder_path = self.MODELS_DIR / 'label_encoder.pkl'
        joblib.dump(self.label_encoder, encoder_path)
        
        self.is_initialized = True
    
    def train_custom_model(self, model_type: str, train_split: float) -> Dict[str, Any]:
        if model_type == 'ensemble':
            raise ValueError("Cannot train ensemble directly, train individual models")
        
        df = self._load_dataset()
        
        X, y = self.preprocessor.preprocess_training_data(
            df, self.FEATURE_COLS, 'Calories'
        )
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, train_size=train_split, random_state=42
        )
         
        model = self._train_model(model_type, X_train, y_train)
         
        model_path = self._get_model_path(model_type, train_split)
        joblib.dump(model, model_path)
        
        self.models[model_type] = model
        
        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_test, y_pred)
        explained_var = explained_variance_score(y_test, y_pred)
        
        tolerance = 0.05
        within_tolerance = np.abs(y_pred - y_test) <= (np.abs(y_test) * tolerance)
        accuracy_pct = np.mean(within_tolerance) * 100
        
        errors = y_pred - y_test
        if np.std(errors) > 0:
            precision = 1 - (np.std(errors) / np.mean(np.abs(y_test)))
            precision = max(0, min(1, precision))
        else:
            precision = 1.0
        
        metrics = {
            'r2_score': round(float(r2), 4),
            'mae': round(float(mae), 2),
            'rmse': round(float(rmse), 2),
            'mse': round(float(mse), 2),
            'explained_variance': round(float(explained_var), 4),
            'accuracy_percentage': round(float(accuracy_pct), 1),
            'precision': round(float(precision), 4),
            'train_split': train_split,
            'test_samples': len(y_test),
            'error_std': round(float(np.std(errors)), 2)
        }
        self.model_metrics[model_type] = metrics
        
        return {
            'model_type': model_type,
            'train_split': train_split,
            'metrics': metrics,
            'message': f'Successfully trained {model_type} with {int(train_split*100)}% training data'
        }
    
    def _convert_to_native_types(self, obj: Any) -> Any:
        if isinstance(obj, dict):
            return {key: self._convert_to_native_types(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_to_native_types(item) for item in obj]
        elif isinstance(obj, (np.integer, np.int32, np.int64)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float32, np.float64)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, np.bool_):
            return bool(obj)
        return obj
    
    def predict(self, features: Dict[str, Any], model_type: str = 'ensemble') -> Dict[str, Any]:
        
        gender = features.get('gender', 'male').lower()
        gender_encoded = 0 if gender == 'female' else 1
        
        age = features.get('age', 30)
        height = features.get('height', 170)
        weight = features.get('weight', 70)
        duration = features.get('duration', 30)
        heart_rate = features.get('heart_rate', 100)
        body_temp = features.get('body_temp', 38.5)
        
        X = pd.DataFrame(
            [[gender_encoded, age, height, weight, duration, heart_rate, body_temp]],
            columns=self.FEATURE_COLS
        )
        
        X_scaled = self.preprocessor.preprocess_prediction_input(X.values)
        
        if model_type == 'ensemble':
            predictions = []
            model_weights = []
            for name, model in self.models.items():
                pred = model.predict(X_scaled)[0]
                predictions.append(float(pred))  
                
                model_weight = max(self.model_metrics.get(name, {}).get('r2_score', 0.5), 0.1)
                model_weights.append(model_weight)
            
            total_weight = sum(model_weights)
            predicted_calories = sum(p * w for p, w in zip(predictions, model_weights)) / total_weight
            confidence = sum(model_weights) / len(model_weights)
        else:
            if model_type not in self.models:
                raise ValueError(f"Model {model_type} not available")
            predicted_calories = float(self.models[model_type].predict(X_scaled)[0])  
            confidence = self.model_metrics.get(model_type, {}).get('r2_score', 0.8)
        
        derived_metrics = self._calculate_derived_metrics(
            gender, age, height, weight, duration, heart_rate, body_temp, predicted_calories
        )
        
        derived_metrics = self._convert_to_native_types(derived_metrics)
        
        if model_type == 'ensemble':
            
            all_metrics = [self.model_metrics.get(m, {}) for m in self.models.keys()]
            model_performance = {
                'r2_score': round(sum(m.get('r2_score', 0) for m in all_metrics) / len(all_metrics), 4) if all_metrics else 0,
                'mae': round(sum(m.get('mae', 0) for m in all_metrics) / len(all_metrics), 2) if all_metrics else 0,
                'rmse': round(sum(m.get('rmse', 0) for m in all_metrics) / len(all_metrics), 2) if all_metrics else 0,
                'accuracy_percentage': round(sum(m.get('accuracy_percentage', 0) for m in all_metrics) / len(all_metrics), 1) if all_metrics else 0,
                'precision': round(sum(m.get('precision', 0) for m in all_metrics) / len(all_metrics), 4) if all_metrics else 0,
                'models_used': list(self.models.keys())
            }
        else:
            model_performance = self.model_metrics.get(model_type, {})
        
        return {
            'predicted_calories': round(float(predicted_calories), 1),
            'confidence_score': round(float(confidence), 3),
            'model_type': model_type,
            'derived_metrics': derived_metrics,
            'model_performance': self._convert_to_native_types(model_performance)
        }
    
    def _calculate_derived_metrics(
        self, gender: str, age: int, height: float, weight: float,
        duration: float, heart_rate: float, body_temp: float, calories: float
    ) -> Dict[str, Any]:        
        
        height_m = height / 100
        bmi = round(weight / (height_m ** 2), 1)
        
        if bmi < 18.5:
            bmi_category = 'Underweight'
        elif bmi < 25:
            bmi_category = 'Normal'
        elif bmi < 30:
            bmi_category = 'Overweight'
        else:
            bmi_category = 'Obese'
        
        max_hr = 220 - age
        hr_percent = round((heart_rate / max_hr) * 100, 1)
        
        if hr_percent < 50:
            hr_zone = {'zone': 1, 'label': 'Very Light', 'range': '50-60%'}
        elif hr_percent < 60:
            hr_zone = {'zone': 1, 'label': 'Very Light', 'range': '50-60%'}
        elif hr_percent < 70:
            hr_zone = {'zone': 2, 'label': 'Fat Burn', 'range': '60-70%'}
        elif hr_percent < 80:
            hr_zone = {'zone': 3, 'label': 'Cardio', 'range': '70-80%'}
        elif hr_percent < 90:
            hr_zone = {'zone': 4, 'label': 'Hard', 'range': '80-90%'}
        else:
            hr_zone = {'zone': 5, 'label': 'Max Effort', 'range': '90-100%'}
        
        if hr_percent < 60:
            intensity_level = 'Low'
        elif hr_percent <= 75:
            intensity_level = 'Moderate'
        else:
            intensity_level = 'High'
        
        effort_score = round(heart_rate * duration, 0)
        
        if body_temp < 38:
            temp_category = 'Normal'
        elif body_temp < 39:
            temp_category = 'Elevated'
        else:
            temp_category = 'High'
        
        heat_stress_flag = body_temp > 39
        
        hr_per_min = round(heart_rate / duration, 2) if duration > 0 else 0
        calories_per_min = round(calories / duration, 2) if duration > 0 else 0
        workout_load = round(duration * (hr_percent / 100), 1)
        
        if age < 20:
            age_group = 'Teen'
        elif age <= 35:
            age_group = 'Young Adult'
        elif age <= 50:
            age_group = 'Adult'
        else:
            age_group = 'Senior'
        
        if height < 160:
            height_category = 'Short'
        elif height <= 180:
            height_category = 'Average'
        else:
            height_category = 'Tall'
        
        if duration > 20 and hr_percent < 70:
            fitness_level = 'Advanced'
        elif duration > 15 and hr_percent < 80:
            fitness_level = 'Intermediate'
        else:
            fitness_level = 'Beginner'
        
        risk_flag = hr_percent > 85 and body_temp > 39
        
        if duration < 15 and intensity_level == 'High':
            workout_type = 'HIIT'
        elif duration > 20 and intensity_level == 'Low':
            workout_type = 'Walking'
        elif duration > 20 and intensity_level == 'Moderate':
            workout_type = 'Cardio'
        elif intensity_level == 'High':
            workout_type = 'Strength Training'
        else:
            workout_type = 'General Exercise'
        
        return {
            'bmi': bmi,
            'bmi_category': bmi_category,
            
            'max_heart_rate': max_hr,
            'hr_percentage': hr_percent,
            'hr_zone': hr_zone,            
            'intensity_level': intensity_level,
            'effort_score': effort_score,
            
            'temp_category': temp_category,
            'heat_stress_flag': heat_stress_flag,           
            
            'hr_per_minute': hr_per_min,
            'calories_per_minute': calories_per_min,
            'workout_load': workout_load,
            
            'age_group': age_group,
            'height_category': height_category, 

            'fitness_level': fitness_level,
            'risk_flag': risk_flag,
            'workout_type_predicted': workout_type
        }
    
    def get_available_models(self) -> Dict[str, Any]:
        available = {}
        for model_type, display_name in self.MODEL_TYPES.items():
            if model_type == 'ensemble':
                available[model_type] = {
                    'name': display_name,
                    'available': len(self.models) > 0,
                    'metrics': {
                        'description': 'Weighted average of all models',
                        'models_used': list(self.models.keys())
                    }
                }
            elif model_type in self.models:
                available[model_type] = {
                    'name': display_name,
                    'available': True,
                    'metrics': self.model_metrics.get(model_type, {})
                }
            else:
                available[model_type] = {
                    'name': display_name,
                    'available': False,
                    'reason': 'Model not trained or dependency not installed'
                }
        
        return {
            'models': available,
            'default_train_split': self.DEFAULT_TRAIN_SPLIT,
            'is_initialized': self.is_initialized
        }
    
    def get_model_comparison(self) -> Dict[str, Any]:
        comparison_data = {
            'models': [],
            'metrics': {
                'r2_scores': [],
                'mae_values': [],
                'rmse_values': [],
                'accuracy_values': [],
                'precision_values': []
            }
        }
        
        for model_type in self.models.keys():
            metrics = self.model_metrics.get(model_type, {})
            display_name = self.MODEL_TYPES.get(model_type, model_type)
            
            comparison_data['models'].append({
                'id': model_type,
                'name': display_name,
                'r2_score': metrics.get('r2_score', 0),
                'mae': metrics.get('mae', 0),
                'rmse': metrics.get('rmse', 0),
                'accuracy_percentage': metrics.get('accuracy_percentage', 0),
                'precision': metrics.get('precision', 0),
                'error_std': metrics.get('error_std', 0),
                'train_split': metrics.get('train_split', 0.8)
            })
            
            comparison_data['metrics']['r2_scores'].append({
                'model': display_name,
                'value': metrics.get('r2_score', 0)
            })
            comparison_data['metrics']['mae_values'].append({
                'model': display_name,
                'value': metrics.get('mae', 0)
            })
            comparison_data['metrics']['rmse_values'].append({
                'model': display_name,
                'value': metrics.get('rmse', 0)
            })
            comparison_data['metrics']['accuracy_values'].append({
                'model': display_name,
                'value': metrics.get('accuracy_percentage', 0)
            })
            comparison_data['metrics']['precision_values'].append({
                'model': display_name,
                'value': metrics.get('precision', 0) * 100  
            })
        
        return self._convert_to_native_types(comparison_data)
    
    def cleanup_custom_models(self) -> Dict[str, Any]:
        deleted_files = []
        kept_files = []
        
        
        for model_file in self.MODELS_DIR.glob('*.pkl'):
            filename = model_file.stem  
            
            
            if filename == 'label_encoder':
                kept_files.append(str(model_file.name))
                continue
            
            parts = filename.rsplit('_', 1)
            if len(parts) == 2:
                try:
                    split_pct = int(parts[1])
                    if split_pct != 80:  
                        model_file.unlink()  
                        deleted_files.append(str(model_file.name))
                    else:
                        kept_files.append(str(model_file.name))
                except ValueError:
                    
                    kept_files.append(str(model_file.name))
            else:
                kept_files.append(str(model_file.name))
        
        self.models.clear()
        self.model_metrics.clear()
        self._load_or_train_default_models()
        
        return {
            'success': True,
            'deleted_files': deleted_files,
            'kept_files': kept_files,
            'message': f'Cleaned up {len(deleted_files)} custom model(s), kept {len(kept_files)} default model(s)'
        }

_ml_service: Optional[CalorieMLService] = None

def get_ml_service() -> CalorieMLService:
    global _ml_service
    if _ml_service is None:
        _ml_service = CalorieMLService()
    return _ml_service
