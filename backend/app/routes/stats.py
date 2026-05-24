from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Workout, Prediction
from datetime import datetime, timedelta
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

stats_bp = Blueprint('stats', __name__)

@stats_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    user_id = int(get_jwt_identity())
    
    days = request.args.get('days', 7, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    workouts = Workout.query.filter(
        Workout.user_id == user_id,
        Workout.start_time >= start_date
    ).all()
    
    total_calories = sum(w.total_calories or 0 for w in workouts)
    total_workouts = len(workouts)
    avg_duration = sum(
        (w.end_time - w.start_time).total_seconds() if w.end_time else 0 
        for w in workouts
    ) / max(total_workouts, 1)
    avg_form_score = sum(w.form_quality_score or 0 for w in workouts) / max(total_workouts, 1)
    
    return jsonify({
        'total_calories': total_calories,
        'total_workouts': total_workouts,
        'avg_duration': avg_duration,
        'avg_form_score': round(avg_form_score, 1),
        'period_days': days
    }), 200


@stats_bp.route('/calorie-trends', methods=['GET'])
@jwt_required()
def get_calorie_trends():
    user_id = int(get_jwt_identity())
    
    days = request.args.get('days', 7, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    workouts = Workout.query.filter(
        Workout.user_id == user_id,
        Workout.start_time >= start_date
    ).order_by(Workout.start_time).all()
    
    trends = {}
    for workout in workouts:
        date_key = workout.start_time.strftime('%Y-%m-%d')
        if date_key not in trends:
            trends[date_key] = {'date': date_key, 'calories': 0, 'workouts': 0}
        trends[date_key]['calories'] += workout.total_calories or 0
        trends[date_key]['workouts'] += 1
    
    return jsonify({
        'trends': list(trends.values())
    }), 200


@stats_bp.route('/exercise-comparison', methods=['GET'])
@jwt_required()
def get_exercise_comparison():
    user_id = int(get_jwt_identity())
    
    workouts = Workout.query.filter_by(user_id=user_id)\
        .order_by(Workout.start_time.desc()).limit(50).all()
    
    comparison = {}
    for workout in workouts:
        exercise_type = workout.exercise_type or 'General'
        if exercise_type not in comparison:
            comparison[exercise_type] = {
                'type': exercise_type,
                'total_workouts': 0,
                'total_calories': 0,
                'avg_calories': 0,
                'avg_form_score': 0
            }
        comparison[exercise_type]['total_workouts'] += 1
        comparison[exercise_type]['total_calories'] += workout.total_calories or 0
        comparison[exercise_type]['avg_form_score'] += workout.form_quality_score or 0
    
    for key in comparison:
        count = comparison[key]['total_workouts']
        comparison[key]['avg_calories'] = comparison[key]['total_calories'] / count
        comparison[key]['avg_form_score'] = comparison[key]['avg_form_score'] / count
    
    return jsonify({
        'comparison': list(comparison.values())
    }), 200


@stats_bp.route('/export-pdf', methods=['GET'])
@jwt_required()
def export_pdf():
    user_id = int(get_jwt_identity())
    
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    workouts = Workout.query.filter(
        Workout.user_id == user_id,
        Workout.start_time >= start_date
    ).order_by(Workout.start_time.desc()).all()
    
    # PDF creation
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    c.setFont("Helvetica-Bold", 24)
    c.setFillColor(colors.HexColor('#8B5CF6'))
    c.drawString(50, height - 50, "CalorieAI")
    
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(colors.black)
    c.drawString(50, height - 80, "Exercise Statistics Report")
    
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.gray)
    c.drawString(50, height - 100, f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(colors.black)
    c.drawString(50, height - 140, "Summary")
    
    total_calories = sum(w.total_calories or 0 for w in workouts)
    total_workouts = len(workouts)
    
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 165, f"Total Workouts: {total_workouts}")
    c.drawString(50, height - 185, f"Total Calories Burned: {total_calories:.1f} kcal")
    c.drawString(50, height - 205, f"Period: Last {days} days")
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 245, "Workout Details")
    
    y_position = height - 270
    c.setFont("Helvetica", 10)
    
    c.drawString(50, y_position, "Date")
    c.drawString(150, y_position, "Type")
    c.drawString(250, y_position, "Duration")
    c.drawString(350, y_position, "Calories")
    c.drawString(450, y_position, "Form Score")
    
    y_position -= 20
    
    for workout in workouts[:20]:  
        duration = (workout.end_time - workout.start_time).total_seconds() / 60 if workout.end_time else 0
        c.drawString(50, y_position, workout.start_time.strftime('%Y-%m-%d'))
        c.drawString(150, y_position, workout.exercise_type or 'General')
        c.drawString(250, y_position, f"{duration:.0f} min")
        c.drawString(350, y_position, f"{workout.total_calories or 0:.1f}")
        c.drawString(450, y_position, f"{workout.form_quality_score or 0:.0f}%")
        y_position -= 18
        
        if y_position < 50:
            break
    
    c.save()
    buffer.seek(0)
    
    response = make_response(buffer.getvalue())
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = 'attachment; filename=calorie-ai-stats.pdf'
    
    return response
