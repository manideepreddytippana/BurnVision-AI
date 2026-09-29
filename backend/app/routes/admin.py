from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, Room, Workout, Alert, LiveWorkoutSession, ExerciseStatistics, CaloriePrediction, AdvancedCaloriePrediction
from functools import wraps
from datetime import datetime, timedelta
from sqlalchemy import func
from app.rate_limiter import limiter, RATE_LIMIT_ADMIN, RATE_LIMIT_READ, RATE_LIMIT_WRITE
from app.schemas import validate_with
from app.schemas.admin import CreateRoomSchema, UpdateRoomSchema, AdminUpdateUserSchema

admin_bp = Blueprint('admin', __name__)

MARKER_ALERT_TYPE = 'system_marker'
MARKER_CLEAR = '__marker__:clear'
MARKER_SUPPRESS = '__marker__:suppressed'

def admin_required(f):
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user or not user.is_admin:
            return jsonify({'message': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/dashboard', methods=['GET'])
@limiter.limit(RATE_LIMIT_ADMIN)
@admin_required
def get_dashboard_stats():
    
    total_users = User.query.filter_by(is_admin=False).count()
    total_workouts = LiveWorkoutSession.query.count()
    total_calories = db.session.query(func.sum(LiveWorkoutSession.total_calories)).scalar() or 0
    active_alerts = Alert.query.filter_by(is_read=False).count()
    critical_alerts = Alert.query.filter_by(severity='critical', is_read=False).count()
    
    return jsonify({
        'total_users': total_users,
        'total_workouts': total_workouts,
        'total_calories': round(total_calories, 2),
        'active_alerts': active_alerts,
        'critical_alerts': critical_alerts
    }), 200

@admin_bp.route('/dashboard/weekly-activity', methods=['GET'])
@limiter.limit(RATE_LIMIT_ADMIN)
@admin_required
def get_weekly_activity():

    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=6)
    
    sessions = LiveWorkoutSession.query.filter(
        LiveWorkoutSession.session_date >= start_date,
        LiveWorkoutSession.session_date <= end_date
    ).all()
    
    daily_counts = {}
    for session in sessions:
        date_str = session.session_date.isoformat()
        daily_counts[date_str] = daily_counts.get(date_str, 0) + 1
    
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    activity = []
    current_date = start_date
    
    while current_date <= end_date:
        date_str = current_date.isoformat()
        day_name = days[current_date.weekday()]
        activity.append({
            'date': date_str,
            'day': day_name,
            'workouts': daily_counts.get(date_str, 0)
        })
        current_date += timedelta(days=1)
    
    return jsonify({'activity': activity}), 200

@admin_bp.route('/dashboard/fitness-levels', methods=['GET'])
@limiter.limit(RATE_LIMIT_ADMIN)
@admin_required
def get_fitness_levels():
    """Get fitness level distribution based on total calories burned"""
    users = User.query.filter_by(is_admin=False).all()
    
    levels = {
        'beginner': 0,
        'intermediate': 0,
        'advanced': 0,
        'athlete': 0
    }
    
    for user in users:
        
        stats = ExerciseStatistics.query.filter_by(user_id=user.id).first()
        total_cals = stats.total_calories if stats else 0
        
        if total_cals < 100:
            levels['beginner'] += 1
        elif total_cals < 500:
            levels['intermediate'] += 1
        elif total_cals < 2000:
            levels['advanced'] += 1
        else:
            levels['athlete'] += 1
    
    total = sum(levels.values()) or 1  
    
    return jsonify({
        'fitness_levels': [
            {'name': 'Beginner', 'count': levels['beginner'], 'percentage': round(levels['beginner'] / total * 100)},
            {'name': 'Intermediate', 'count': levels['intermediate'], 'percentage': round(levels['intermediate'] / total * 100)},
            {'name': 'Advanced', 'count': levels['advanced'], 'percentage': round(levels['advanced'] / total * 100)},
            {'name': 'Athlete', 'count': levels['athlete'], 'percentage': round(levels['athlete'] / total * 100)}
        ]
    }), 200

@admin_bp.route('/rooms', methods=['GET'])
@limiter.limit(RATE_LIMIT_ADMIN)
@admin_required
def get_rooms():
    rooms = Room.query.all()
    return jsonify({'rooms': [r.to_dict() for r in rooms]}), 200

@admin_bp.route('/rooms', methods=['POST'])
@limiter.limit(RATE_LIMIT_ADMIN)
@admin_required
@validate_with(CreateRoomSchema)
def create_room(validated_data):
    user_id = int(get_jwt_identity())
    
    room = Room(
        name=validated_data['name'],
        max_participants=validated_data.get('max_participants', 20),
        duration_limit=validated_data.get('duration_limit', 60),
        min_calorie_goal=validated_data.get('min_calorie_goal', 200),
        max_calorie_goal=validated_data.get('max_calorie_goal', 500),
        created_by=user_id
    )
    
    db.session.add(room)
    db.session.commit()
    
    return jsonify({'room': room.to_dict()}), 201

@admin_bp.route('/rooms/<int:room_id>', methods=['PUT'])
@limiter.limit(RATE_LIMIT_ADMIN)
@admin_required
@validate_with(UpdateRoomSchema)
def update_room(room_id, validated_data):
    room = Room.query.get(room_id)
    if not room:
        return jsonify({'message': 'Room not found'}), 404
    
    for field in ['name', 'max_participants', 'duration_limit', 
                  'min_calorie_goal', 'max_calorie_goal', 'is_active']:
        if field in validated_data:
            setattr(room, field, validated_data[field])
    
    db.session.commit()
    
    return jsonify({'room': room.to_dict()}), 200

@admin_bp.route('/rooms/<int:room_id>', methods=['DELETE'])
@limiter.limit(RATE_LIMIT_ADMIN)
@admin_required
def delete_room(room_id):
    room = Room.query.get(room_id)
    if not room:
        return jsonify({'message': 'Room not found'}), 404
    
    db.session.delete(room)
    db.session.commit()
    
    return jsonify({'message': 'Room deleted'}), 200

@admin_bp.route('/users', methods=['GET'])
@limiter.limit(RATE_LIMIT_ADMIN)
@admin_required
def get_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    users = User.query.filter_by(is_admin=False)\
        .paginate(page=page, per_page=per_page)
    
    users_data = []
    for user in users.items:
        user_data = user.to_dict()
        stats = ExerciseStatistics.query.filter_by(user_id=user.id).first()
        user_data['total_sessions'] = stats.total_sessions if stats else 0
        user_data['total_calories_burned'] = stats.total_calories if stats else 0
        users_data.append(user_data)
    
    return jsonify({
        'users': users_data,
        'total': users.total,
        'pages': users.pages,
        'current_page': page
    }), 200

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    stats = ExerciseStatistics.query.filter_by(user_id=user_id).first()
    sessions = LiveWorkoutSession.query.filter_by(user_id=user_id)\
        .order_by(LiveWorkoutSession.created_at.desc()).limit(5).all()
    
    return jsonify({
        'user': user.to_dict(),
        'stats': stats.to_dict() if stats else {
            'total_calories': 0,
            'total_sessions': 0,
            'total_reps': 0
        },
        'recent_sessions': [s.to_dict() for s in sessions]
    }), 200

@admin_bp.route('/users/<int:user_id>/sessions', methods=['GET'])
@limiter.limit(RATE_LIMIT_ADMIN)
@admin_required
def get_user_sessions(user_id):
    """Get all workout sessions for a specific user"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    sessions = LiveWorkoutSession.query.filter_by(user_id=user_id)\
        .order_by(LiveWorkoutSession.session_date.desc()).all()
    
    return jsonify({'sessions': [s.to_dict() for s in sessions]}), 200

@admin_bp.route('/users/<int:user_id>/predictions', methods=['GET'])
@limiter.limit(RATE_LIMIT_ADMIN)
@admin_required
def get_user_predictions(user_id):

    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    standard_predictions = CaloriePrediction.query.filter_by(user_id=user_id)\
        .order_by(CaloriePrediction.created_at.desc()).all()
    
    advanced_predictions = AdvancedCaloriePrediction.query.filter_by(user_id=user_id)\
        .order_by(AdvancedCaloriePrediction.created_at.desc()).all()
    
    all_predictions = []
    for p in standard_predictions:
        pred_dict = p.to_dict()
        pred_dict['prediction_type'] = 'standard'
        all_predictions.append(pred_dict)
    
    for p in advanced_predictions:
        pred_dict = p.to_dict()
        pred_dict['prediction_type'] = 'advanced'
        all_predictions.append(pred_dict)
    
    
    all_predictions.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return jsonify({
        'predictions': all_predictions,
        'total_standard': len(standard_predictions),
        'total_advanced': len(advanced_predictions)
    }), 200

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@limiter.limit(RATE_LIMIT_ADMIN)
@admin_required
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    if user.is_admin:
        return jsonify({'message': 'Cannot delete admin user'}), 400
    
    LiveWorkoutSession.query.filter_by(user_id=user_id).delete()
    ExerciseStatistics.query.filter_by(user_id=user_id).delete()
    Workout.query.filter_by(user_id=user_id).delete()
    Alert.query.filter_by(user_id=user_id).delete()
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted'}), 200

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@limiter.limit(RATE_LIMIT_ADMIN)
@admin_required
@validate_with(AdminUpdateUserSchema)
def update_user(user_id, validated_data):

    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    if user.is_admin:
        return jsonify({'message': 'Cannot edit admin user'}), 400
    
    allowed_fields = ['name', 'email', 'age', 'gender', 'height', 'weight', 'fitness_level']
    for field in allowed_fields:
        if field in validated_data:
            setattr(user, field, validated_data[field])
    
    if 'height' in validated_data or 'weight' in validated_data:
        user.calculate_bmi()
    
    db.session.commit()
    
    stats = ExerciseStatistics.query.filter_by(user_id=user.id).first()
    user_data = user.to_dict()
    user_data['total_sessions'] = stats.total_sessions if stats else 0
    user_data['total_calories_burned'] = stats.total_calories if stats else 0
    
    return jsonify({'user': user_data, 'message': 'User updated successfully'}), 200

@admin_bp.route('/alerts', methods=['GET'])
@admin_required
def get_all_alerts():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    severity = request.args.get('severity')
    
    query = Alert.query.filter(Alert.alert_type != MARKER_ALERT_TYPE)
    
    if severity:
        query = query.filter_by(severity=severity)
    
    alerts = query.order_by(Alert.created_at.desc())\
        .paginate(page=page, per_page=per_page)
    
    alert_data = []
    for alert in alerts.items:
        data = alert.to_dict()
        user = User.query.get(alert.user_id)
        data['user'] = {'name': user.name, 'email': user.email} if user else None
        alert_data.append(data)
    
    return jsonify({
        'alerts': alert_data,
        'total': alerts.total,
        'pages': alerts.pages,
        'current_page': page
    }), 200

@admin_bp.route('/alerts/total-count', methods=['GET'])
@limiter.limit(RATE_LIMIT_ADMIN)
@admin_required
def get_admin_alerts_count():

    total = Alert.query.filter(Alert.alert_type != MARKER_ALERT_TYPE).count()
    unread = Alert.query.filter(
        Alert.alert_type != MARKER_ALERT_TYPE,
        Alert.is_read.is_(False)
    ).count()
    critical = Alert.query.filter(
        Alert.alert_type != MARKER_ALERT_TYPE,
        Alert.severity == 'critical',
        Alert.is_read.is_(False)
    ).count()
    
    return jsonify({
        'total_count': total,
        'unread_count': unread,
        'critical_count': critical
    }), 200

@admin_bp.route('/alerts/<int:alert_id>/notify-owner', methods=['POST'])
@limiter.limit(RATE_LIMIT_ADMIN)
@admin_required
def notify_owner(alert_id):
    alert = Alert.query.get(alert_id)
    if not alert:
        return jsonify({'message': 'Alert not found'}), 404
    
    alert.owner_notified = True
    db.session.commit()
    return jsonify({'alert': alert.to_dict()}), 200

@admin_bp.route('/alerts/critical', methods=['GET'])
@limiter.limit(RATE_LIMIT_ADMIN)
@admin_required
def get_critical_alerts():
    alerts = Alert.query.filter(
        Alert.alert_type != MARKER_ALERT_TYPE,
        Alert.severity == 'critical',
        Alert.is_read.is_(False)
    )\
        .order_by(Alert.created_at.desc()).all()
    
    alert_data = []
    for alert in alerts:
        data = alert.to_dict()
        user = User.query.get(alert.user_id)
        data['user'] = {'name': user.name, 'email': user.email} if user else None
        alert_data.append(data)
    
    return jsonify({'alerts': alert_data}), 200

@admin_bp.route('/alerts/<int:alert_id>/read', methods=['PUT'])
@limiter.limit(RATE_LIMIT_ADMIN)
@admin_required
def mark_alert_read(alert_id):

    alert = Alert.query.get(alert_id)
    if not alert:
        return jsonify({'message': 'Alert not found'}), 404
    
    alert.is_read = True
    db.session.commit()
    
    return jsonify({'alert': alert.to_dict(), 'message': 'Alert marked as read'}), 200

@admin_bp.route('/alerts/<int:alert_id>', methods=['DELETE'])
@limiter.limit(RATE_LIMIT_ADMIN)
@admin_required
def dismiss_alert(alert_id):
    """Dismiss (delete) an alert"""
    alert = Alert.query.filter(
        Alert.id == alert_id,
        Alert.alert_type != MARKER_ALERT_TYPE
    ).first()
    if not alert:
        return jsonify({'message': 'Alert not found'}), 404

    latest_session = LiveWorkoutSession.query.filter_by(user_id=alert.user_id)\
        .order_by(LiveWorkoutSession.id.desc()).first()
    latest_session_id = latest_session.id if latest_session else 0

    marker = Alert(
        user_id=alert.user_id,
        alert_type=MARKER_ALERT_TYPE,
        severity='info',
        message=f'{latest_session_id}||{alert.alert_type or ""}||{alert.message or ""}',
        suggestion=MARKER_SUPPRESS,
        is_read=True,
        owner_notified=True
    )
    db.session.add(marker)
    
    db.session.delete(alert)
    db.session.commit()
    
    return jsonify({'message': 'Alert dismissed'}), 200

@admin_bp.route('/alerts/clear-all', methods=['DELETE'])
@limiter.limit(RATE_LIMIT_ADMIN)
@admin_required
def clear_all_alerts_admin():

    alerts = Alert.query.filter(Alert.alert_type != MARKER_ALERT_TYPE).all()
    if not alerts:
        return jsonify({'message': 'No alerts to clear', 'deleted_count': 0}), 200

    user_ids = {alert.user_id for alert in alerts}
    for user_id in user_ids:
        latest_session = LiveWorkoutSession.query.filter_by(user_id=user_id)\
            .order_by(LiveWorkoutSession.id.desc()).first()
        latest_session_id = latest_session.id if latest_session else 0

        marker = Alert(
            user_id=user_id,
            alert_type=MARKER_ALERT_TYPE,
            severity='info',
            message=str(latest_session_id),
            suggestion=MARKER_CLEAR,
            is_read=True,
            owner_notified=True
        )
        db.session.add(marker)

    deleted_count = Alert.query.filter(Alert.alert_type != MARKER_ALERT_TYPE).delete(synchronize_session=False)
    db.session.commit()

    return jsonify({'message': 'All alerts cleared', 'deleted_count': deleted_count}), 200
