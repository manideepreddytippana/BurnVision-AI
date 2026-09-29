from marshmallow import Schema, fields, validate

class StartWorkoutSchema(Schema):
    room_id = fields.Integer()
    environment = fields.String(
        validate=validate.OneOf(['indoor', 'outdoor']),
        load_default='indoor'
    )
    exercise_type = fields.String(validate=validate.Length(max=50))
    weather = fields.String(validate=validate.Length(max=50))
    fatigue_score = fields.Float(
        validate=validate.Range(min=0, max=10),
        load_default=0
    )
    weight = fields.Float(validate=validate.Range(min=20, max=500))


class EndWorkoutSchema(Schema):
    total_calories = fields.Float(validate=validate.Range(min=0, max=50000), load_default=0)
    form_quality_score = fields.Float(validate=validate.Range(min=0, max=100))
    context_factors = fields.Dict()

class SaveLiveSessionSchema(Schema):
    start_time = fields.String()
    weight = fields.Float(validate=validate.Range(min=20, max=500))
    active_minutes = fields.Float(validate=validate.Range(min=0, max=1440), load_default=0)

    squat_reps = fields.Integer(validate=validate.Range(min=0, max=10000), load_default=0)
    pushup_reps = fields.Integer(validate=validate.Range(min=0, max=10000), load_default=0)
    lunge_reps = fields.Integer(validate=validate.Range(min=0, max=10000), load_default=0)
    jumping_jack_reps = fields.Integer(validate=validate.Range(min=0, max=10000), load_default=0)
    high_knee_reps = fields.Integer(validate=validate.Range(min=0, max=10000), load_default=0)
    burpee_reps = fields.Integer(validate=validate.Range(min=0, max=10000), load_default=0)
    plank_seconds = fields.Float(validate=validate.Range(min=0, max=36000), load_default=0)
    situp_reps = fields.Integer(validate=validate.Range(min=0, max=10000), load_default=0)
    leg_raise_reps = fields.Integer(validate=validate.Range(min=0, max=10000), load_default=0)
    bicycle_crunch_reps = fields.Integer(validate=validate.Range(min=0, max=10000), load_default=0)

    squat_calories = fields.Float(validate=validate.Range(min=0, max=50000), load_default=0)
    pushup_calories = fields.Float(validate=validate.Range(min=0, max=50000), load_default=0)
    lunge_calories = fields.Float(validate=validate.Range(min=0, max=50000), load_default=0)
    jumping_jack_calories = fields.Float(validate=validate.Range(min=0, max=50000), load_default=0)
    high_knee_calories = fields.Float(validate=validate.Range(min=0, max=50000), load_default=0)
    burpee_calories = fields.Float(validate=validate.Range(min=0, max=50000), load_default=0)
    plank_calories = fields.Float(validate=validate.Range(min=0, max=50000), load_default=0)
    situp_calories = fields.Float(validate=validate.Range(min=0, max=50000), load_default=0)
    leg_raise_calories = fields.Float(validate=validate.Range(min=0, max=50000), load_default=0)
    bicycle_crunch_calories = fields.Float(validate=validate.Range(min=0, max=50000), load_default=0)
    total_calories = fields.Float(validate=validate.Range(min=0, max=50000), load_default=0)

    form_score = fields.Float(validate=validate.Range(min=0, max=100), load_default=0)
    consistency = fields.Float(validate=validate.Range(min=0, max=100), load_default=0)
    cadence = fields.Float(validate=validate.Range(min=0, max=300), load_default=0)

class MotionFrameSchema(Schema):
    frame_number = fields.Integer(validate=validate.Range(min=0))
    landmarks = fields.Dict()
    joint_angles = fields.Dict()
    velocity = fields.Float(validate=validate.Range(min=0))
