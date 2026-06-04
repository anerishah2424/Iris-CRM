"""ProductKnowledgeBase model."""
import json
from datetime import datetime
from app.extensions import db


class ProductKnowledgeBase(db.Model):
    __tablename__ = 'product_knowledge_base'

    kb_id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product_catalog.product_id'), nullable=False)
    _trigger_keywords = db.Column('trigger_keywords', db.Text, nullable=False)  # JSON array
    _industry_fit = db.Column('industry_fit', db.Text)  # JSON array
    _use_cases = db.Column('use_cases', db.Text)  # JSON array
    _complementary_ids = db.Column('complementary_ids', db.Text)  # JSON array
    priority_weight = db.Column(db.Integer, default=5)  # 1-10
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    # Relationships
    product = db.relationship('Product', back_populates='knowledge_base')

    def _get_json_list(self, field):
        try:
            return json.loads(field or '[]')
        except (ValueError, TypeError):
            return []

    def _set_json_list(self, value):
        return json.dumps(value if isinstance(value, list) else [])

    @property
    def trigger_keywords(self):
        return self._get_json_list(self._trigger_keywords)

    @trigger_keywords.setter
    def trigger_keywords(self, value):
        self._trigger_keywords = self._set_json_list(value)

    @property
    def industry_fit(self):
        return self._get_json_list(self._industry_fit)

    @industry_fit.setter
    def industry_fit(self, value):
        self._industry_fit = self._set_json_list(value)

    @property
    def use_cases(self):
        return self._get_json_list(self._use_cases)

    @use_cases.setter
    def use_cases(self, value):
        self._use_cases = self._set_json_list(value)

    @property
    def complementary_ids(self):
        return self._get_json_list(self._complementary_ids)

    @complementary_ids.setter
    def complementary_ids(self, value):
        self._complementary_ids = self._set_json_list(value)

    def to_dict(self):
        return {
            'kb_id': self.kb_id,
            'product_id': self.product_id,
            'trigger_keywords': self.trigger_keywords,
            'industry_fit': self.industry_fit,
            'use_cases': self.use_cases,
            'complementary_ids': self.complementary_ids,
            'priority_weight': self.priority_weight,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f'<ProductKnowledgeBase {self.kb_id}: product={self.product_id}>'
