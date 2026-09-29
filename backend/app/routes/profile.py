from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User
from app.rate_limiter import limiter, RATE_LIMIT_READ, RATE_LIMIT_WRITE
from app.schemas import validate_with
from app.schemas.profile import ProfileUpdateSchema

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('', methods=['GET'])
@limiter.limit(RATE_LIMIT_READ)
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200

@profile_bp.route('', methods=['PUT'])
@limiter.limit(RATE_LIMIT_WRITE)
@jwt_required()
@validate_with(ProfileUpdateSchema)
def update_profile(validated_data):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    allowed_fields = ['name', 'age', 'gender', 'height', 'weight', 'fitness_level']
    for field in allowed_fields:
        if field in validated_data:
            setattr(user, field, validated_data[field])
    
    if 'height' in validated_data or 'weight' in validated_data:
        user.calculate_bmi()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200
