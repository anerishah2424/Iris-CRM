"""HealthScoreLog model — audit trail of health score changes."""
from datetime import datetime
from app.extensions import db


class HealthScoreLog(db.Model):
    __tablename__ = 'health_score_log'

    log_id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.account_id', ondelete='CASCADE'),
                           nullable=False)
    score_before = db.Column(db.Integer)
    score_after = db.Column(db.Integer)
    status_before = db.Column(db.String(20))
    status_after = db.Column(db.String(20))
    recalculated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    triggered_by = db.Column(db.String(100))
    # 'cron' | 'manual' | 'ticket_update' | 'license_update'
    breakdown = db.Column(db.Text)  # JSON deduction details

    # Relationships
    account = db.relationship('Account', back_populates='health_logs')

    def to_dict(self):
        import json
        return {
            'log_id': self.log_id,
            'account_id': self.account_id,
            'score_before': self.score_before,
            'score_after': self.score_after,
            'status_before': self.status_before,
            'status_after': self.status_after,
            'recalculated_at': self.recalculated_at.isoformat() if self.recalculated_at else None,
            'triggered_by': self.triggered_by,
            'breakdown': json.loads(self.breakdown) if self.breakdown else None,
        }

    def __repr__(self):
        return f'<HealthScoreLog {self.log_id}: account={self.account_id} {self.score_before}->{self.score_after}>'
