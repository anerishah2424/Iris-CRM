"""SoftwareRelease model."""
import json
from datetime import datetime
from app.extensions import db


class SoftwareRelease(db.Model):
    __tablename__ = 'software_releases'

    release_id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product_catalog.product_id'), nullable=True)
    product_name = db.Column(db.String(300), nullable=False)
    domain = db.Column(db.String(100))
    category = db.Column(db.String(150))
    new_version = db.Column(db.String(50), nullable=False)
    release_date = db.Column(db.Date, nullable=False)
    release_title = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text)
    _highlights = db.Column('highlights', db.Text)  # JSON array
    match_criteria = db.Column(db.Text, nullable=False)  # JSON
    is_active = db.Column(db.Boolean, default=True)
    added_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    # Relationships
    product = db.relationship('Product', back_populates='releases')
    added_by_user = db.relationship('User', foreign_keys=[added_by])
    release_matches = db.relationship('ReleaseMatch', back_populates='release',
                                      cascade='all, delete-orphan', lazy='dynamic')

    @property
    def highlights(self):
        try:
            return json.loads(self._highlights or '[]')
        except (ValueError, TypeError):
            return []

    @highlights.setter
    def highlights(self, value):
        self._highlights = json.dumps(value if isinstance(value, list) else [])

    def get_match_criteria(self):
        try:
            return json.loads(self.match_criteria or '{}')
        except (ValueError, TypeError):
            return {}

    def to_dict(self, include_match_count=False):
        data = {
            'release_id': self.release_id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'domain': self.domain,
            'category': self.category,
            'new_version': self.new_version,
            'release_date': self.release_date.isoformat() if self.release_date else None,
            'release_title': self.release_title,
            'description': self.description,
            'highlights': self.highlights,
            'match_criteria': self.get_match_criteria(),
            'is_active': self.is_active,
            'added_by': self.added_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_match_count:
            data['matched_accounts_count'] = self.release_matches.count()
        return data

    def __repr__(self):
        return f'<SoftwareRelease {self.release_id}: {self.product_name} v{self.new_version}>'
