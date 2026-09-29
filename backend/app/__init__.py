from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()

jwt = JWTManager()

def create_app(test_config=None):
    app = Flask(__name__)

    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(
        seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', '3600'))
    )
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(
        seconds=int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', '2592000'))
    )
    app.config['SARVAM_API_KEY'] = os.getenv('SARVAM_API_KEY') or os.getenv('SARVAM_AI_API_KEY')
    app.config['SARVAM_AI_MODEL'] = os.getenv('SARVAM_AI_MODEL') or os.getenv('SARVAM_MODEL', 'sarvam-105b')
    app.config['SARVAM_AI_TIMEOUT'] = int(os.getenv('SARVAM_AI_TIMEOUT', '200'))
    
    # Enforce request size limits to prevent DoS via large payloads (default 1MB)
    max_mb = int(os.getenv('MAX_CONTENT_LENGTH_MB', '1'))
    app.config['MAX_CONTENT_LENGTH'] = max_mb * 1024 * 1024

    if test_config:
        app.config.update(test_config)

    if not app.config.get('SECRET_KEY') and not app.config.get('TESTING'):
        raise ValueError("No SECRET_KEY set for Flask application")
    if not app.config.get('JWT_SECRET_KEY') and not app.config.get('TESTING'):
        raise ValueError("No JWT_SECRET_KEY set for Flask application")

    db.init_app(app)
    migrate.init_app(app, db)

    jwt.init_app(app)
        
    allowed_origins = [
        "http://localhost:3000", "http://localhost:3001",
        "http://localhost:3002", "http://localhost:3003",
        "http://localhost:5000",
        "http://user-frontend:3000", "http://admin-frontend:3001",
        "https://burnvision-admin-frontend.onrender.com",
        "https://burnvision-user-frontend.onrender.com"
    ]
    custom_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")
    if custom_origins:
        allowed_origins.extend([origin.strip().rstrip("/") for origin in custom_origins.split(",") if origin.strip()])

    CORS(app, resources={
        r"/api/*": {
            "origins": allowed_origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        return {'message': 'The provided token is invalid.'}, 422
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'message': 'Token has expired.'}, 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error_string):
        return {'message': 'Authentication token is required.'}, 401
    
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload: dict) -> bool:
        from app.models import TokenBlocklist
        jti = jwt_payload["jti"]
        token = db.session.query(TokenBlocklist.id).filter_by(jti=jti).scalar()
        return token is not None
    
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return {'message': 'The token has been revoked'}, 401

    from app.middleware.security_headers import init_security_headers
    init_security_headers(app)

    from app.middleware.error_handlers import init_error_handlers
    init_error_handlers(app)

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

    from app.rate_limiter import init_rate_limiter, limiter
    init_rate_limiter(app)

    @app.route('/api/health')
    @limiter.exempt
    def health_check():
        return {'status': 'healthy', 'version': '1.0.0'}
    
    return app
