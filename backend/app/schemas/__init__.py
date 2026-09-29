from marshmallow import Schema, ValidationError
from flask import request, jsonify
from functools import wraps

def validate_with(schema_cls, partial=False):

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            json_data = request.get_json(silent=True)
            if json_data is None:
                return jsonify({
                    'error': {
                        'code': 'INVALID_REQUEST_BODY',
                        'message': 'Request body must be valid JSON.',
                        'fields': {}
                    }
                }), 422

            schema = schema_cls()
            try:
                validated = schema.load(json_data, partial=partial)
            except ValidationError as err:
                return jsonify({
                    'error': {
                        'code': 'VALIDATION_ERROR',
                        'message': 'One or more fields failed validation.',
                        'fields': err.messages
                    }
                }), 422

            kwargs['validated_data'] = validated
            return fn(*args, **kwargs)
        return wrapper
    return decorator
