from marshmallow import Schema, fields, validate

class ShapValuesSchema(Schema):
    features = fields.Dict(required=True)
    prediction = fields.Float(required=True)

class GenerateExplanationSchema(Schema):
    features = fields.Dict(required=True)
    prediction = fields.Dict(required=True)
