from marshmallow import Schema, fields, validate

class LandmarkSchema(Schema):
    x = fields.Float(required=True)
    y = fields.Float(required=True)
    z = fields.Float()
    visibility = fields.Float()

class AnalyzeLandmarksSchema(Schema):
    landmarks = fields.List(fields.Dict(), required=True, validate=validate.Length(min=1))

class FormFeedbackSchema(Schema):
    landmarks = fields.List(fields.Dict(), required=True, validate=validate.Length(min=1))
    exercise_type = fields.String(validate=validate.Length(max=50), load_default='general')

class CalorieMappingSchema(Schema):
    sequence = fields.List(fields.Dict(), required=True, validate=validate.Length(min=1))
    weight = fields.Float(validate=validate.Range(min=20, max=500), load_default=70)
    duration = fields.Float(validate=validate.Range(min=0, max=86400), load_default=0)
