from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy

from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()

jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    
    
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
        'DATABASE_URL', 
        'mysql+pymysql://root:root@localhost:3306/calorie_ai'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(
        seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600))
    )
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(
        seconds=int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 2592000))
    )
    
    
    db.init_app(app)

    jwt.init_app(app)
    
    
    allowed_origins = [
        "http://localhost:3000", "http://localhost:3001",
        "http://localhost:3002", "http://localhost:3003",
        "http://localhost:5000",
        "http://user-frontend:3000", "http://admin-frontend:3001",
    ]
    custom_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")
    if custom_origins:
        allowed_origins.extend([origin.strip() for origin in custom_origins.split(",") if origin.strip()])

    CORS(app, resources={
        r"/api/*": {
            "origins": allowed_origins,
            "origins_regex": [
                r"https://.*\.ngrok-free\.app",
                r"https://.*\.ngrok\.io",
                r"https://.*\.vercel\.app",
                r"https://.*\.onrender\.com",
                r"https://.*\.railway\.app",
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })

    
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        return {'message': f'Invalid token: {error_string}'}, 422
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'message': 'Token has expired'}, 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error_string):
        return {'message': f'Missing token: {error_string}'}, 401
    
    
    from app.routes.auth import auth_bp
    from app.routes.profile import profile_bp
    from app.routes.workout import workout_bp
    from app.routes.prediction import prediction_bp
    from app.routes.motion import motion_bp
    from app.routes.explanation import explanation_bp
    from app.routes.alerts import alerts_bp
    from app.routes.admin import admin_bp
    from app.routes.coach import coach_bp
    from app.routes.stats import stats_bp
    from app.routes.calorie_prediction import calorie_predict_bp
    from app.routes.advanced_calorie_prediction import advanced_calorie_predict_bp
    from app.routes.ai import ai_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(workout_bp, url_prefix='/api/workout')
    app.register_blueprint(prediction_bp, url_prefix='/api/prediction')
    app.register_blueprint(motion_bp, url_prefix='/api/motion')
    app.register_blueprint(explanation_bp, url_prefix='/api/explanation')
    app.register_blueprint(alerts_bp, url_prefix='/api/alerts')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(coach_bp, url_prefix='/api/coach')
    app.register_blueprint(stats_bp, url_prefix='/api/stats')
    app.register_blueprint(calorie_predict_bp, url_prefix='/api/calorie-predict')
    app.register_blueprint(advanced_calorie_predict_bp, url_prefix='/api/advanced-calorie-predict')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    
    
    
    with app.app_context():
        db.create_all()
    
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'version': '1.0.0'}
    
    return app
