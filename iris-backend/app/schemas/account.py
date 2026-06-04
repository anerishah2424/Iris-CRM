"""Account schema."""
from marshmallow import Schema, fields, validate


INDUSTRIES = [
    'Manufacturing', 'Healthcare', 'Education', 'Pharma', 'Banking',
    'Retail', 'Hospitality', 'Government', 'Energy', 'IT',
    'Logistics', 'Real Estate',
]

HEALTH_STATUSES = ['Healthy', 'At-Risk', 'Critical']
ACCOUNT_TYPES = ['existing', 'prospect']


class AccountSchema(Schema):
    account_id = fields.Int(dump_only=True)
    account_name = fields.Str(required=True, validate=validate.Length(min=1, max=300))
    industry = fields.Str(required=True, validate=validate.OneOf(INDUSTRIES))
    sub_industry = fields.Str(allow_none=True)
    city = fields.Str(required=True)
    state = fields.Str(required=True)
    zone_id = fields.Int(allow_none=True)
    si_id = fields.Int(allow_none=True)
    si_name = fields.Str(allow_none=True)
    vad_company = fields.Str(allow_none=True)
    sales_manager_id = fields.Int(allow_none=True)
    sales_manager = fields.Str(allow_none=True)
    address = fields.Str(allow_none=True)
    pincode = fields.Str(allow_none=True)
    gstin = fields.Str(allow_none=True)
    pan = fields.Str(allow_none=True)
    website = fields.Str(allow_none=True)
    contact_name = fields.Str(allow_none=True)
    contact_phone = fields.Str(allow_none=True)
    contact_email = fields.Email(allow_none=True)
    account_type = fields.Str(validate=validate.OneOf(ACCOUNT_TYPES), load_default='existing')
    health_score = fields.Int(dump_only=True, allow_none=True)
    health_status = fields.Str(dump_only=True, allow_none=True)
    last_visit_date = fields.Date(allow_none=True)
    notes = fields.Str(allow_none=True)
    is_deleted = fields.Bool(dump_only=True)
    created_by = fields.Int(dump_only=True, allow_none=True)
    created_on = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
