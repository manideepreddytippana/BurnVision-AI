from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Prediction, Workout, User
from app.services.calorie_predictor import CaloriePredictor
from app.services.xai_service import XAIService
from app.rate_limiter import limiter, RATE_LIMIT_COMPUTE, RATE_LIMIT_READ
from app.schemas import validate_with
from app.schemas.prediction import MakePredictionSchema

prediction_bp = Blueprint('prediction', __name__)

predictor = CaloriePredictor()
xai_service = XAIService()

@prediction_bp.route('', methods=['POST'])
@limiter.limit(RATE_LIMIT_COMPUTE)
@jwt_required()
@validate_with(MakePredictionSchema)
def make_prediction(validated_data):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    workout_id = validated_data.get('workout_id')
    workout = Workout.query.get(workout_id) if workout_id else None
    
    features = {
        'weight': user.weight or 70,
        'height': user.height or 170,
        'age': user.age or 30,
        'gender': user.gender or 'other',
        'fitness_level': user.fitness_level or 'intermediate',
        'duration': validated_data.get('duration', 0),
        'heart_rate': validated_data.get('heart_rate', 100),
        'movement_speed': validated_data.get('movement_speed', 1.0),
        'form_quality': validated_data.get('form_quality', 80),
        'exercise_type': validated_data.get('exercise_type', 'general'),
        'context_multiplier': validated_data.get('context_multiplier', 1.0)
    }
    prediction_result = predictor.predict(features)
    explanation = xai_service.generate_explanation(features, prediction_result)
    
    prediction = Prediction(
        workout_id=workout_id,
        user_id=user_id,
        predicted_calories=prediction_result['calories'],
        confidence_score=prediction_result['confidence'],
        shap_values=explanation['shap_values'],
        explanation=explanation['text']
    )
    
    db.session.add(prediction)
    db.session.commit()
    return jsonify({
        'prediction': prediction.to_dict(),
        'explanation': explanation
    }), 200

@prediction_bp.route('/<int:prediction_id>/explanation', methods=['GET'])
@limiter.limit(RATE_LIMIT_READ) 
@jwt_required()
def get_explanation(prediction_id):
    user_id = int(get_jwt_identity())
    prediction = Prediction.query.filter_by(id=prediction_id, user_id=user_id).first()
    
    if not prediction:
        return jsonify({'message': 'Prediction not found'}), 404
    
    return jsonify({
        'prediction': prediction.to_dict(),
        'explanation': {
            'shap_values': prediction.shap_values,
            'text': prediction.explanation
        }
    }), 200

@prediction_bp.route('/history', methods=['GET'])
@limiter.limit(RATE_LIMIT_READ)
@jwt_required()
def get_prediction_history():
    user_id = int(get_jwt_identity())
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    predictions = Prediction.query.filter_by(user_id=user_id)\
        .order_by(Prediction.created_at.desc())\
        .paginate(page=page, per_page=per_page)
    
    return jsonify({
        'predictions': [p.to_dict() for p in predictions.items],
        'total': predictions.total,
        'pages': predictions.pages,
        'current_page': page
    }), 200
