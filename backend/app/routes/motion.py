from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.motion_analysis import MotionAnalysisService
from app.rate_limiter import limiter, RATE_LIMIT_COMPUTE
from app.schemas import validate_with
from app.schemas.motion import AnalyzeLandmarksSchema, FormFeedbackSchema, CalorieMappingSchema

motion_bp = Blueprint('motion', __name__)

motion_service = MotionAnalysisService()

@motion_bp.route('/analyze', methods=['POST'])
@limiter.limit(RATE_LIMIT_COMPUTE)
@jwt_required()
@validate_with(AnalyzeLandmarksSchema)
def analyze_landmarks(validated_data):

    analysis = motion_service.analyze_pose(validated_data['landmarks'])
    
    return jsonify({
        'joint_angles': analysis['joint_angles'],
        'velocity': analysis['velocity'],
        'form_score': analysis['form_score'],
        'detected_exercise': analysis['detected_exercise']
    }), 200

@motion_bp.route('/form-feedback', methods=['POST'])
@limiter.limit(RATE_LIMIT_COMPUTE)
@jwt_required()
@validate_with(FormFeedbackSchema)
def get_form_feedback(validated_data):

    feedback = motion_service.get_form_feedback(
        validated_data['landmarks'], validated_data.get('exercise_type', 'general')
    )
    
    return jsonify({
        'feedback': feedback['messages'],
        'form_score': feedback['score'],
        'corrections': feedback['corrections']
    }), 200

@motion_bp.route('/calorie-mapping', methods=['POST'])
@limiter.limit(RATE_LIMIT_COMPUTE)
@jwt_required()
@validate_with(CalorieMappingSchema)
def calculate_calorie_burn(validated_data):

    result = motion_service.calculate_calories(
        validated_data['sequence'],
        validated_data.get('weight', 70),
        validated_data.get('duration', 0)
    )
    
    return jsonify({
        'calories': result['calories'],
        'met_value': result['met_value'],
        'intensity': result['intensity'],
        'breakdown': result['breakdown']
    }), 200
