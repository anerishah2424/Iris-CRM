"""Installed Product model."""
import json
from datetime import datetime
from app.extensions import db


class InstalledProduct(db.Model):
    __tablename__ = 'installed_products'

    install_id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.account_id', ondelete='CASCADE'),
                           nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product_catalog.product_id'), nullable=False)
    sap_code = db.Column(db.String(100))
    product_name = db.Column(db.String(300))
    domain = db.Column(db.String(100))
    category = db.Column(db.String(150))
    series = db.Column(db.String(150))
    quantity = db.Column(db.Integer, nullable=False, default=1)
    installed_version = db.Column(db.String(50))
    install_date = db.Column(db.Date)
    warranty_expiry = db.Column(db.Date)
    license_expiry = db.Column(db.Date)
    license_type = db.Column(db.String(100))  # 'Annual' | 'Multi-Year' | 'Perpetual' | 'None'
    license_status = db.Column(db.String(50), default='Active')
    # 'Active' | 'Expiring Soon' | 'Expired' | 'Discontinued'
    hardware_age_years = db.Column(db.Numeric(4, 1))
    _serial_numbers = db.Column('serial_numbers', db.Text)  # JSON array
    amc_start_date = db.Column(db.Date)
    amc_end_date = db.Column(db.Date)
    site_location = db.Column(db.String(300))
    notes = db.Column(db.Text)
    added_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    # Relationships
    account = db.relationship('Account', back_populates='installed_products')
    product = db.relationship('Product', back_populates='installed_products')
    tickets = db.relationship('Ticket', back_populates='installed_product', lazy='dynamic')
    renewals = db.relationship('Renewal', back_populates='installed_product', lazy='dynamic')
    release_matches = db.relationship('ReleaseMatch', back_populates='installed_product',
                                      lazy='dynamic')

    @property
    def serial_numbers(self):
        try:
            return json.loads(self._serial_numbers or '[]')
        except (ValueError, TypeError):
            return []

    @serial_numbers.setter
    def serial_numbers(self, value):
        self._serial_numbers = json.dumps(value if isinstance(value, list) else [])

    def to_dict(self, include_product=False):
        data = {
            'install_id': self.install_id,
            'account_id': self.account_id,
            'product_id': self.product_id,
            'sap_code': self.sap_code,
            'product_name': self.product_name,
            'domain': self.domain,
            'category': self.category,
            'series': self.series,
            'quantity': self.quantity,
            'installed_version': self.installed_version,
            'install_date': self.install_date.isoformat() if self.install_date else None,
            'warranty_expiry': self.warranty_expiry.isoformat() if self.warranty_expiry else None,
            'license_expiry': self.license_expiry.isoformat() if self.license_expiry else None,
            'license_type': self.license_type,
            'license_status': self.license_status,
            'hardware_age_years': float(self.hardware_age_years) if self.hardware_age_years else None,
            'serial_numbers': self.serial_numbers,
            'amc_start_date': self.amc_start_date.isoformat() if self.amc_start_date else None,
            'amc_end_date': self.amc_end_date.isoformat() if self.amc_end_date else None,
            'site_location': self.site_location,
            'notes': self.notes,
            'added_by': self.added_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_product and self.product:
            data['product'] = {
                'product_name': self.product.product_name,
                'domain': self.product.domain,
                'category': self.product.category,
                'model_series': self.product.model_series,
                'expected_lifespan_years': self.product.expected_lifespan_years,
            }
        return data

    def __repr__(self):
        return f'<InstalledProduct {self.install_id}: account={self.account_id} product={self.product_id}>'
