from marshmallow import Schema, fields, validate

class EvaluatePredictionSchema(Schema):
    prediction_id = fields.Integer(required=True, validate=validate.Range(min=1))

class EvaluateAdvancedPredictionSchema(Schema):
    prediction_id = fields.Integer(required=True, validate=validate.Range(min=1))
