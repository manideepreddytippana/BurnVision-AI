from app import db
from datetime import datetime
import bcrypt

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    age = db.Column(db.Integer)
    gender = db.Column(db.String(20))
    height = db.Column(db.Float)  
    weight = db.Column(db.Float)  
    bmi = db.Column(db.Float)
    fitness_level = db.Column(db.String(50))  
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    
    workouts = db.relationship('Workout', backref='user', lazy='dynamic')
    alerts = db.relationship('Alert', backref='user', lazy='dynamic')
    live_sessions = db.relationship('LiveWorkoutSession', backref='user', lazy='dynamic')
    exercise_stats = db.relationship('ExerciseStatistics', backref='user', uselist=False)
    
    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(
            password.encode('utf-8'), 
            bcrypt.gensalt()
        ).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.checkpw(
            password.encode('utf-8'), 
            self.password_hash.encode('utf-8')
        )
    
    def calculate_bmi(self):
        if self.height and self.weight:
            height_m = self.height / 100
            self.bmi = round(self.weight / (height_m * height_m), 2)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'age': self.age,
            'gender': self.gender,
            'height': self.height,
            'weight': self.weight,
            'bmi': self.bmi,
            'fitness_level': self.fitness_level,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Room(db.Model):
    __tablename__ = 'rooms'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    max_participants = db.Column(db.Integer, default=20)
    duration_limit = db.Column(db.Integer, default=60)  
    min_calorie_goal = db.Column(db.Integer, default=200)
    max_calorie_goal = db.Column(db.Integer, default=500)
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    
    workouts = db.relationship('Workout', backref='room', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'max_participants': self.max_participants,
            'duration_limit': self.duration_limit,
            'min_calorie_goal': self.min_calorie_goal,
            'max_calorie_goal': self.max_calorie_goal,
            'is_active': self.is_active,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'current_participants': self.workouts.filter_by(end_time=None).count()
        }


class Workout(db.Model):
    __tablename__ = 'workouts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'))
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    total_calories = db.Column(db.Float, default=0)
    form_quality_score = db.Column(db.Float)
    environment = db.Column(db.String(50))  
    context_factors = db.Column(db.JSON)  
    exercise_type = db.Column(db.String(100))
    
    
    motion_frames = db.relationship('MotionFrame', backref='workout', lazy='dynamic')
    predictions = db.relationship('Prediction', backref='workout', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'room_id': self.room_id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'total_calories': self.total_calories,
            'form_quality_score': self.form_quality_score,
            'environment': self.environment,
            'context_factors': self.context_factors,
            'exercise_type': self.exercise_type,
            'duration': (self.end_time - self.start_time).total_seconds() if self.end_time and self.start_time else None
        }



class LiveWorkoutSession(db.Model):
    __tablename__ = 'live_workout_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_date = db.Column(db.Date, default=datetime.utcnow().date)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    user_weight = db.Column(db.Float)  
    
    
    squat_calories = db.Column(db.Float, default=0)
    pushup_calories = db.Column(db.Float, default=0)
    
    
    lunge_calories = db.Column(db.Float, default=0)
    jumping_jack_calories = db.Column(db.Float, default=0)
    high_knee_calories = db.Column(db.Float, default=0)
    burpee_calories = db.Column(db.Float, default=0)
    plank_calories = db.Column(db.Float, default=0)

    situp_calories = db.Column(db.Float, default=0)
    leg_raise_calories = db.Column(db.Float, default=0)
    bicycle_crunch_calories = db.Column(db.Float, default=0)
    
    total_calories = db.Column(db.Float, default=0)
    
    
    squat_reps = db.Column(db.Integer, default=0)
    pushup_reps = db.Column(db.Integer, default=0)
    
    
    lunge_reps = db.Column(db.Integer, default=0)
    jumping_jack_reps = db.Column(db.Integer, default=0)
    high_knee_reps = db.Column(db.Integer, default=0)
    burpee_reps = db.Column(db.Integer, default=0)
    plank_seconds = db.Column(db.Float, default=0)  

    situp_reps = db.Column(db.Integer, default=0)
    leg_raise_reps = db.Column(db.Integer, default=0)
    bicycle_crunch_reps = db.Column(db.Integer, default=0)
    
    total_reps = db.Column(db.Integer, default=0)
    
    
    form_score = db.Column(db.Float, default=0)
    consistency = db.Column(db.Float, default=0)
    cadence = db.Column(db.Float, default=0)
    active_minutes = db.Column(db.Float, default=0)
    
    
    exercises_done = db.Column(db.String(100))  
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        duration = None
        if self.end_time and self.start_time:
            duration = (self.end_time - self.start_time).total_seconds()
        
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_date': self.session_date.isoformat() if self.session_date else None,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'user_weight': self.user_weight,
            
            'squat_calories': self.squat_calories,
            'pushup_calories': self.pushup_calories,
            'lunge_calories': self.lunge_calories,
            'jumping_jack_calories': self.jumping_jack_calories,
            'high_knee_calories': self.high_knee_calories,
            'burpee_calories': self.burpee_calories,
            'plank_calories': self.plank_calories,

            'situp_calories': self.situp_calories,
            'leg_raise_calories': self.leg_raise_calories,
            'bicycle_crunch_calories': self.bicycle_crunch_calories,
            'total_calories': self.total_calories,
            
            'squat_reps': self.squat_reps,
            'pushup_reps': self.pushup_reps,
            'lunge_reps': self.lunge_reps,
            'jumping_jack_reps': self.jumping_jack_reps,
            'high_knee_reps': self.high_knee_reps,
            'burpee_reps': self.burpee_reps,
            'plank_seconds': self.plank_seconds,

            'situp_reps': self.situp_reps,
            'leg_raise_reps': self.leg_raise_reps,
            'bicycle_crunch_reps': self.bicycle_crunch_reps,
            'total_reps': self.total_reps,
            
            'form_score': self.form_score,
            'consistency': self.consistency,
            'cadence': self.cadence,
            'active_minutes': self.active_minutes,
            'exercises_done': self.exercises_done,
            'duration': duration,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class LiveWorkoutSessionSuggestion(db.Model):
    """Stores AI suggestions for realtime camera workout sessions."""
    __tablename__ = 'live_workout_sessions_suggestions'

    id = db.Column(db.Integer, primary_key=True)
    live_workout_session_id = db.Column(db.Integer, db.ForeignKey('live_workout_sessions.id'), nullable=False, unique=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)

    
    calorie_prediction_explanation_id = db.Column(db.Integer, db.ForeignKey('calorie_predictions_explanations.id'), nullable=True, index=True)

    
    session_data = db.Column(db.JSON, nullable=False)
    ai_suggestions = db.Column(db.JSON, nullable=False)
    summary_points = db.Column(db.JSON, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    live_session = db.relationship('LiveWorkoutSession', backref=db.backref('ai_suggestion', uselist=False, lazy=True))
    calorie_prediction_explanation = db.relationship('CaloriePredictionExplanation', backref=db.backref('live_workout_suggestions', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'live_workout_session_id': self.live_workout_session_id,
            'user_id': self.user_id,
            'calorie_prediction_explanation_id': self.calorie_prediction_explanation_id,
            'session_data': self.session_data,
            'ai_suggestions': self.ai_suggestions,
            'summary_points': self.summary_points or [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }



class ExerciseStatistics(db.Model):
    __tablename__ = 'exercise_statistics'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    user_name = db.Column(db.String(255))  
    
    
    total_calories = db.Column(db.Float, default=0)
    total_sessions = db.Column(db.Integer, default=0)
    total_squat_reps = db.Column(db.Integer, default=0)
    total_pushup_reps = db.Column(db.Integer, default=0)
    total_lunge_reps = db.Column(db.Integer, default=0)
    total_jumping_jack_reps = db.Column(db.Integer, default=0)
    total_high_knee_reps = db.Column(db.Integer, default=0)
    total_burpee_reps = db.Column(db.Integer, default=0)
    total_plank_seconds = db.Column(db.Float, default=0)

    total_situp_reps = db.Column(db.Integer, default=0)
    total_leg_raise_reps = db.Column(db.Integer, default=0)
    total_bicycle_crunch_reps = db.Column(db.Integer, default=0)
    total_reps = db.Column(db.Integer, default=0)
    total_active_minutes = db.Column(db.Float, default=0)
    
    
    avg_form_score = db.Column(db.Float, default=0)
    avg_calories_per_session = db.Column(db.Float, default=0)
    
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user_name,
            'total_calories': self.total_calories,
            'total_sessions': self.total_sessions,
            'total_squat_reps': self.total_squat_reps,
            'total_pushup_reps': self.total_pushup_reps,
            'total_lunge_reps': self.total_lunge_reps,
            'total_jumping_jack_reps': self.total_jumping_jack_reps,
            'total_high_knee_reps': self.total_high_knee_reps,
            'total_burpee_reps': self.total_burpee_reps,
            'total_plank_seconds': self.total_plank_seconds,

            'total_situp_reps': self.total_situp_reps,
            'total_leg_raise_reps': self.total_leg_raise_reps,
            'total_bicycle_crunch_reps': self.total_bicycle_crunch_reps,
            'total_reps': self.total_reps,
            'total_active_minutes': self.total_active_minutes,
            'avg_form_score': self.avg_form_score,
            'avg_calories_per_session': self.avg_calories_per_session,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class MotionFrame(db.Model):
    __tablename__ = 'motion_frames'
    
    id = db.Column(db.Integer, primary_key=True)
    workout_id = db.Column(db.Integer, db.ForeignKey('workouts.id'), nullable=False)
    frame_number = db.Column(db.Integer)
    landmarks = db.Column(db.JSON)  
    joint_angles = db.Column(db.JSON)  
    velocity = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'workout_id': self.workout_id,
            'frame_number': self.frame_number,
            'joint_angles': self.joint_angles,
            'velocity': self.velocity,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }


class Prediction(db.Model):
    __tablename__ = 'predictions'
    
    id = db.Column(db.Integer, primary_key=True)
    workout_id = db.Column(db.Integer, db.ForeignKey('workouts.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    predicted_calories = db.Column(db.Float)
    confidence_score = db.Column(db.Float)
    shap_values = db.Column(db.JSON)  
    explanation = db.Column(db.Text)  
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'workout_id': self.workout_id,
            'user_id': self.user_id,
            'predicted_calories': self.predicted_calories,
            'confidence_score': self.confidence_score,
            'shap_values': self.shap_values,
            'explanation': self.explanation,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Alert(db.Model):
    __tablename__ = 'alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    alert_type = db.Column(db.String(50))  
    severity = db.Column(db.String(20))  
    message = db.Column(db.Text)
    suggestion = db.Column(db.Text)
    is_read = db.Column(db.Boolean, default=False)
    owner_notified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'alert_type': self.alert_type,
            'severity': self.severity,
            'message': self.message,
            'suggestion': self.suggestion,
            'is_read': self.is_read,
            'owner_notified': self.owner_notified,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class CaloriePrediction(db.Model):
    """Stores calorie prediction history for ML-based predictions"""
    __tablename__ = 'calorie_predictions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    
    gender = db.Column(db.String(20))
    age = db.Column(db.Integer)
    height = db.Column(db.Float)  
    weight = db.Column(db.Float)  
    duration = db.Column(db.Float)  
    heart_rate = db.Column(db.Float)  
    body_temp = db.Column(db.Float)  
    
    
    predicted_calories = db.Column(db.Float)
    confidence_score = db.Column(db.Float)
    
    
    model_type = db.Column(db.String(50))  
    train_split = db.Column(db.Float)  
    
    
    derived_metrics = db.Column(db.JSON)
    
    
    recommendation = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    
    user = db.relationship('User', backref=db.backref('calorie_predictions', lazy='dynamic'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'gender': self.gender,
            'age': self.age,
            'height': self.height,
            'weight': self.weight,
            'duration': self.duration,
            'heart_rate': self.heart_rate,
            'body_temp': self.body_temp,
            'predicted_calories': self.predicted_calories,
            'confidence_score': self.confidence_score,
            'model_type': self.model_type,
            'train_split': self.train_split,
            'derived_metrics': self.derived_metrics,
            'recommendation': self.recommendation,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class CaloriePredictionExplanation(db.Model):
    """Stores persisted Sarvam insights paired with main prediction data."""
    __tablename__ = 'calorie_predictions_explanations'

    id = db.Column(db.Integer, primary_key=True)
    prediction_id = db.Column(db.Integer, db.ForeignKey('calorie_predictions.id'), nullable=False, unique=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)

    
    main_prediction_data = db.Column(db.JSON, nullable=False)

    
    ai_insights = db.Column(db.JSON, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    prediction = db.relationship('CaloriePrediction', backref=db.backref('sarvam_explanation', uselist=False, lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'prediction_id': self.prediction_id,
            'user_id': self.user_id,
            'prediction_type': 'standard',
            'main_prediction_data': self.main_prediction_data,
            'ai_insights': self.ai_insights,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class AdvancedCaloriePrediction(db.Model):
    """Stores advanced calorie prediction history with comprehensive workout features"""
    __tablename__ = 'advanced_calorie_predictions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    
    gender = db.Column(db.String(20))
    age = db.Column(db.Integer)
    weight = db.Column(db.Float)  
    height = db.Column(db.Float)  
    
    
    resting_heart_rate = db.Column(db.Float)  
    avg_heart_rate = db.Column(db.Float)  
    
    
    workout_type = db.Column(db.String(50))  
    exercise_name = db.Column(db.String(100))
    session_duration = db.Column(db.Float)  
    sets = db.Column(db.Float)
    reps = db.Column(db.Float)
    difficulty_level = db.Column(db.String(50))  
    
    
    experience_level = db.Column(db.Float)  
    
    
    water_intake = db.Column(db.Float)  
    workout_frequency = db.Column(db.Float)  
    
    
    predicted_calories = db.Column(db.Float)
    confidence_score = db.Column(db.Float)
    
    
    model_type = db.Column(db.String(50))
    train_split = db.Column(db.Float)
    
    
    derived_metrics = db.Column(db.JSON)
    
    
    recommendation = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    
    user = db.relationship('User', backref=db.backref('advanced_calorie_predictions', lazy='dynamic'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'gender': self.gender,
            'age': self.age,
            'weight': self.weight,
            'height': self.height,
            'resting_heart_rate': self.resting_heart_rate,
            'avg_heart_rate': self.avg_heart_rate,
            'workout_type': self.workout_type,
            'exercise_name': self.exercise_name,
            'session_duration': self.session_duration,
            'sets': self.sets,
            'reps': self.reps,
            'difficulty_level': self.difficulty_level,
            'experience_level': self.experience_level,
            'water_intake': self.water_intake,
            'workout_frequency': self.workout_frequency,
            'predicted_calories': self.predicted_calories,
            'confidence_score': self.confidence_score,
            'model_type': self.model_type,
            'train_split': self.train_split,
            'derived_metrics': self.derived_metrics,
            'recommendation': self.recommendation,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'prediction_type': 'advanced'
        }


class AdvancedCaloriePredictionExplanation(db.Model):
    """Stores persisted Sarvam insights paired with advanced prediction data."""
    __tablename__ = 'advanced_calorie_predictions_explanations'

    id = db.Column(db.Integer, primary_key=True)
    prediction_id = db.Column(db.Integer, db.ForeignKey('advanced_calorie_predictions.id'), nullable=False, unique=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)

    
    main_prediction_data = db.Column(db.JSON, nullable=False)

    
    ai_insights = db.Column(db.JSON, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    prediction = db.relationship('AdvancedCaloriePrediction', backref=db.backref('sarvam_explanation', uselist=False, lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'prediction_id': self.prediction_id,
            'user_id': self.user_id,
            'prediction_type': 'advanced',
            'main_prediction_data': self.main_prediction_data,
            'ai_insights': self.ai_insights,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
