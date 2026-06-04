"""AgentRun model — logs all AI agent endpoint calls."""
from datetime import datetime
from app.extensions import db


class AgentRun(db.Model):
    __tablename__ = 'agent_runs'

    run_id = db.Column(db.Integer, primary_key=True)
    run_type = db.Column(db.String(100), nullable=False)
    # 'market_analysis' | 'existing_proposal' | 'prospect_analysis' | 'prospect_proposal'
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.account_id'), nullable=True)
    initiated_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    status = db.Column(db.String(30), default='pending')
    # 'pending' | 'running' | 'completed' | 'failed'
    input_payload = db.Column(db.Text)   # JSON
    output_payload = db.Column(db.Text)  # JSON
    error_message = db.Column(db.Text)
    started_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    duration_ms = db.Column(db.Integer)

    # Relationships
    account = db.relationship('Account', back_populates='agent_runs')
    initiated_by_user = db.relationship('User', back_populates='agent_runs')

    def to_dict(self):
        import json
        return {
            'run_id': self.run_id,
            'run_type': self.run_type,
            'account_id': self.account_id,
            'initiated_by': self.initiated_by,
            'status': self.status,
            'input_payload': json.loads(self.input_payload) if self.input_payload else None,
            'output_payload': json.loads(self.output_payload) if self.output_payload else None,
            'error_message': self.error_message,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'duration_ms': self.duration_ms,
        }

    def __repr__(self):
        return f'<AgentRun {self.run_id}: {self.run_type} ({self.status})>'
