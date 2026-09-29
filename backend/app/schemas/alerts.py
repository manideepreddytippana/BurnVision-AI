from marshmallow import Schema, fields, validate

class CreateAlertSchema(Schema):
    alert_type = fields.String(validate=validate.Length(max=50), load_default='info')
    severity = fields.String(
        validate=validate.OneOf(['info', 'warning', 'critical']),
        load_default='info'
    )
    message = fields.String(validate=validate.Length(max=1000), load_default='')
    suggestion = fields.String(validate=validate.Length(max=1000), load_default='')
    is_read = fields.Boolean(load_default=False)

class AlertItemSchema(Schema):
    alert_type = fields.String(validate=validate.Length(max=50), load_default='info')
    severity = fields.String(
        validate=validate.OneOf(['info', 'warning', 'critical']),
        load_default='info'
    )
    message = fields.String(validate=validate.Length(max=1000), load_default='')
    suggestion = fields.String(validate=validate.Length(max=1000), load_default='')
    is_read = fields.Boolean(load_default=False)

class SyncAlertsSchema(Schema):
    alerts = fields.List(
        fields.Nested(AlertItemSchema),
        required=True,
        validate=validate.Length(max=100)
    )
