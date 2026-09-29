from marshmallow import Schema, fields, validate, validates, ValidationError

class RegisterSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(
        required=True,
        validate=validate.Length(min=8, max=128)
    )
    name = fields.String(
        required=True,
        validate=validate.Length(min=1, max=100)
    )
    age = fields.Integer(validate=validate.Range(min=13, max=120))
    gender = fields.String(validate=validate.OneOf(['male', 'female', 'other']))
    height = fields.Float(validate=validate.Range(min=50, max=300))
    weight = fields.Float(validate=validate.Range(min=20, max=500))
    fitness_level = fields.String(
        validate=validate.OneOf(['beginner', 'intermediate', 'advanced', 'athlete'])
    )

class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=1, max=128))

class AdminLoginSchema(LoginSchema):
    pass
