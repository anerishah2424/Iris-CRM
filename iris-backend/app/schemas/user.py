"""User schema."""
from marshmallow import Schema, fields, validate


class UserSchema(Schema):
    user_id = fields.Int(dump_only=True)
    full_name = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    email = fields.Email(required=True)
    username = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    password = fields.Str(load_only=True, required=True, validate=validate.Length(min=6))
    role = fields.Str(required=True, validate=validate.OneOf(['matrix_manager', 'Sales_manager']))
    zone_id = fields.Int(allow_none=True)
    phone = fields.Str(allow_none=True)
    designation = fields.Str(allow_none=True)
    is_active = fields.Bool(dump_default=True)
    last_login = fields.DateTime(dump_only=True, allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
