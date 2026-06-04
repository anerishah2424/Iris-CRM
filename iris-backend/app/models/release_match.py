"""ReleaseMatch model."""
from datetime import datetime
from app.extensions import db


class ReleaseMatch(db.Model):
    __tablename__ = 'release_matches'

    match_id = db.Column(db.Integer, primary_key=True)
    release_id = db.Column(db.Integer, db.ForeignKey('software_releases.release_id',
                                                      ondelete='CASCADE'), nullable=False)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.account_id'), nullable=False)
    install_id = db.Column(db.Integer, db.ForeignKey('installed_products.install_id'),
                           nullable=True)
    match_reason = db.Column(db.Text, nullable=False)
    match_score = db.Column(db.Integer, default=0)
    reminder_status = db.Column(db.String(30), default='Pending')
    # 'Pending' | 'Reminded' | 'Closed'
    reminded_at = db.Column(db.DateTime)
    reminded_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('release_id', 'account_id', 'install_id', name='uq_release_account_install'),
    )

    # Relationships
    release = db.relationship('SoftwareRelease', back_populates='release_matches')
    account = db.relationship('Account', back_populates='release_matches')
    installed_product = db.relationship('InstalledProduct', back_populates='release_matches')
    reminded_by_user = db.relationship('User', foreign_keys=[reminded_by])

    def to_dict(self, include_relations=False):
        data = {
            'match_id': self.match_id,
            'release_id': self.release_id,
            'account_id': self.account_id,
            'install_id': self.install_id,
            'match_reason': self.match_reason,
            'match_score': self.match_score,
            'reminder_status': self.reminder_status,
            'reminded_at': self.reminded_at.isoformat() if self.reminded_at else None,
            'reminded_by': self.reminded_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_relations:
            if self.account:
                data['account_name'] = self.account.account_name
            if self.installed_product:
                data['installed_version'] = self.installed_product.installed_version
                if self.installed_product.product:
                    data['product_name'] = self.installed_product.product.product_name
        return data

    def __repr__(self):
        return f'<ReleaseMatch {self.match_id}: release={self.release_id} account={self.account_id}>'
