"""Product schema."""
from marshmallow import Schema, fields, validate

DOMAINS = [
    'Video Surveillance', 'Access Control', 'Time Attendance',
    'Telecom', 'Video Management Software', 'Visitor Management', 'Intrusion Alarm',
]

PRODUCT_STATUSES = ['Active', 'EOL', 'Discontinued']
LICENSE_TYPES = ['Perpetual', 'Annual', 'Multi-Year', 'None']
DEPLOYMENT_TYPES = ['On-Premise', 'Cloud', 'Hybrid']


class ProductSchema(Schema):
    product_id = fields.Int(dump_only=True)
    sap_code = fields.Str(allow_none=True)
    product_name = fields.Str(required=True, validate=validate.Length(min=1, max=300))
    domain = fields.Str(required=True, validate=validate.OneOf(DOMAINS))
    category = fields.Str(allow_none=True)
    model_series = fields.Str(allow_none=True)
    series = fields.Str(allow_none=True)
    deployment_type = fields.Str(allow_none=True, validate=validate.OneOf(DEPLOYMENT_TYPES + [None]))
    resolution_mp = fields.Decimal(as_string=True, allow_none=True)
    is_stqc_er_compliant = fields.Bool(load_default=False)
    is_bis_certified = fields.Bool(load_default=False)
    is_onvif = fields.Bool(load_default=False)
    unit_price = fields.Decimal(as_string=True, allow_none=True)
    license_type = fields.Str(allow_none=True)
    expected_lifespan_years = fields.Int(load_default=5)
    keywords = fields.Str(allow_none=True)
    complementary_products = fields.Str(allow_none=True)
    industry_fit = fields.Str(allow_none=True)
    description = fields.Str(allow_none=True)
    datasheet_url = fields.Str(allow_none=True)
    status = fields.Str(validate=validate.OneOf(PRODUCT_STATUSES), load_default='Active')
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
