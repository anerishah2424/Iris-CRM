"""Installed product schema."""
from marshmallow import Schema, fields, validate

LICENSE_STATUSES = ['Active', 'Expiring Soon', 'Expired', 'Discontinued']


class InstalledProductSchema(Schema):
    install_id = fields.Int(dump_only=True)
    account_id = fields.Int(required=True)
    product_id = fields.Int(required=True)
    sap_code = fields.Str(allow_none=True)
    product_name = fields.Str(allow_none=True)
    domain = fields.Str(allow_none=True)
    category = fields.Str(allow_none=True)
    series = fields.Str(allow_none=True)
    quantity = fields.Int(load_default=1)
    installed_version = fields.Str(allow_none=True)
    install_date = fields.Date(allow_none=True)
    warranty_expiry = fields.Date(allow_none=True)
    license_expiry = fields.Date(allow_none=True)
    license_type = fields.Str(allow_none=True)
    license_status = fields.Str(
        validate=validate.OneOf(LICENSE_STATUSES), load_default='Active'
    )
    hardware_age_years = fields.Decimal(as_string=True, allow_none=True)
    serial_numbers = fields.Raw(allow_none=True)
    amc_start_date = fields.Date(allow_none=True)
    amc_end_date = fields.Date(allow_none=True)
    site_location = fields.Str(allow_none=True)
    notes = fields.Str(allow_none=True)
    added_by = fields.Int(dump_only=True, allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
