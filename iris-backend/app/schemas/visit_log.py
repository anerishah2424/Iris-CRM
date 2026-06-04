"""Visit log schema."""
from marshmallow import Schema, fields, validate

VISIT_TYPES = ['SM Visit', 'SI Visit', 'Demo', 'Support', 'Review']


class VisitLogSchema(Schema):
    visit_id = fields.Int(dump_only=True)
    account_id = fields.Int(required=True)
    visited_by = fields.Int(dump_only=True, allow_none=True)
    visit_type = fields.Str(validate=validate.OneOf(VISIT_TYPES), load_default='SM Visit')
    visit_date = fields.Date(required=True)
    notes = fields.Str(allow_none=True)
    next_visit_date = fields.Date(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
