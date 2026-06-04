"""Software release schema."""
from marshmallow import Schema, fields


class SoftwareReleaseSchema(Schema):
    release_id = fields.Int(dump_only=True)
    product_id = fields.Int(allow_none=True)
    product_name = fields.Str(required=True)
    domain = fields.Str(allow_none=True)
    category = fields.Str(allow_none=True)
    new_version = fields.Str(required=True)
    release_date = fields.Date(required=True)
    release_title = fields.Str(required=True)
    description = fields.Str(allow_none=True)
    highlights = fields.Raw(allow_none=True)
    match_criteria = fields.Raw(required=True)
    is_active = fields.Bool(load_default=True)
    added_by = fields.Int(dump_only=True, allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
