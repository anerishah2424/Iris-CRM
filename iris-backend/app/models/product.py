"""Product catalog model."""
from datetime import datetime
from app.extensions import db


class Product(db.Model):
    __tablename__ = 'product_catalog'

    product_id = db.Column(db.Integer, primary_key=True)
    sap_code = db.Column(db.String(100), unique=True)
    product_name = db.Column(db.String(300), nullable=False)
    domain = db.Column(db.String(100), nullable=False)
    # 'Video Surveillance' | 'Access Control' | 'Time Attendance'
    # | 'Telecom' | 'Video Management Software' | 'Visitor Management' | 'Intrusion Alarm'
    category = db.Column(db.String(150))
    model_series = db.Column(db.String(150))
    series = db.Column(db.String(150))
    deployment_type = db.Column(db.String(100))  # 'On-Premise' | 'Cloud' | 'Hybrid'
    resolution_mp = db.Column(db.Numeric(4, 1))
    is_stqc_er_compliant = db.Column(db.Boolean, default=False)
    is_bis_certified = db.Column(db.Boolean, default=False)
    is_onvif = db.Column(db.Boolean, default=False)
    unit_price = db.Column(db.Numeric(12, 2))
    license_type = db.Column(db.String(100))  # 'Perpetual' | 'Annual' | 'Multi-Year' | 'None'
    expected_lifespan_years = db.Column(db.Integer, default=5)
    keywords = db.Column(db.Text)  # Comma-separated
    complementary_products = db.Column(db.Text)  # Comma-separated sap_codes
    industry_fit = db.Column(db.Text)  # Comma-separated industries
    description = db.Column(db.Text)
    datasheet_url = db.Column(db.String(500))
    status = db.Column(db.String(50), default='Active')  # 'Active' | 'EOL' | 'Discontinued'
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    # Relationships
    installed_products = db.relationship('InstalledProduct', back_populates='product',
                                         lazy='dynamic')
    releases = db.relationship('SoftwareRelease', back_populates='product', lazy='dynamic')
    knowledge_base = db.relationship('ProductKnowledgeBase', back_populates='product',
                                     uselist=False)

    def to_dict(self):
        return {
            'product_id': self.product_id,
            'sap_code': self.sap_code,
            'product_name': self.product_name,
            'domain': self.domain,
            'category': self.category,
            'model_series': self.model_series,
            'series': self.series,
            'deployment_type': self.deployment_type,
            'resolution_mp': float(self.resolution_mp) if self.resolution_mp else None,
            'is_stqc_er_compliant': self.is_stqc_er_compliant,
            'is_bis_certified': self.is_bis_certified,
            'is_onvif': self.is_onvif,
            'unit_price': float(self.unit_price) if self.unit_price else None,
            'license_type': self.license_type,
            'expected_lifespan_years': self.expected_lifespan_years,
            'keywords': self.keywords,
            'complementary_products': self.complementary_products,
            'industry_fit': self.industry_fit,
            'description': self.description,
            'datasheet_url': self.datasheet_url,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<Product {self.product_id}: {self.product_name}>'
