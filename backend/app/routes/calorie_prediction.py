"""
Calorie Prediction API Routes
Provides endpoints for ML-based calorie prediction with user authentication.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, CaloriePrediction
from app.services.calorie_ml_service import get_ml_service

calorie_predict_bp = Blueprint('calorie_predict', __name__)


@calorie_predict_bp.route('/models', methods=['GET'])
@jwt_required()
def get_available_models():
    """Get information about available ML models"""
    try:
        ml_service = get_ml_service()
        models_info = ml_service.get_available_models()
        return jsonify(models_info), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@calorie_predict_bp.route('/models/comparison', methods=['GET'])
@jwt_required()
def get_model_comparison():
    """Get comprehensive model comparison data for visualizations"""
    try:
        ml_service = get_ml_service()
        comparison_data = ml_service.get_model_comparison()
        return jsonify(comparison_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@calorie_predict_bp.route('/cleanup-custom', methods=['POST'])
@jwt_required()
def cleanup_custom_models():
    """
    Delete all custom-trained models (those with splits other than 80%).
    Should be called after making a prediction with a custom-trained model.
    """
    try:
        ml_service = get_ml_service()
        result = ml_service.cleanup_custom_models()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@calorie_predict_bp.route('/predict', methods=['POST'])
@jwt_required()
def predict_calories():
    """
    Make a calorie burn prediction
    
    Request body:
    {
        "gender": "male" | "female",
        "age": int,
        "height": float (cm),
        "weight": float (kg),
        "duration": float (minutes),
        "heart_rate": float (bpm),
        "body_temp": float (celsius),
        "model_type": "linear_regression" | "random_forest" | "xgboost" | "lightgbm" | "ensemble"
    }
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        
        required_fields = ['gender', 'age', 'height', 'weight', 'duration', 'heart_rate', 'body_temp']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        
        model_type = data.get('model_type', 'ensemble')
        train_split = data.get('train_split', 0.8)
        
        
        ml_service = get_ml_service()
        result = ml_service.predict(
            features={
                'gender': data['gender'],
                'age': int(data['age']),
                'height': float(data['height']),
                'weight': float(data['weight']),
                'duration': float(data['duration']),
                'heart_rate': float(data['heart_rate']),
                'body_temp': float(data['body_temp'])
            },
            model_type=model_type
        )
        
        
        prediction = CaloriePrediction(
            user_id=user_id,
            gender=data['gender'],
            age=int(data['age']),
            height=float(data['height']),
            weight=float(data['weight']),
            duration=float(data['duration']),
            heart_rate=float(data['heart_rate']),
            body_temp=float(data['body_temp']),
            predicted_calories=result['predicted_calories'],
            confidence_score=result['confidence_score'],
            model_type=model_type,
            train_split=train_split,
            derived_metrics=result['derived_metrics']
        )
        
        db.session.add(prediction)
        db.session.commit()
        
        
        result['prediction_id'] = prediction.id
        
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@calorie_predict_bp.route('/train', methods=['POST'])
@jwt_required()
def train_model():
    """
    Train a model with custom train split
    
    Request body:
    {
        "model_type": "linear_regression" | "random_forest" | "xgboost" | "lightgbm",
        "train_split": float (0.5 to 0.9)
    }
    """
    try:
        data = request.get_json()
        
        model_type = data.get('model_type')
        train_split = data.get('train_split', 0.8)
        
        if not model_type:
            return jsonify({'error': 'model_type is required'}), 400
        
        if model_type == 'ensemble':
            return jsonify({'error': 'Cannot train ensemble directly'}), 400
        
        if not 0.5 <= train_split <= 0.9:
            return jsonify({'error': 'train_split must be between 0.5 and 0.9'}), 400
        
        ml_service = get_ml_service()
        result = ml_service.train_custom_model(model_type, train_split)
        
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@calorie_predict_bp.route('/history', methods=['GET'])
@jwt_required()
def get_prediction_history():
    """Get user's prediction history"""
    try:
        user_id = int(get_jwt_identity())
        
        
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        
        predictions = CaloriePrediction.query.filter_by(user_id=user_id)\
            .order_by(CaloriePrediction.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'predictions': [p.to_dict() for p in predictions.items],
            'total': predictions.total,
            'pages': predictions.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@calorie_predict_bp.route('/history/<int:prediction_id>', methods=['GET'])
@jwt_required()
def get_prediction_detail(prediction_id):
    """Get a specific prediction by ID"""
    try:
        user_id = int(get_jwt_identity())
        
        prediction = CaloriePrediction.query.filter_by(
            id=prediction_id, 
            user_id=user_id
        ).first()
        
        if not prediction:
            return jsonify({'error': 'Prediction not found'}), 404
        
        return jsonify(prediction.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
