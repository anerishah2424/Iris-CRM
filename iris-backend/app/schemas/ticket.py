"""Ticket schema."""
from marshmallow import Schema, fields, validate

PRIORITIES = ['Low', 'Medium', 'High', 'Critical']
STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed']
CATEGORIES = ['Hardware Fault', 'Software Bug', 'Configuration', 'Training', 'Upgrade', 'Other']


class TicketSchema(Schema):
    ticket_id = fields.Int(dump_only=True)
    account_id = fields.Int(required=True)
    install_id = fields.Int(allow_none=True)
    ticket_ref = fields.Str(allow_none=True)
    title = fields.Str(required=True, validate=validate.Length(min=1, max=500))
    description = fields.Str(allow_none=True)
    priority = fields.Str(validate=validate.OneOf(PRIORITIES), load_default='Medium')
    status = fields.Str(validate=validate.OneOf(STATUSES), load_default='Open')
    category = fields.Str(allow_none=True, validate=validate.OneOf(CATEGORIES + [None]))
    raised_by = fields.Str(allow_none=True)
    raised_on = fields.DateTime(dump_only=True)
    resolved_on = fields.DateTime(allow_none=True)
    sla_breach = fields.Bool(load_default=False)
    assigned_to = fields.Int(allow_none=True)
    source = fields.Str(load_default='manual')
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
