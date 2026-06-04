"""Zone model."""
import json
from datetime import datetime
from app.extensions import db


class Zone(db.Model):
    __tablename__ = 'zones'

    zone_id = db.Column(db.Integer, primary_key=True)
    zone_name = db.Column(db.String(100), nullable=False)
    states = db.Column(db.String(500), nullable=False, default='')
    sales_office = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    users = db.relationship('User', back_populates='zone', lazy='dynamic',
                            foreign_keys='User.zone_id')
    accounts = db.relationship('Account', back_populates='zone', lazy='dynamic')
    si_partners = db.relationship('SIPartner', back_populates='zone', lazy='dynamic')

    def to_dict(self):
        return {
            'zone_id': self.zone_id,
            'zone_name': self.zone_name,
            'states': [s.strip() for s in self.states.split(',')] if self.states else [],
            'sales_office': self.sales_office,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<Zone {self.zone_id}: {self.zone_name}>'
