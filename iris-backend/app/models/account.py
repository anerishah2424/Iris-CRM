"""Account (client) model."""
from datetime import datetime
from app.extensions import db


class Account(db.Model):
    __tablename__ = 'accounts'

    account_id = db.Column(db.Integer, primary_key=True)
    account_name = db.Column(db.String(300), nullable=False)
    industry = db.Column(db.String(150), nullable=False)
    sub_industry = db.Column(db.String(150))
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    zone_id = db.Column(db.Integer, db.ForeignKey('zones.zone_id'), nullable=True)
    si_id = db.Column(db.Integer, db.ForeignKey('si_partners.si_id'), nullable=True)
    si_name = db.Column(db.String(200))
    vad_company = db.Column(db.String(200))
    sales_manager_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    sales_manager = db.Column(db.String(200))
    address = db.Column(db.Text)
    pincode = db.Column(db.String(10))
    gstin = db.Column(db.String(20))
    pan = db.Column(db.String(15))
    website = db.Column(db.String(255))
    contact_name = db.Column(db.String(200))
    contact_phone = db.Column(db.String(20))
    contact_email = db.Column(db.String(255))
    account_type = db.Column(db.String(50), default='existing')  # 'existing' | 'prospect'
    health_score = db.Column(db.Integer, db.CheckConstraint(
        'health_score BETWEEN 0 AND 100'))
    health_status = db.Column(db.String(20), default='Healthy')  # 'Healthy' | 'At-Risk' | 'Critical'
    last_visit_date = db.Column(db.Date)
    notes = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    created_on = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                           onupdate=datetime.utcnow)
    is_deleted = db.Column(db.Boolean, nullable=False, default=False)

    # Relationships
    zone = db.relationship('Zone', back_populates='accounts')
    si_partner = db.relationship('SIPartner', back_populates='accounts')
    sales_manager_rel = db.relationship('User', back_populates='accounts_managed',
                                    foreign_keys=[sales_manager_id])
    created_by_user = db.relationship('User', back_populates='accounts_created',
                                      foreign_keys=[created_by])
    installed_products = db.relationship('InstalledProduct', back_populates='account',
                                         cascade='all, delete-orphan', lazy='dynamic')
    tickets = db.relationship('Ticket', back_populates='account',
                              cascade='all, delete-orphan', lazy='dynamic')
    health_logs = db.relationship('HealthScoreLog', back_populates='account',
                                  cascade='all, delete-orphan', lazy='dynamic')
    renewals = db.relationship('Renewal', back_populates='account', lazy='dynamic')
    release_matches = db.relationship('ReleaseMatch', back_populates='account', lazy='dynamic')
    agent_runs = db.relationship('AgentRun', back_populates='account', lazy='dynamic')
    visit_logs = db.relationship('VisitLog', back_populates='account',
                                 cascade='all, delete-orphan', lazy='dynamic')

    def to_dict(self, include_relations=False):
        data = {
            'account_id': self.account_id,
            'account_name': self.account_name,
            'industry': self.industry,
            'sub_industry': self.sub_industry,
            'city': self.city,
            'state': self.state,
            'zone_id': self.zone_id,
            'si_id': self.si_id,
            'si_name': self.si_name,
            'vad_company': self.vad_company,
            'sales_manager_id': self.sales_manager_id,
            'sales_manager': self.sales_manager,
            'address': self.address,
            'pincode': self.pincode,
            'gstin': self.gstin,
            'pan': self.pan,
            'website': self.website,
            'contact_name': self.contact_name,
            'contact_phone': self.contact_phone,
            'contact_email': self.contact_email,
            'account_type': self.account_type,
            'health_score': self.health_score,
            'health_status': self.health_status,
            'last_visit_date': self.last_visit_date.isoformat() if self.last_visit_date else None,
            'notes': self.notes,
            'created_by': self.created_by,
            'created_on': self.created_on.isoformat() if self.created_on else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_deleted': self.is_deleted,
        }
        if include_relations:
            if self.zone:
                data['zone'] = self.zone.to_dict()
                data['zone_name'] = self.zone.zone_name
            if self.si_partner:
                data['si_partner'] = self.si_partner.to_dict()
            if self.sales_manager_rel:
                data['sales_manager_user'] = {
                    'user_id': self.sales_manager_rel.user_id,
                    'full_name': self.sales_manager_rel.full_name,
                    'email': self.sales_manager_rel.email,
                }
        return data

    def __repr__(self):
        return f'<Account {self.account_id}: {self.account_name}>'
