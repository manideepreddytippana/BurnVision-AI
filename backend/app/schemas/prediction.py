from marshmallow import Schema, fields, validate

VALID_MODELS = ['linear_regression', 'random_forest', 'xgboost', 'lightgbm', 'ensemble']
VALID_TRAINABLE_MODELS = ['linear_regression', 'random_forest', 'xgboost', 'lightgbm']

class MakePredictionSchema(Schema):
    workout_id = fields.Integer()
    duration = fields.Float(validate=validate.Range(min=0, max=86400), load_default=0)
    heart_rate = fields.Float(validate=validate.Range(min=30, max=250), load_default=100)
    movement_speed = fields.Float(validate=validate.Range(min=0, max=10), load_default=1.0)
    form_quality = fields.Float(validate=validate.Range(min=0, max=100), load_default=80)
    exercise_type = fields.String(validate=validate.Length(max=50), load_default='general')
    context_multiplier = fields.Float(validate=validate.Range(min=0.1, max=5.0), load_default=1.0)

class CaloriePredictSchema(Schema):
    gender = fields.String(required=True, validate=validate.OneOf(['male', 'female']))
    age = fields.Integer(required=True, validate=validate.Range(min=13, max=120))
    height = fields.Float(required=True, validate=validate.Range(min=50, max=300))
    weight = fields.Float(required=True, validate=validate.Range(min=20, max=500))
    duration = fields.Float(required=True, validate=validate.Range(min=0, max=1440))
    heart_rate = fields.Float(required=True, validate=validate.Range(min=30, max=250))
    body_temp = fields.Float(required=True, validate=validate.Range(min=30, max=45))
    model_type = fields.String(validate=validate.OneOf(VALID_MODELS), load_default='ensemble')
    train_split = fields.Float(validate=validate.Range(min=0.5, max=0.9), load_default=0.8)

class TrainModelSchema(Schema):
    model_type = fields.String(
        required=True,
        validate=validate.OneOf(VALID_TRAINABLE_MODELS)
    )
    train_split = fields.Float(
        validate=validate.Range(min=0.5, max=0.9),
        load_default=0.8
    )

class AdvancedCaloriePredictSchema(Schema):
    gender = fields.String(required=True, validate=validate.OneOf(['Male', 'Female']))
    age = fields.Integer(required=True, validate=validate.Range(min=13, max=120))
    weight = fields.Float(required=True, validate=validate.Range(min=20, max=500))
    height = fields.Float(required=True, validate=validate.Range(min=0.5, max=3.0))
    resting_heart_rate = fields.Float(required=True, validate=validate.Range(min=30, max=200))
    avg_heart_rate = fields.Float(required=True, validate=validate.Range(min=30, max=250))
    workout_type = fields.String(
        required=True,
        validate=validate.OneOf(['Cardio', 'Strength', 'HIIT', 'Yoga'])
    )
    exercise_name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    session_duration = fields.Float(required=True, validate=validate.Range(min=0, max=1440))
    sets = fields.Float(required=True, validate=validate.Range(min=0, max=100))
    reps = fields.Float(required=True, validate=validate.Range(min=0, max=10000))
    difficulty_level = fields.String(
        required=True,
        validate=validate.OneOf(['Beginner', 'Intermediate', 'Advanced'])
    )
    experience_level = fields.Float(required=True, validate=validate.Range(min=1, max=3))
    water_intake = fields.Float(required=True, validate=validate.Range(min=0, max=20))
    workout_frequency = fields.Float(required=True, validate=validate.Range(min=0, max=7))
    model_type = fields.String(validate=validate.OneOf(VALID_MODELS), load_default='ensemble')
    train_split = fields.Float(validate=validate.Range(min=0.5, max=0.9), load_default=0.8)
