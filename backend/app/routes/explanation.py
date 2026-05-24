from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.xai_service import XAIService

explanation_bp = Blueprint('explanation', __name__)

xai_service = XAIService()

@explanation_bp.route('/shap', methods=['POST'])
@jwt_required()
def get_shap_values():
    """Get SHAP values for a prediction"""
    data = request.get_json()
    features = data.get('features', {})
    prediction = data.get('prediction')
    
    if not features or prediction is None:
        return jsonify({'message': 'Features and prediction are required'}), 400
    
    shap_values = xai_service.calculate_shap_values(features, prediction)
    
    return jsonify({
        'shap_values': shap_values,
        'feature_importance': xai_service.get_feature_importance(shap_values)
    }), 200


@explanation_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_explanation():
    """Generate human-readable explanation"""
    data = request.get_json()
    features = data.get('features', {})
    prediction = data.get('prediction', {})
    
    explanation = xai_service.generate_explanation(features, prediction)
    
    return jsonify({
        'text': explanation['text'],
        'contributing_factors': explanation['contributing_factors'],
        'confidence': explanation['confidence']
    }), 200
