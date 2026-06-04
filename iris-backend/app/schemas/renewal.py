"""Renewal schema."""
from marshmallow import Schema, fields, validate

RENEWAL_TYPES = ['License', 'AMC', 'Warranty']
RENEWAL_STATUSES = ['Upcoming', 'Due Soon', 'Overdue', 'Renewed', 'Discontinued']


class RenewalSchema(Schema):
    renewal_id = fields.Int(dump_only=True)
    account_id = fields.Int(required=True)
    install_id = fields.Int(required=True)
    renewal_type = fields.Str(required=True, validate=validate.OneOf(RENEWAL_TYPES))
    expiry_date = fields.Date(required=True)
    renewal_status = fields.Str(
        validate=validate.OneOf(RENEWAL_STATUSES), load_default='Upcoming'
    )
    reminder_sent_at = fields.DateTime(dump_only=True, allow_none=True)
    reminder_sent_by = fields.Int(dump_only=True, allow_none=True)
    notes = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
