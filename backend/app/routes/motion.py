from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.motion_analysis import MotionAnalysisService

motion_bp = Blueprint('motion', __name__)

motion_service = MotionAnalysisService()

@motion_bp.route('/analyze', methods=['POST'])
@jwt_required()
def analyze_landmarks():
    """Analyze pose landmarks and return metrics"""
    data = request.get_json()
    
    landmarks = data.get('landmarks', [])
    if not landmarks:
        return jsonify({'message': 'No landmarks provided'}), 400
    
    
    analysis = motion_service.analyze_pose(landmarks)
    
    return jsonify({
        'joint_angles': analysis['joint_angles'],
        'velocity': analysis['velocity'],
        'form_score': analysis['form_score'],
        'detected_exercise': analysis['detected_exercise']
    }), 200


@motion_bp.route('/form-feedback', methods=['POST'])
@jwt_required()
def get_form_feedback():
    """Get real-time form feedback based on landmarks"""
    data = request.get_json()
    
    landmarks = data.get('landmarks', [])
    exercise_type = data.get('exercise_type', 'general')
    
    if not landmarks:
        return jsonify({'message': 'No landmarks provided'}), 400
    
    
    feedback = motion_service.get_form_feedback(landmarks, exercise_type)
    
    return jsonify({
        'feedback': feedback['messages'],
        'form_score': feedback['score'],
        'corrections': feedback['corrections']
    }), 200


@motion_bp.route('/calorie-mapping', methods=['POST'])
@jwt_required()
def calculate_calorie_burn():
    """Calculate calorie burn from motion sequence"""
    data = request.get_json()
    
    motion_sequence = data.get('sequence', [])
    user_weight = data.get('weight', 70)
    duration = data.get('duration', 0)  
    
    if not motion_sequence:
        return jsonify({'message': 'No motion sequence provided'}), 400
    
    
    result = motion_service.calculate_calories(
        motion_sequence, 
        user_weight, 
        duration
    )
    
    return jsonify({
        'calories': result['calories'],
        'met_value': result['met_value'],
        'intensity': result['intensity'],
        'breakdown': result['breakdown']
    }), 200
