from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from app import db
from app.models import User
from app.rate_limiter import limiter, RATE_LIMIT_AUTH, RATE_LIMIT_READ, RATE_LIMIT_WRITE
from app.schemas import validate_with
from app.schemas.auth import RegisterSchema, LoginSchema, AdminLoginSchema
from app.services.account_lockout_service import get_account_lockout_service
from app.services.password_policy_service import get_password_policy_service

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
@limiter.limit(RATE_LIMIT_AUTH)
@validate_with(RegisterSchema)
def register(validated_data):
    if User.query.filter_by(email=validated_data['email']).first():
        return jsonify({'message': 'Email already registered'}), 409
    
    policy_service = get_password_policy_service()
    password_validation = policy_service.validate_password(
        password=validated_data['password'],
        email=validated_data['email'],
        name=validated_data['name']
    )
    if not password_validation.is_valid:
        return jsonify({
            'message': 'Password does not meet complexity requirements.',
            'errors': password_validation.errors
        }), 422
    
    user = User(
        email=validated_data['email'],
        name=validated_data['name'],
        age=validated_data.get('age'),
        gender=validated_data.get('gender'),
        height=validated_data.get('height'),
        weight=validated_data.get('weight'),
        fitness_level=validated_data.get('fitness_level'),
        failed_login_count=0
    )
    user.set_password(validated_data['password'])
    user.calculate_bmi()
    
    db.session.add(user)
    db.session.commit()
    
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        'message': 'User registered successfully',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
@limiter.limit(RATE_LIMIT_AUTH)
@validate_with(LoginSchema)
def login(validated_data):
    user = User.query.filter_by(email=validated_data['email']).first()
    
    if not user:
        return jsonify({'message': 'Invalid email or password'}), 401
        
    lockout_service = get_account_lockout_service()
    
    status = lockout_service.check_lockout(user)
    if status.is_locked:
        return jsonify({
            'message': status.message,
            'lockout_status': status.to_dict()
        }), 423
    
    if not user.check_password(validated_data['password']):
        status = lockout_service.record_failed_attempt(user, ip_address=request.remote_addr)
        db.session.commit()
        
        if status.is_locked:
            return jsonify({
                'message': status.message,
                'lockout_status': status.to_dict()
            }), 423
            
        return jsonify({'message': status.message}), 401
    
    lockout_service.record_successful_login(user)
    db.session.commit()
    
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/admin/login', methods=['POST'])
@limiter.limit("3 per minute; 10 per hour")
@validate_with(AdminLoginSchema)
def admin_login(validated_data):
    user = User.query.filter_by(email=validated_data['email']).first()
    
    if not user:
        return jsonify({'message': 'Invalid email or password'}), 401
        
    lockout_service = get_account_lockout_service()
    status = lockout_service.check_lockout(user)
    if status.is_locked:
        return jsonify({
            'message': status.message,
            'lockout_status': status.to_dict()
        }), 423
    
    if not user.check_password(validated_data['password']):
        status = lockout_service.record_failed_attempt(user, ip_address=request.remote_addr)
        db.session.commit()
        if status.is_locked:
            return jsonify({
                'message': status.message,
                'lockout_status': status.to_dict()
            }), 423
        return jsonify({'message': 'Invalid email or password'}), 401
    
    if not user.is_admin:
        return jsonify({'message': 'Not authorized as admin'}), 403
        
    lockout_service.record_successful_login(user)
    db.session.commit()
    
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'access_token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
@limiter.limit(RATE_LIMIT_WRITE)
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=str(identity))
    return jsonify({'access_token': access_token}), 200

@auth_bp.route('/me', methods=['GET'])
@limiter.limit(RATE_LIMIT_READ)
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200

@auth_bp.route('/logout', methods=['POST'])
@limiter.limit(RATE_LIMIT_WRITE)
@jwt_required(verify_type=False)
def logout():
    from flask_jwt_extended import get_jwt
    from app.models import TokenBlocklist
    
    token = get_jwt()
    jti = token["jti"]
    
    db.session.add(TokenBlocklist(jti=jti))
    db.session.commit()
    return jsonify({'message': 'Logged out successfully'}), 200
