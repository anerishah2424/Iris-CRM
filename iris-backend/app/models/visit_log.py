"""VisitLog model."""
from datetime import datetime
from app.extensions import db


class VisitLog(db.Model):
    __tablename__ = 'visit_logs'

    visit_id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.account_id'), nullable=False)
    visited_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    visit_type = db.Column(db.String(50))
    # 'SM Visit' | 'SI Visit' | 'Demo' | 'Support' | 'Review'
    visit_date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text)
    next_visit_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    account = db.relationship('Account', back_populates='visit_logs')
    visited_by_user = db.relationship('User', back_populates='visit_logs')

    def to_dict(self):
        return {
            'visit_id': self.visit_id,
            'account_id': self.account_id,
            'visited_by': self.visited_by,
            'visit_type': self.visit_type,
            'visit_date': self.visit_date.isoformat() if self.visit_date else None,
            'notes': self.notes,
            'next_visit_date': self.next_visit_date.isoformat() if self.next_visit_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<VisitLog {self.visit_id}: account={self.account_id} date={self.visit_date}>'
