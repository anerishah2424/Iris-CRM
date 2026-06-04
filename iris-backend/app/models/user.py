"""User model."""
from datetime import datetime
from app.extensions import db


class User(db.Model):
    __tablename__ = 'users'

    user_id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    username = db.Column(db.String(100), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # 'matrix_manager' | 'Sales_manager'
    zone_id = db.Column(db.Integer, db.ForeignKey('zones.zone_id'), nullable=True)
    phone = db.Column(db.String(20))
    designation = db.Column(db.String(150))
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    last_login = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    # Relationships
    zone = db.relationship('Zone', back_populates='users', foreign_keys=[zone_id])
    accounts_managed = db.relationship('Account', back_populates='sales_manager_rel',
                                       foreign_keys='Account.sales_manager_id', lazy='dynamic')
    accounts_created = db.relationship('Account', back_populates='created_by_user',
                                       foreign_keys='Account.created_by', lazy='dynamic')
    notifications = db.relationship('Notification', back_populates='user', lazy='dynamic')
    tickets_assigned = db.relationship('Ticket', back_populates='assigned_user',
                                       lazy='dynamic')
    agent_runs = db.relationship('AgentRun', back_populates='initiated_by_user',
                                 lazy='dynamic')
    visit_logs = db.relationship('VisitLog', back_populates='visited_by_user',
                                 lazy='dynamic')

    def to_dict(self, include_zone=False):
        data = {
            'user_id': self.user_id,
            'full_name': self.full_name,
            'email': self.email,
            'username': self.username,
            'role': self.role,
            'zone_id': self.zone_id,
            'phone': self.phone,
            'designation': self.designation,
            'is_active': self.is_active,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_zone and self.zone:
            data['zone'] = self.zone.to_dict()
            data['zone_name'] = self.zone.zone_name
        return data

    def __repr__(self):
        return f'<User {self.user_id}: {self.username} ({self.role})>'
