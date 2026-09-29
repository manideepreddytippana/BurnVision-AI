from marshmallow import Schema, fields, validate

class SuggestWorkoutSchema(Schema):
    goal = fields.String(
        validate=validate.OneOf([
            'general', 'weight_loss', 'muscle_gain', 'endurance', 'flexibility'
        ]),
        load_default='general'
    )
    available_time = fields.Integer(
        validate=validate.Range(min=5, max=180),
        load_default=30
    )
    energy_level = fields.String(
        validate=validate.OneOf(['low', 'medium', 'high']),
        load_default='medium'
    )
