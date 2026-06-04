"""SI Partner model."""
from datetime import datetime
from app.extensions import db


class SIPartner(db.Model):
    __tablename__ = 'si_partners'

    si_id = db.Column(db.Integer, primary_key=True)
    si_name = db.Column(db.String(300), nullable=False)
    contact_name = db.Column(db.String(200))
    contact_phone = db.Column(db.String(20))
    contact_email = db.Column(db.String(255))
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    zone_id = db.Column(db.Integer, db.ForeignKey('zones.zone_id'), nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    zone = db.relationship('Zone', back_populates='si_partners')
    accounts = db.relationship('Account', back_populates='si_partner', lazy='dynamic')

    def to_dict(self, include_zone=False):
        data = {
            'si_id': self.si_id,
            'si_name': self.si_name,
            'contact_name': self.contact_name,
            'contact_phone': self.contact_phone,
            'contact_email': self.contact_email,
            'city': self.city,
            'state': self.state,
            'zone_id': self.zone_id,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_zone and self.zone:
            data['zone'] = self.zone.to_dict()
        return data

    def __repr__(self):
        return f'<SIPartner {self.si_id}: {self.si_name}>'
