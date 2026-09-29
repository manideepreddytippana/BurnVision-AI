import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, CaloriePrediction
from app.services.calorie_ml_service import get_ml_service
from app.rate_limiter import limiter, RATE_LIMIT_COMPUTE, RATE_LIMIT_READ, RATE_LIMIT_WRITE
from app.schemas import validate_with
from app.schemas.prediction import CaloriePredictSchema, TrainModelSchema

logger = logging.getLogger(__name__)

calorie_predict_bp = Blueprint('calorie_predict', __name__)

@calorie_predict_bp.route('/models', methods=['GET'])
@limiter.limit(RATE_LIMIT_READ)
@jwt_required()
def get_available_models():

    try:
        ml_service = get_ml_service()
        models_info = ml_service.get_available_models()
        return jsonify(models_info), 200
    except Exception as e:
        logger.error('get_available_models failed: %s', e, exc_info=True)
        return jsonify({'error': 'Failed to retrieve model information.'}), 500

@calorie_predict_bp.route('/models/comparison', methods=['GET'])
@limiter.limit(RATE_LIMIT_READ)  
@jwt_required()
def get_model_comparison():

    try:
        ml_service = get_ml_service()
        comparison_data = ml_service.get_model_comparison()
        return jsonify(comparison_data), 200
    except Exception as e:
        logger.error('get_model_comparison failed: %s', e, exc_info=True)
        return jsonify({'error': 'Failed to retrieve model comparison data.'}), 500

@calorie_predict_bp.route('/cleanup-custom', methods=['POST'])
@limiter.limit(RATE_LIMIT_WRITE)
@jwt_required()
def cleanup_custom_models():

    try:
        ml_service = get_ml_service()
        result = ml_service.cleanup_custom_models()
        return jsonify(result), 200
    except Exception as e:
        logger.error('cleanup_custom_models failed: %s', e, exc_info=True)
        return jsonify({'error': 'Failed to clean up custom models.'}), 500

@calorie_predict_bp.route('/predict', methods=['POST'])
@limiter.limit(RATE_LIMIT_COMPUTE)
@jwt_required()
@validate_with(CaloriePredictSchema)
def predict_calories(validated_data):

    try:
        user_id = int(get_jwt_identity())
        
        model_type = validated_data.get('model_type', 'ensemble')
        train_split = validated_data.get('train_split', 0.8)
        
        ml_service = get_ml_service()
        result = ml_service.predict(
            features={
                'gender': validated_data['gender'],
                'age': validated_data['age'],
                'height': validated_data['height'],
                'weight': validated_data['weight'],
                'duration': validated_data['duration'],
                'heart_rate': validated_data['heart_rate'],
                'body_temp': validated_data['body_temp']
            },
            model_type=model_type
        )
        
        prediction = CaloriePrediction(
            user_id=user_id,
            gender=validated_data['gender'],
            age=validated_data['age'],
            height=validated_data['height'],
            weight=validated_data['weight'],
            duration=validated_data['duration'],
            heart_rate=validated_data['heart_rate'],
            body_temp=validated_data['body_temp'],
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
        
    except ValueError:
        return jsonify({'error': 'Invalid prediction parameters.'}), 400
    except Exception as e:
        db.session.rollback()
        logger.error('predict_calories failed: %s', e, exc_info=True)
        return jsonify({'error': 'Prediction failed. Please try again later.'}), 500

@calorie_predict_bp.route('/train', methods=['POST'])
@limiter.limit("3 per minute; 20 per hour")
@jwt_required()
@validate_with(TrainModelSchema)
def train_model(validated_data):

    try:
        model_type = validated_data['model_type']
        train_split = validated_data.get('train_split', 0.8)
        
        if model_type == 'ensemble':
            return jsonify({'error': 'Cannot train ensemble directly'}), 400
        
        ml_service = get_ml_service()
        result = ml_service.train_custom_model(model_type, train_split)
        
        return jsonify(result), 200
        
    except ValueError:
        return jsonify({'error': 'Invalid training parameters.'}), 400
    except Exception as e:
        logger.error('train_model failed: %s', e, exc_info=True)
        return jsonify({'error': 'Model training failed. Please try again later.'}), 500

@calorie_predict_bp.route('/history', methods=['GET'])
@limiter.limit(RATE_LIMIT_READ)
@jwt_required()
def get_prediction_history():

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
        logger.error('get_prediction_history failed: %s', e, exc_info=True)
        return jsonify({'error': 'Failed to retrieve prediction history.'}), 500

@calorie_predict_bp.route('/history/<int:prediction_id>', methods=['GET'])
@limiter.limit(RATE_LIMIT_READ)
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
        logger.error('get_prediction_detail failed: %s', e, exc_info=True)
        return jsonify({'error': 'Failed to retrieve prediction details.'}), 500
