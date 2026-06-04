"""Agent run schema."""
from marshmallow import Schema, fields


class AgentRunSchema(Schema):
    run_id = fields.Int(dump_only=True)
    run_type = fields.Str(required=True)
    account_id = fields.Int(allow_none=True)
    initiated_by = fields.Int(dump_only=True, allow_none=True)
    status = fields.Str(dump_only=True)
    input_payload = fields.Raw(allow_none=True)
    output_payload = fields.Raw(allow_none=True)
    error_message = fields.Str(dump_only=True, allow_none=True)
    started_at = fields.DateTime(dump_only=True)
    completed_at = fields.DateTime(dump_only=True, allow_none=True)
    duration_ms = fields.Int(dump_only=True, allow_none=True)
