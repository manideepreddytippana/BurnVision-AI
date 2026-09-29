from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import (
    Alert,
    CaloriePredictionExplanation,
    ExerciseStatistics,
    LiveWorkoutSession,
    LiveWorkoutSessionSuggestion,
    MotionFrame,
    User,
    Workout,
)
from app.services.sarvam_ai_service import get_sarvam_ai_service
from app.services.calorie_validation_service import get_calorie_validation_service
from app.rate_limiter import limiter, RATE_LIMIT_COMPUTE, RATE_LIMIT_READ, RATE_LIMIT_WRITE
from datetime import datetime, timedelta
from sqlalchemy import func
from app.schemas import validate_with
from app.schemas.workout import StartWorkoutSchema, EndWorkoutSchema, SaveLiveSessionSchema, MotionFrameSchema

workout_bp = Blueprint('workout', __name__)


def _build_live_session_ai_summary(ai_payload):

    structured = (ai_payload or {}).get('structured') or {}
    workout_anomalies = structured.get('workout_anomalies') or []
    behavioral_anomalies = structured.get('behavioral_anomalies') or []
    overtraining_detection = structured.get('overtraining_detection') or []
    hydration_tracking = structured.get('hydration_tracking') or []
    nutrition_recommendations = structured.get('nutrition_recommendations') or []
    smart_recommendation_engine = structured.get('smart_recommendation_engine') or []
    progress_tracking = structured.get('progress_tracking') or []
    personalization_factor = structured.get('personalization_factor') or ''

    risk_signal = (
        (workout_anomalies[0] if workout_anomalies else None)
        or (behavioral_anomalies[0] if behavioral_anomalies else None)
        or 'No major anomaly signal detected in this session.'
    )

    recovery_signal = (
        (overtraining_detection[0] if overtraining_detection else None)
        or (hydration_tracking[0] if hydration_tracking else None)
        or (nutrition_recommendations[0] if nutrition_recommendations else None)
        or 'Recovery signal is stable; maintain hydration and sleep quality.'
    )

    action_signal = (
        (smart_recommendation_engine[0] if smart_recommendation_engine else None)
        or (progress_tracking[0] if progress_tracking else None)
        or personalization_factor
        or 'Continue current plan with small weekly progression in duration or intensity.'
    )

    return [
        f'Risk: {risk_signal}',
        f'Recovery: {recovery_signal}',
        f'Action Plan: {action_signal}',
    ]

@workout_bp.route('/start', methods=['POST'])
@limiter.limit(RATE_LIMIT_WRITE)
@jwt_required()
@validate_with(StartWorkoutSchema)
def start_workout(validated_data):
    user_id = int(get_jwt_identity())
    
    user = User.query.get(user_id)
    
    workout = Workout(
        user_id=user_id,
        room_id=validated_data.get('room_id'),
        environment=validated_data.get('environment', 'indoor'),
        exercise_type=validated_data.get('exercise_type'),
        context_factors={
            'time_of_day': datetime.now().strftime('%H:%M'),
            'weather': validated_data.get('weather'),
            'fatigue_score': validated_data.get('fatigue_score', 0)
        }
    )
    
    live_session = LiveWorkoutSession(
        user_id=user_id,
        session_date=datetime.utcnow().date(),
        user_weight=user.weight if user else validated_data.get('weight', 70)
    )
    
    db.session.add(workout)
    db.session.add(live_session)
    db.session.commit()
    
    return jsonify({
        'message': 'Workout started',
        'workout': workout.to_dict(),
        'live_session_id': live_session.id
    }), 201

@workout_bp.route('/<int:workout_id>/end', methods=['POST'])
@limiter.limit(RATE_LIMIT_WRITE)
@jwt_required()
@validate_with(EndWorkoutSchema)
def end_workout(workout_id, validated_data):
    user_id = int(get_jwt_identity())
    workout = Workout.query.filter_by(id=workout_id, user_id=user_id).first()
    
    if not workout:
        return jsonify({'message': 'Workout not found'}), 404
    
    if workout.end_time:
        return jsonify({'message': 'Workout already ended'}), 400
    
    end_time = datetime.utcnow()
    client_total_calories = validated_data.get('total_calories', 0)
    
    if workout.start_time and client_total_calories > 0:
        user = User.query.get(user_id)
        user_weight = user.weight if user and user.weight else 70.0
        duration_seconds = (end_time - workout.start_time).total_seconds()
        
        calorie_validator = get_calorie_validation_service()
        validation_result = calorie_validator.validate_end_workout(
            client_total_calories=client_total_calories,
            duration_seconds=duration_seconds,
            user_weight=user_weight,
        )
        
        if validation_result.is_rejected:
            return jsonify({
                'error': {
                    'code': 'CALORIE_VALIDATION_REJECTED',
                    'message': 'Reported calorie values are physiologically impossible.',
                    'validation': validation_result.to_dict(),
                }
            }), 422
    
    workout.end_time = end_time
    workout.total_calories = client_total_calories
    workout.form_quality_score = validated_data.get('form_quality_score')
    
    if validated_data.get('context_factors'):
        existing_context = workout.context_factors or {}
        existing_context.update(validated_data.get('context_factors'))
        workout.context_factors = existing_context
    
    db.session.commit()
    
    return jsonify({
        'message': 'Workout ended',
        'workout': workout.to_dict()
    }), 200

@workout_bp.route('/session/save', methods=['POST'])
@limiter.limit(RATE_LIMIT_COMPUTE)
@jwt_required()
@validate_with(SaveLiveSessionSchema)
def save_live_session(validated_data):
    try:
        user_id = int(get_jwt_identity())
        
        user = User.query.get(user_id)
        
        exercises = []
        if validated_data.get('squat_reps', 0) > 0:
            exercises.append('squat')
        if validated_data.get('pushup_reps', 0) > 0:
            exercises.append('pushup')
        if validated_data.get('lunge_reps', 0) > 0:
            exercises.append('lunge')
        if validated_data.get('jumping_jack_reps', 0) > 0:
            exercises.append('jumping_jack')
        if validated_data.get('high_knee_reps', 0) > 0:
            exercises.append('high_knee')
        if validated_data.get('burpee_reps', 0) > 0:
            exercises.append('burpee')
        if validated_data.get('plank_seconds', 0) > 0:
            exercises.append('plank')

        if validated_data.get('situp_reps', 0) > 0:
            exercises.append('situp')
        if validated_data.get('leg_raise_reps', 0) > 0:
            exercises.append('leg_raise')
        if validated_data.get('bicycle_crunch_reps', 0) > 0:
            exercises.append('bicycle_crunch')
        
        exercises_done = ','.join(exercises) if exercises else 'none'
        
        start_time = datetime.utcnow()
        if validated_data.get('start_time'):
            start_time_str = validated_data.get('start_time')
            
            if start_time_str.endswith('Z'):
                start_time_str = start_time_str[:-1] + '+00:00'
            try:
                start_time = datetime.fromisoformat(start_time_str)
            except ValueError:
                start_time = datetime.utcnow()
        
        total_reps = (
            validated_data.get('squat_reps', 0) + validated_data.get('pushup_reps', 0) +
            validated_data.get('lunge_reps', 0) + validated_data.get('jumping_jack_reps', 0) +
            validated_data.get('high_knee_reps', 0) + validated_data.get('burpee_reps', 0) +
            validated_data.get('situp_reps', 0) +
            validated_data.get('leg_raise_reps', 0) + validated_data.get('bicycle_crunch_reps', 0)
        )
        
        frontend_active_minutes = validated_data.get('active_minutes', 0)
        if frontend_active_minutes < 0.1 and start_time:
            time_diff = (datetime.utcnow() - start_time.replace(tzinfo=None) if start_time.tzinfo else datetime.utcnow() - start_time)
            frontend_active_minutes = round(time_diff.total_seconds() / 60, 2)
        
        user_weight = validated_data.get('weight', user.weight if user else 70)
        
        calorie_validator = get_calorie_validation_service()
        calorie_validation = calorie_validator.validate_live_session(
            data=validated_data,
            user_weight=user_weight,
            active_minutes=frontend_active_minutes,
        )
        
        if calorie_validation.is_rejected:
            return jsonify({
                'error': {
                    'code': 'CALORIE_VALIDATION_REJECTED',
                    'message': 'One or more calorie values are physiologically impossible and cannot be saved.',
                    'validation': calorie_validation.to_dict(),
                }
            }), 422
        
        server_cals = calorie_validation.server_calories
        
        session = LiveWorkoutSession(
            user_id=user_id,
            session_date=datetime.utcnow().date(),
            start_time=start_time,
            end_time=datetime.utcnow(),
            user_weight=user_weight,
            
            squat_calories=server_cals.get('squat_calories', 0),
            pushup_calories=server_cals.get('pushup_calories', 0),
            lunge_calories=server_cals.get('lunge_calories', 0),
            jumping_jack_calories=server_cals.get('jumping_jack_calories', 0),
            high_knee_calories=server_cals.get('high_knee_calories', 0),
            burpee_calories=server_cals.get('burpee_calories', 0),
            plank_calories=server_cals.get('plank_calories', 0),

            situp_calories=server_cals.get('situp_calories', 0),
            leg_raise_calories=server_cals.get('leg_raise_calories', 0),
            bicycle_crunch_calories=server_cals.get('bicycle_crunch_calories', 0),
            total_calories=server_cals.get('total_calories', 0),
            
            squat_reps=validated_data.get('squat_reps', 0),
            pushup_reps=validated_data.get('pushup_reps', 0),
            lunge_reps=validated_data.get('lunge_reps', 0),
            jumping_jack_reps=validated_data.get('jumping_jack_reps', 0),
            high_knee_reps=validated_data.get('high_knee_reps', 0),
            burpee_reps=validated_data.get('burpee_reps', 0),
            plank_seconds=validated_data.get('plank_seconds', 0),

            situp_reps=validated_data.get('situp_reps', 0),
            leg_raise_reps=validated_data.get('leg_raise_reps', 0),
            bicycle_crunch_reps=validated_data.get('bicycle_crunch_reps', 0),
            total_reps=total_reps,
            
            form_score=validated_data.get('form_score', 0),
            consistency=validated_data.get('consistency', 0),
            cadence=validated_data.get('cadence', 0),
            active_minutes=frontend_active_minutes,
            exercises_done=exercises_done
        )
        
        db.session.add(session)
        
        stats = ExerciseStatistics.query.filter_by(user_id=user_id).first()
        
        if not stats:
            stats = ExerciseStatistics(
                user_id=user_id,
                user_name=user.name if user else 'Unknown',
                total_calories=0,
                total_sessions=0,
                total_squat_reps=0,
                total_pushup_reps=0,
                total_lunge_reps=0,
                total_jumping_jack_reps=0,
                total_high_knee_reps=0,
                total_burpee_reps=0,
                total_plank_seconds=0,

                total_situp_reps=0,
                total_leg_raise_reps=0,
                total_bicycle_crunch_reps=0,
                total_reps=0,
                total_active_minutes=0,
                avg_form_score=0,
                avg_calories_per_session=0
            )
            db.session.add(stats)
        
        stats.total_calories = (stats.total_calories or 0) + session.total_calories
        stats.total_sessions = (stats.total_sessions or 0) + 1
        stats.total_squat_reps = (stats.total_squat_reps or 0) + session.squat_reps
        stats.total_pushup_reps = (stats.total_pushup_reps or 0) + session.pushup_reps
        stats.total_lunge_reps = (stats.total_lunge_reps or 0) + session.lunge_reps
        stats.total_jumping_jack_reps = (stats.total_jumping_jack_reps or 0) + session.jumping_jack_reps
        stats.total_high_knee_reps = (stats.total_high_knee_reps or 0) + session.high_knee_reps
        stats.total_burpee_reps = (stats.total_burpee_reps or 0) + session.burpee_reps
        stats.total_plank_seconds = (stats.total_plank_seconds or 0) + session.plank_seconds

        stats.total_situp_reps = (stats.total_situp_reps or 0) + session.situp_reps
        stats.total_leg_raise_reps = (stats.total_leg_raise_reps or 0) + session.leg_raise_reps
        stats.total_bicycle_crunch_reps = (stats.total_bicycle_crunch_reps or 0) + session.bicycle_crunch_reps
        stats.total_reps = (stats.total_reps or 0) + session.total_reps
        stats.total_active_minutes = (stats.total_active_minutes or 0) + session.active_minutes
        
        if stats.total_sessions > 0:
            stats.avg_calories_per_session = stats.total_calories / stats.total_sessions
            
            all_sessions = LiveWorkoutSession.query.filter_by(user_id=user_id).all()
            total_form = sum(s.form_score for s in all_sessions)
            stats.avg_form_score = total_form / len(all_sessions) if all_sessions else 0
        
        db.session.commit()

        ai_suggestion_row = None
        ai_summary = []

        try:
            session_snapshot = session.to_dict()

            evaluation_input = {
                'prediction_type': 'live_workout_session',
                'session_id': session.id,
                'session_date': session_snapshot.get('session_date'),
                'user_weight': session.user_weight,
                'active_minutes': session.active_minutes,
                'total_calories': session.total_calories,
                'total_reps': session.total_reps,
                'form_score': session.form_score,
                'consistency': session.consistency,
                'cadence': session.cadence,
                'exercises_done': session.exercises_done,
                'exercise_breakdown': {
                    'squat_reps': session.squat_reps,
                    'pushup_reps': session.pushup_reps,
                    'lunge_reps': session.lunge_reps,
                    'jumping_jack_reps': session.jumping_jack_reps,
                    'high_knee_reps': session.high_knee_reps,
                    'burpee_reps': session.burpee_reps,
                    'plank_seconds': session.plank_seconds,
                    'situp_reps': session.situp_reps,
                    'leg_raise_reps': session.leg_raise_reps,
                    'bicycle_crunch_reps': session.bicycle_crunch_reps,
                },
                'calorie_breakdown': {
                    'squat_calories': session.squat_calories,
                    'pushup_calories': session.pushup_calories,
                    'lunge_calories': session.lunge_calories,
                    'jumping_jack_calories': session.jumping_jack_calories,
                    'high_knee_calories': session.high_knee_calories,
                    'burpee_calories': session.burpee_calories,
                    'plank_calories': session.plank_calories,
                    'situp_calories': session.situp_calories,
                    'leg_raise_calories': session.leg_raise_calories,
                    'bicycle_crunch_calories': session.bicycle_crunch_calories,
                },
            }

            sarvam_result = get_sarvam_ai_service().evaluate_prediction(evaluation_input)
            ai_payload = {
                'provider': 'sarvam-ai',
                'model': sarvam_result.get('model'),
                'generated_at': datetime.utcnow().isoformat(),
                'success': sarvam_result.get('success', False),
                'structured': sarvam_result.get('structured', {}),
                'raw_text': sarvam_result.get('raw_text', ''),
                'error': sarvam_result.get('error'),
            }
            ai_summary = _build_live_session_ai_summary(ai_payload)

            linked_explanation = None
            requested_explanation_id = data.get('calorie_prediction_explanation_id')
            if requested_explanation_id:
                linked_explanation = CaloriePredictionExplanation.query.filter_by(
                    id=int(requested_explanation_id),
                    user_id=user_id,
                ).first()
            if not linked_explanation:
                linked_explanation = (
                    CaloriePredictionExplanation.query.filter_by(user_id=user_id)
                    .order_by(CaloriePredictionExplanation.created_at.desc())
                    .first()
                )

            ai_suggestion_row = LiveWorkoutSessionSuggestion.query.filter_by(
                live_workout_session_id=session.id,
                user_id=user_id,
            ).first()

            if not ai_suggestion_row:
                ai_suggestion_row = LiveWorkoutSessionSuggestion(
                    live_workout_session_id=session.id,
                    user_id=user_id,
                    calorie_prediction_explanation_id=linked_explanation.id if linked_explanation else None,
                    session_data=session_snapshot,
                    ai_suggestions=ai_payload,
                    summary_points=ai_summary,
                )
                db.session.add(ai_suggestion_row)
            else:
                ai_suggestion_row.calorie_prediction_explanation_id = linked_explanation.id if linked_explanation else None
                ai_suggestion_row.session_data = session_snapshot
                ai_suggestion_row.ai_suggestions = ai_payload
                ai_suggestion_row.summary_points = ai_summary

            db.session.commit()
        except Exception as ai_err:
            db.session.rollback()
            print(f'Live workout AI suggestion warning: {str(ai_err)}')
        
        try:
            recent_sessions = LiveWorkoutSession.query.filter_by(user_id=user_id)\
                .order_by(LiveWorkoutSession.created_at.desc()).limit(20).all()
            _generate_session_alerts(user_id, session, recent_sessions)
        except Exception as alert_err:
            
            print(f'Alert generation warning: {str(alert_err)}')
        
        response_data = {
            'message': 'Session saved successfully',
            'session': session.to_dict(),
            'statistics': stats.to_dict(),
            'ai_suggestions': ai_suggestion_row.to_dict() if ai_suggestion_row else None,
            'ai_summary': ai_summary,
        }
        
        if calorie_validation.issues:
            response_data['calorie_validation'] = calorie_validation.to_dict()
        
        return jsonify(response_data), 201
    except Exception as e:
        db.session.rollback()
        import logging
        logging.getLogger(__name__).error(
            'Failed to save live session: %s', str(e), exc_info=True
        )
        return jsonify({'message': 'Failed to save session. Please try again later.'}), 500

@workout_bp.route('/sessions', methods=['GET'])
@limiter.limit(RATE_LIMIT_READ)
@jwt_required()
def get_live_sessions():
    user_id = int(get_jwt_identity())
    
    limit = request.args.get('limit', 10, type=int)
    
    sessions = LiveWorkoutSession.query.filter_by(user_id=user_id)\
        .order_by(LiveWorkoutSession.created_at.desc())\
        .limit(limit).all()
    
    return jsonify({
        'sessions': [s.to_dict() for s in sessions]
    }), 200

@workout_bp.route('/realtime-insights', methods=['GET'])
@limiter.limit(RATE_LIMIT_READ)
@jwt_required()
def get_realtime_insights():
    
    user_id = int(get_jwt_identity())
    limit = request.args.get('limit', 50, type=int)

    suggestions = LiveWorkoutSessionSuggestion.query.filter_by(user_id=user_id)\
        .order_by(LiveWorkoutSessionSuggestion.created_at.desc())\
        .limit(limit).all()

    return jsonify({
        'insights': [s.to_dict() for s in suggestions]
    }), 200

@workout_bp.route('/statistics', methods=['GET'])
@limiter.limit(RATE_LIMIT_READ)
@jwt_required()
def get_statistics():

    user_id = int(get_jwt_identity())
    stats = ExerciseStatistics.query.filter_by(user_id=user_id).first()
    
    if not stats:
        return jsonify({
            'statistics': {
                'total_calories': 0,
                'total_sessions': 0,
                'total_reps': 0,
                'avg_form_score': 0
            }
        }), 200
    
    return jsonify({
        'statistics': stats.to_dict()
    }), 200

@workout_bp.route('/trends/calories', methods=['GET'])
@limiter.limit(RATE_LIMIT_READ)
@jwt_required()
def get_calorie_trends():

    user_id = int(get_jwt_identity())
    days = request.args.get('days', 7, type=int)
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days-1)
    
    sessions = LiveWorkoutSession.query.filter(
        LiveWorkoutSession.user_id == user_id,
        LiveWorkoutSession.session_date >= start_date,
        LiveWorkoutSession.session_date <= end_date
    ).all()  
    
    daily_calories = {}
    for session in sessions:
        date_str = session.session_date.isoformat()
        daily_calories[date_str] = daily_calories.get(date_str, 0) + session.total_calories
    
    trends = []
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.isoformat()
        trends.append({
            'date': date_str,
            'calories': round(daily_calories.get(date_str, 0), 2)
        })
        current_date += timedelta(days=1)
    
    return jsonify({
        'trends': trends
    }), 200

@workout_bp.route('/compare', methods=['GET'])
@limiter.limit(RATE_LIMIT_READ)
@jwt_required()
def compare_sessions():
    user_id = int(get_jwt_identity())
    date1 = request.args.get('date1')
    date2 = request.args.get('date2')
    
    if not date1 or not date2:
        return jsonify({'message': 'Both date1 and date2 are required'}), 400
    
    try:
        date1_obj = datetime.fromisoformat(date1).date()
        date2_obj = datetime.fromisoformat(date2).date()
    except:
        return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    sessions1 = LiveWorkoutSession.query.filter(
        LiveWorkoutSession.user_id == user_id,
        LiveWorkoutSession.session_date == date1_obj
    ).all()
    
    sessions2 = LiveWorkoutSession.query.filter(
        LiveWorkoutSession.user_id == user_id,
        LiveWorkoutSession.session_date == date2_obj
    ).all()
    
    def aggregate_sessions(sessions):
        return {
            'total_calories': sum(s.total_calories for s in sessions),
            'total_reps': sum(s.total_reps for s in sessions),
            'squat_reps': sum(s.squat_reps for s in sessions),
            'pushup_reps': sum(s.pushup_reps for s in sessions),
            'sessions_count': len(sessions),
            'avg_form_score': sum(s.form_score for s in sessions) / len(sessions) if sessions else 0,
            'total_minutes': sum(s.active_minutes for s in sessions)
        }
    
    stats1 = aggregate_sessions(sessions1)
    stats2 = aggregate_sessions(sessions2)
    
    suggestions = []
    
    cal_diff = stats2['total_calories'] - stats1['total_calories']
    if cal_diff > 0:
        suggestions.append(f"Great improvement! You burned {cal_diff:.1f} more calories on {date2}.")
    elif cal_diff < 0:
        suggestions.append(f"You burned {abs(cal_diff):.1f} fewer calories on {date2}. Try longer sessions!")
    
    rep_diff = stats2['total_reps'] - stats1['total_reps']
    if rep_diff > 0:
        suggestions.append(f"You did {rep_diff} more reps on {date2}. Keep pushing!")
    elif rep_diff < 0:
        suggestions.append(f"Try to increase your rep count. You did {abs(rep_diff)} fewer reps on {date2}.")
    
    form_diff = stats2['avg_form_score'] - stats1['avg_form_score']
    if form_diff > 5:
        suggestions.append("Your form has improved significantly!")
    elif form_diff < -5:
        suggestions.append("Focus on maintaining proper form during exercises.")
    
    if not suggestions:
        suggestions.append("Keep up the consistent work!")
    
    return jsonify({
        'date1': {
            'date': date1,
            'stats': stats1,
            'sessions': [s.to_dict() for s in sessions1]
        },
        'date2': {
            'date': date2,
            'stats': stats2,
            'sessions': [s.to_dict() for s in sessions2]
        },
        'suggestions': suggestions
    }), 200

@workout_bp.route('', methods=['GET'])
@limiter.limit(RATE_LIMIT_READ)
@jwt_required()
def get_workouts():
    user_id = int(get_jwt_identity())
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    workouts = Workout.query.filter_by(user_id=user_id)\
        .order_by(Workout.start_time.desc())\
        .paginate(page=page, per_page=per_page)
    
    return jsonify({
        'workouts': [w.to_dict() for w in workouts.items],
        'total': workouts.total,
        'pages': workouts.pages,
        'current_page': page
    }), 200

@workout_bp.route('/<int:workout_id>', methods=['GET'])
@limiter.limit(RATE_LIMIT_READ)
@jwt_required()
def get_workout(workout_id):
    user_id = int(get_jwt_identity())
    workout = Workout.query.filter_by(id=workout_id, user_id=user_id).first()
    
    if not workout:
        return jsonify({'message': 'Workout not found'}), 404
    
    return jsonify({'workout': workout.to_dict()}), 200

@workout_bp.route('/<int:workout_id>', methods=['DELETE'])
@limiter.limit(RATE_LIMIT_WRITE)
@jwt_required()
def delete_workout(workout_id):
    user_id = int(get_jwt_identity())
    workout = Workout.query.filter_by(id=workout_id, user_id=user_id).first()
    
    if not workout:
        return jsonify({'message': 'Workout not found'}), 404
    
    db.session.delete(workout)
    db.session.commit()
    return jsonify({'message': 'Workout deleted'}), 200

@workout_bp.route('/<int:workout_id>/frames', methods=['POST'])
@limiter.limit("120 per minute")
@jwt_required()
@validate_with(MotionFrameSchema)
def add_motion_frame(workout_id, validated_data):
    user_id = int(get_jwt_identity())
    workout = Workout.query.filter_by(id=workout_id, user_id=user_id).first()
    
    if not workout:
        return jsonify({'message': 'Workout not found'}), 404
    
    frame = MotionFrame(
        workout_id=workout_id,
        frame_number=validated_data.get('frame_number'),
        landmarks=validated_data.get('landmarks'),
        joint_angles=validated_data.get('joint_angles'),
        velocity=validated_data.get('velocity')
    )
    
    db.session.add(frame)
    db.session.commit()
    return jsonify({'frame': frame.to_dict()}), 201


def _generate_session_alerts(user_id, latest_session, recent_sessions):
    
    def _create_alert_if_new(alert_type, severity, message, suggestion):
        existing = Alert.query.filter_by(
            user_id=user_id,
            alert_type=alert_type,
            message=message
        ).first()
        
        if not existing:
            alert = Alert(
                user_id=user_id,
                alert_type=alert_type,
                severity=severity,
                message=message,
                suggestion=suggestion,
                is_read=False,
                owner_notified=False
            )
            db.session.add(alert)
            return alert
        return None
    
    alerts_created = []
    
    if latest_session.form_score < 60:
        alert = _create_alert_if_new(
            'injury_risk', 'critical',
            f"Your last workout had a form score of {latest_session.form_score:.1f}%, which increases injury risk.",
            'Review exercise tutorials and focus on form over reps. Consider reducing intensity.'
        )
        if alert:
            alerts_created.append(alert)
    
    if len(recent_sessions) > 1:
        max_calories = max(s.total_calories for s in recent_sessions)
        if latest_session.total_calories >= max_calories and latest_session.total_calories > 100:
            alert = _create_alert_if_new(
                'achievement', 'success',
                f"You burned {latest_session.total_calories:.1f} calories in your last workout - your best ever!",
                'Celebrate and maintain this momentum! Share your achievement!'
            )
            if alert:
                alerts_created.append(alert)   
    
    if latest_session.active_minutes < 10 and latest_session.active_minutes > 0:
        alert = _create_alert_if_new(
            'info', 'info',
            f"Your last session was only {latest_session.active_minutes:.1f} minutes. Aim for 20-30 min for best results.",
            'Even short workouts count! Try to gradually increase duration.'
        )
        if alert:
            alerts_created.append(alert)
    
    if len(recent_sessions) >= 5:
        session_dates = set()
        for s in recent_sessions[:5]:
            if s.session_date:
                session_dates.add(s.session_date.isoformat() if hasattr(s.session_date, 'isoformat') else str(s.session_date))
        if len(session_dates) >= 5:
            alert = _create_alert_if_new(
                'overtraining', 'warning',
                f"You've worked out {len(session_dates)} days in a row! Your muscles need recovery time.",
                'Take a rest day or do light stretching/yoga for active recovery.'
            )
            if alert:
                alerts_created.append(alert)
    
    if len(recent_sessions) >= 3:
        form_scores = [s.form_score for s in recent_sessions[:3]]
        form_trend = form_scores[0] - form_scores[2]
        if form_trend < -10:
            alert = _create_alert_if_new(
                'fatigue', 'info',
                f"Your form quality has dropped {abs(form_trend):.1f}% over your last 3 workouts.",
                'Focus on recovery, hydration, and getting 7-8 hours of sleep.'
            )
            if alert:
                alerts_created.append(alert)
    
    if len(recent_sessions) > 1:
        max_reps = max(s.total_reps for s in recent_sessions)
        if latest_session.total_reps >= max_reps and latest_session.total_reps > 50:
            alert = _create_alert_if_new(
                'rep_record', 'success',
                f"You completed {latest_session.total_reps} total reps - a new personal record!",
                'Great strength progress! Consider progressive overload for continued gains.'
            )
            if alert:
                alerts_created.append(alert)
    
    if alerts_created:
        db.session.commit()
    
    return alerts_created
