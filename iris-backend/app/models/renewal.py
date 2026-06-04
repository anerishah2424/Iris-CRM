"""Renewal model."""
from datetime import datetime, date
from app.extensions import db


class Renewal(db.Model):
    __tablename__ = 'renewals'

    renewal_id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.account_id'), nullable=False)
    install_id = db.Column(db.Integer, db.ForeignKey('installed_products.install_id'),
                           nullable=False)
    renewal_type = db.Column(db.String(50))  # 'License' | 'AMC' | 'Warranty'
    expiry_date = db.Column(db.Date, nullable=False)
    renewal_status = db.Column(db.String(50), default='Upcoming')
    # 'Upcoming' | 'Due Soon' | 'Overdue' | 'Renewed' | 'Discontinued'
    reminder_status = db.Column(db.String(50), default='Pending')
    # 'Pending' | 'Reminded' | 'Closed'
    reminder_sent_at = db.Column(db.DateTime)
    reminder_sent_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    # Relationships
    account = db.relationship('Account', back_populates='renewals')
    installed_product = db.relationship('InstalledProduct', back_populates='renewals')
    reminder_sent_by_user = db.relationship('User', foreign_keys=[reminder_sent_by])

    def to_dict(self, include_relations=False):
        today = date.today()
        days_remaining = (self.expiry_date - today).days if self.expiry_date else None
        data = {
            'renewal_id': self.renewal_id,
            'account_id': self.account_id,
            'install_id': self.install_id,
            'renewal_type': self.renewal_type,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'renewal_status': self.renewal_status,
            'reminder_status': self.reminder_status or 'Pending',
            'days_remaining': days_remaining,
            'reminder_sent_at': self.reminder_sent_at.isoformat() if self.reminder_sent_at else None,
            'reminder_sent_by': self.reminder_sent_by,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_relations:
            if self.account:
                data['account_name'] = self.account.account_name
                data['account_city'] = self.account.city
                data['health_score'] = self.account.health_score
                # SI partner name
                if self.account.si_partner:
                    data['si_name'] = self.account.si_partner.si_name
            if self.installed_product and self.installed_product.product:
                data['product_name'] = self.installed_product.product.product_name
                data['domain'] = self.installed_product.product.domain
        return data

    def __repr__(self):
        return f'<Renewal {self.renewal_id}: account={self.account_id} {self.renewal_type} exp={self.expiry_date}>'

