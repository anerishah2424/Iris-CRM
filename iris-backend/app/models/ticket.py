"""Ticket model."""
from datetime import datetime
from app.extensions import db


class Ticket(db.Model):
    __tablename__ = 'tickets'

    ticket_id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.account_id', ondelete='CASCADE'),
                           nullable=False)
    install_id = db.Column(db.Integer, db.ForeignKey('installed_products.install_id'),
                           nullable=True)
    ticket_ref = db.Column(db.String(100))
    title = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text)
    priority = db.Column(db.String(20), default='Medium')  # 'Low' | 'Medium' | 'High' | 'Critical'
    status = db.Column(db.String(30), default='Open')
    # 'Open' | 'In Progress' | 'Resolved' | 'Closed'
    category = db.Column(db.String(100))
    # 'Hardware Fault' | 'Software Bug' | 'Configuration' | 'Training' | 'Upgrade' | 'Other'
    raised_by = db.Column(db.String(200))
    raised_on = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    resolved_on = db.Column(db.DateTime)
    sla_breach = db.Column(db.Boolean, default=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    source = db.Column(db.String(50), default='manual')  # 'manual' | 'imported' | 'api_sync'
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    # Relationships
    account = db.relationship('Account', back_populates='tickets')
    installed_product = db.relationship('InstalledProduct', back_populates='tickets')
    assigned_user = db.relationship('User', back_populates='tickets_assigned')

    def to_dict(self):
        return {
            'ticket_id': self.ticket_id,
            'account_id': self.account_id,
            'install_id': self.install_id,
            'ticket_ref': self.ticket_ref,
            'title': self.title,
            'description': self.description,
            'priority': self.priority,
            'status': self.status,
            'category': self.category,
            'raised_by': self.raised_by,
            'raised_on': self.raised_on.isoformat() if self.raised_on else None,
            'resolved_on': self.resolved_on.isoformat() if self.resolved_on else None,
            'sla_breach': self.sla_breach,
            'assigned_to': self.assigned_to,
            'source': self.source,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<Ticket {self.ticket_id}: {self.title[:30]} ({self.status})>'
