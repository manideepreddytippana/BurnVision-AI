from marshmallow import Schema, fields, validate

class CreateRoomSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    max_participants = fields.Integer(
        validate=validate.Range(min=1, max=1000),
        load_default=20
    )
    duration_limit = fields.Integer(
        validate=validate.Range(min=1, max=480),
        load_default=60
    )
    min_calorie_goal = fields.Float(
        validate=validate.Range(min=0, max=10000),
        load_default=200
    )
    max_calorie_goal = fields.Float(
        validate=validate.Range(min=0, max=10000),
        load_default=500
    )

class UpdateRoomSchema(Schema):
    name = fields.String(validate=validate.Length(min=1, max=100))
    max_participants = fields.Integer(validate=validate.Range(min=1, max=1000))
    duration_limit = fields.Integer(validate=validate.Range(min=1, max=480))
    min_calorie_goal = fields.Float(validate=validate.Range(min=0, max=10000))
    max_calorie_goal = fields.Float(validate=validate.Range(min=0, max=10000))
    is_active = fields.Boolean()

class AdminUpdateUserSchema(Schema):
    name = fields.String(validate=validate.Length(min=1, max=100))
    email = fields.Email()
    age = fields.Integer(validate=validate.Range(min=13, max=120))
    gender = fields.String(validate=validate.OneOf(['male', 'female', 'other']))
    height = fields.Float(validate=validate.Range(min=50, max=300))
    weight = fields.Float(validate=validate.Range(min=20, max=500))
    fitness_level = fields.String(
        validate=validate.OneOf(['beginner', 'intermediate', 'advanced', 'athlete'])
    )
