"""SI Partner schema."""
from marshmallow import Schema, fields


class SIPartnerSchema(Schema):
    si_id = fields.Int(dump_only=True)
    si_name = fields.Str(required=True)
    contact_name = fields.Str(allow_none=True)
    contact_phone = fields.Str(allow_none=True)
    contact_email = fields.Email(allow_none=True)
    city = fields.Str(allow_none=True)
    state = fields.Str(allow_none=True)
    zone_id = fields.Int(allow_none=True)
    is_active = fields.Bool(dump_default=True)
    created_at = fields.DateTime(dump_only=True)
