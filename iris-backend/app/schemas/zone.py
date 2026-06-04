"""Zone schema."""
from marshmallow import Schema, fields


class ZoneSchema(Schema):
    zone_id = fields.Int(dump_only=True)
    zone_name = fields.Str(required=True)
    states = fields.List(fields.Str(), load_default=[])
    sales_office = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
