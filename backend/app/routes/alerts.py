from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Alert, LiveWorkoutSession

alerts_bp = Blueprint('alerts', __name__)

MARKER_ALERT_TYPE = 'system_marker'
MARKER_CLEAR = '__marker__:clear'
MARKER_SUPPRESS = '__marker__:suppressed'


def _get_latest_session_id(user_id: int) -> int:
    latest_session = LiveWorkoutSession.query.filter_by(user_id=user_id)\
        .order_by(LiveWorkoutSession.id.desc()).first()
    return latest_session.id if latest_session else 0


def _create_suppression_marker(user_id: int, alert_type: str, message: str) -> None:
    latest_session_id = _get_latest_session_id(user_id)
    marker = Alert(
        user_id=user_id,
        alert_type=MARKER_ALERT_TYPE,
        severity='info',
        message=f'{latest_session_id}||{alert_type or ""}||{message or ""}',
        suggestion=MARKER_SUPPRESS,
        is_read=True,
        owner_notified=True
    )
    db.session.add(marker)


def _create_clear_marker(user_id: int) -> None:
    latest_session_id = _get_latest_session_id(user_id)
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


def _parse_suppression_marker(raw_message: str):
    parts = (raw_message or '').split('||', 2)
    if len(parts) != 3:
        return None
    try:
        session_id = int(parts[0])
    except (TypeError, ValueError):
        return None
    return session_id, parts[1], parts[2]

@alerts_bp.route('', methods=['GET'])
@jwt_required()
def get_alerts():
    user_id = int(get_jwt_identity())
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    severity = request.args.get('severity')
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    
    query = Alert.query.filter(
        Alert.user_id == user_id,
        Alert.alert_type != MARKER_ALERT_TYPE
    )
    
    if severity:
        query = query.filter_by(severity=severity)
    
    if unread_only:
        query = query.filter_by(is_read=False)
    
    alerts = query.order_by(Alert.created_at.desc())\
        .paginate(page=page, per_page=per_page)
    
    return jsonify({
        'alerts': [a.to_dict() for a in alerts.items],
        'total': alerts.total,
        'pages': alerts.pages,
        'current_page': page
    }), 200


@alerts_bp.route('/<int:alert_id>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(alert_id):
    user_id = int(get_jwt_identity())
    alert = Alert.query.filter_by(id=alert_id, user_id=user_id).first()
    
    if not alert:
        return jsonify({'message': 'Alert not found'}), 404
    
    alert.is_read = True
    db.session.commit()
    
    return jsonify({'alert': alert.to_dict()}), 200


@alerts_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    user_id = int(get_jwt_identity())
    count = Alert.query.filter(
        Alert.user_id == user_id,
        Alert.is_read.is_(False),
        Alert.alert_type != MARKER_ALERT_TYPE
    ).count()
    
    return jsonify({'unread_count': count}), 200


@alerts_bp.route('/total-count', methods=['GET'])
@jwt_required()
def get_total_count():
    """Get total alerts count for user (read + unread)"""
    user_id = int(get_jwt_identity())
    total = Alert.query.filter(
        Alert.user_id == user_id,
        Alert.alert_type != MARKER_ALERT_TYPE
    ).count()
    unread = Alert.query.filter(
        Alert.user_id == user_id,
        Alert.is_read.is_(False),
        Alert.alert_type != MARKER_ALERT_TYPE
    ).count()
    
    return jsonify({'total_count': total, 'unread_count': unread}), 200


@alerts_bp.route('/<int:alert_id>', methods=['DELETE'])
@jwt_required()
def delete_alert(alert_id):
    user_id = int(get_jwt_identity())
    alert = Alert.query.filter(
        Alert.id == alert_id,
        Alert.user_id == user_id,
        Alert.alert_type != MARKER_ALERT_TYPE
    ).first()
    
    if not alert:
        return jsonify({'message': 'Alert not found'}), 404
    
    _create_suppression_marker(user_id, alert.alert_type or '', alert.message or '')
    db.session.delete(alert)
    db.session.commit()
    
    return jsonify({'message': 'Alert deleted'}), 200


@alerts_bp.route('', methods=['POST'])
@jwt_required()
def create_alert():
    """Create a new alert for the user"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    
    alert = Alert(
        user_id=user_id,
        alert_type=data.get('alert_type', 'info'),
        severity=data.get('severity', 'info'),
        message=data.get('message', ''),
        suggestion=data.get('suggestion', ''),
        is_read=data.get('is_read', False),
        owner_notified=False
    )
    
    db.session.add(alert)
    db.session.commit()
    
    return jsonify({'alert': alert.to_dict()}), 201


@alerts_bp.route('/sync', methods=['POST'])
@jwt_required()
def sync_alerts():
    """Sync multiple alerts from frontend - creates new ones if they don't exist"""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    alerts_data = data.get('alerts', [])
    
    created_alerts = []
    latest_session_id = _get_latest_session_id(user_id)

    clear_marker = Alert.query.filter_by(
        user_id=user_id,
        alert_type=MARKER_ALERT_TYPE,
        suggestion=MARKER_CLEAR
    ).order_by(Alert.created_at.desc()).first()

    if clear_marker:
        try:
            cleared_session_id = int(clear_marker.message or '0')
        except (TypeError, ValueError):
            cleared_session_id = 0

        if latest_session_id <= cleared_session_id:
            return jsonify({
                'message': 'Alerts are cleared until a new workout session is recorded',
                'alerts': []
            }), 200

    suppression_markers = Alert.query.filter_by(
        user_id=user_id,
        alert_type=MARKER_ALERT_TYPE,
        suggestion=MARKER_SUPPRESS
    ).all()

    suppressed_signatures = set()
    for marker in suppression_markers:
        parsed = _parse_suppression_marker(marker.message)
        if not parsed:
            continue
        marker_session_id, marker_type, marker_msg = parsed
        if marker_session_id == latest_session_id:
            suppressed_signatures.add((marker_type, marker_msg))
    
    for alert_data in alerts_data:
        alert_type = alert_data.get('alert_type', 'info')
        alert_message = alert_data.get('message', '')

        if (alert_type, alert_message) in suppressed_signatures:
            continue

        
        existing = Alert.query.filter(
            Alert.user_id == user_id,
            Alert.alert_type == alert_type,
            Alert.message == alert_message,
            Alert.alert_type != MARKER_ALERT_TYPE
        ).first()
        
        if not existing:
            alert = Alert(
                user_id=user_id,
                alert_type=alert_type,
                severity=alert_data.get('severity', 'info'),
                message=alert_message,
                suggestion=alert_data.get('suggestion', ''),
                is_read=alert_data.get('is_read', False),
                owner_notified=False
            )
            db.session.add(alert)
            created_alerts.append(alert)
    
    db.session.commit()
    
    return jsonify({
        'message': f'{len(created_alerts)} new alerts created',
        'alerts': [a.to_dict() for a in created_alerts]
    }), 201


@alerts_bp.route('/all', methods=['DELETE'])
@jwt_required()
def clear_all_alerts():
    """Delete all visible alerts and suppress regeneration until a new workout is saved."""
    user_id = int(get_jwt_identity())

    deleted_count = Alert.query.filter(
        Alert.user_id == user_id,
        Alert.alert_type != MARKER_ALERT_TYPE
    ).delete(synchronize_session=False)

    _create_clear_marker(user_id)
    db.session.commit()

    return jsonify({'message': 'All alerts cleared', 'deleted_count': deleted_count}), 200
