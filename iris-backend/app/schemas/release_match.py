"""Release match schema."""
from marshmallow import Schema, fields


class ReleaseMatchSchema(Schema):
    match_id = fields.Int(dump_only=True)
    release_id = fields.Int(required=True)
    account_id = fields.Int(required=True)
    install_id = fields.Int(allow_none=True)
    match_reason = fields.Str(required=True)
    match_score = fields.Int(load_default=0)
    reminder_status = fields.Str(load_default='Pending')
    reminded_at = fields.DateTime(dump_only=True, allow_none=True)
    reminded_by = fields.Int(dump_only=True, allow_none=True)
    created_at = fields.DateTime(dump_only=True)
