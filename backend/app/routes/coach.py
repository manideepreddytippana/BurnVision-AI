from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User, Workout
from app.services.ai_coach import AICoachService
from app.rate_limiter import limiter, RATE_LIMIT_COMPUTE
from app.schemas import validate_with
from app.schemas.coach import SuggestWorkoutSchema

coach_bp = Blueprint('coach', __name__)

coach_service = AICoachService()

@coach_bp.route('/recommendations', methods=['GET'])
@limiter.limit(RATE_LIMIT_COMPUTE)
@jwt_required()
def get_recommendations():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    
    recent_workouts = Workout.query.filter_by(user_id=user_id)\
        .order_by(Workout.start_time.desc()).limit(10).all()
    
    
    recommendations = coach_service.get_recommendations(user, recent_workouts)
    
    return jsonify({
        'recommendations': recommendations
    }), 200

@coach_bp.route('/suggest-workout', methods=['POST'])
@limiter.limit(RATE_LIMIT_COMPUTE)
@jwt_required()
@validate_with(SuggestWorkoutSchema)
def suggest_workout(validated_data):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    suggestion = coach_service.suggest_workout(
        user=user,
        goal=validated_data.get('goal', 'general'),
        available_time=validated_data.get('available_time', 30),
        energy_level=validated_data.get('energy_level', 'medium')
    )
    
    return jsonify({
        'suggestion': suggestion
    }), 200

@coach_bp.route('/intensity-advice', methods=['GET'])
@limiter.limit(RATE_LIMIT_COMPUTE)
@jwt_required()
def get_intensity_advice():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    recent_workouts = Workout.query.filter_by(user_id=user_id)\
        .order_by(Workout.start_time.desc()).limit(7).all()
    
    advice = coach_service.get_intensity_advice(user, recent_workouts)
    
    return jsonify({
        'advice': advice
    }), 200

@coach_bp.route('/rest-recommendation', methods=['GET'])
@limiter.limit(RATE_LIMIT_COMPUTE)
@jwt_required()
def get_rest_recommendation():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    recent_workouts = Workout.query.filter_by(user_id=user_id)\
        .order_by(Workout.start_time.desc()).limit(14).all()
    
    recommendation = coach_service.get_rest_recommendation(user, recent_workouts)
    
    return jsonify({
        'recommendation': recommendation
    }), 200
