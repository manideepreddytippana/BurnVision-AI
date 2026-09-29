from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.xai_service import XAIService
from app.rate_limiter import limiter, RATE_LIMIT_COMPUTE
from app.schemas import validate_with
from app.schemas.explanation import ShapValuesSchema, GenerateExplanationSchema

explanation_bp = Blueprint('explanation', __name__)

xai_service = XAIService()

@explanation_bp.route('/shap', methods=['POST'])
@limiter.limit(RATE_LIMIT_COMPUTE)
@jwt_required()
@validate_with(ShapValuesSchema)
def get_shap_values(validated_data):

    shap_values = xai_service.calculate_shap_values(
        validated_data['features'], validated_data['prediction']
    )
    
    return jsonify({
        'shap_values': shap_values,
        'feature_importance': xai_service.get_feature_importance(shap_values)
    }), 200

@explanation_bp.route('/generate', methods=['POST'])
@limiter.limit(RATE_LIMIT_COMPUTE)
@jwt_required()
@validate_with(GenerateExplanationSchema)
def generate_explanation(validated_data):

    explanation = xai_service.generate_explanation(
        validated_data['features'], validated_data['prediction']
    )
    
    return jsonify({
        'text': explanation['text'],
        'contributing_factors': explanation['contributing_factors'],
        'confidence': explanation['confidence']
    }), 200
