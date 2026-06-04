"""Health score algorithm tests."""
import pytest
from datetime import date, timedelta
from app.extensions import db
from app.models.account import Account
from app.models.installed_product import InstalledProduct
from app.models.ticket import Ticket
from app.services.health_service import calculate_health_breakdown, recalculate_account_health


def make_account(db, app, name='Test Account'):
    zone_id = app.config['TEST_ZONE_WEST_ID']
    admin_id = app.config['TEST_ADMIN_ID']
    acc = Account(account_name=name, industry='IT', city='Test', state='Gujarat',
                  zone_id=zone_id, created_by=admin_id)
    db.session.add(acc)
    db.session.commit()
    return acc


def make_installed_product(db, app, acc_id, **kwargs):
    prod_id = app.config['TEST_PROD_ID']
    admin_id = app.config['TEST_ADMIN_ID']
    ip = InstalledProduct(account_id=acc_id, product_id=prod_id,
                          quantity=1, added_by=admin_id, **kwargs)
    db.session.add(ip)
    db.session.commit()
    return ip


def make_ticket(db, acc_id, status='Open', priority='Medium'):
    t = Ticket(account_id=acc_id, title='Test issue', status=status,
               priority=priority, source='manual')
    db.session.add(t)
    db.session.commit()
    return t


def test_healthy_account(app, db):
    acc = make_account(db, app, 'Perfect Score Account')
    acc.last_visit_date = date.today() - timedelta(days=30)
    db.session.commit()
    result = calculate_health_breakdown(acc.account_id)
    assert result['health_score'] == 100
    assert result['health_status'] == 'Healthy'


def test_no_visit_deduction(app, db):
    acc = make_account(db, app, 'No Visit Account')
    # No visit -> -15 deduction
    result = calculate_health_breakdown(acc.account_id)
    assert result['health_score'] == 85
    assert any('visit' in d['reason'].lower() for d in result['breakdown']['deductions'])


def test_open_tickets_deduction(app, db):
    acc = make_account(db, app, 'Tickets Account')
    acc.last_visit_date = date.today() - timedelta(days=10)
    db.session.commit()
    make_ticket(db, acc.account_id, 'Open')
    make_ticket(db, acc.account_id, 'In Progress')
    result = calculate_health_breakdown(acc.account_id)
    assert result['health_score'] == 84  # 100 - 2*8


def test_four_plus_tickets_critical(app, db):
    acc = make_account(db, app, 'Critical Tickets Account')
    acc.last_visit_date = date.today() - timedelta(days=10)
    db.session.commit()
    for _ in range(4):
        make_ticket(db, acc.account_id, 'Open')
    result = calculate_health_breakdown(acc.account_id)
    assert result['health_score'] == 56  # 100 - (3*8 + 20)
    assert result['health_status'] == 'Critical'


def test_expired_license_deduction(app, db):
    acc = make_account(db, app, 'Expired License Account')
    acc.last_visit_date = date.today() - timedelta(days=10)
    db.session.commit()
    make_installed_product(db, app, acc.account_id,
                           license_expiry=date.today() - timedelta(days=5),
                           license_type='Annual', license_status='Expired')
    result = calculate_health_breakdown(acc.account_id)
    assert result['health_score'] == 55  # 100 - 45
    assert result['health_status'] == 'Critical'


def test_discontinued_license_exclusion(app, db):
    """Discontinued + expired >30d -> excluded from health calc."""
    acc = make_account(db, app, 'Discontinued License Account')
    acc.last_visit_date = date.today() - timedelta(days=10)
    db.session.commit()
    make_installed_product(db, app, acc.account_id,
                           license_expiry=date.today() - timedelta(days=60),
                           license_type='Annual', license_status='Discontinued')
    result = calculate_health_breakdown(acc.account_id)
    assert len(result['breakdown']['exclusions']) == 1
    assert result['health_score'] == 100  # excluded -> no deduction


def test_no_visit_deduction_old_visit(app, db):
    acc = make_account(db, app, 'Old Visit Account')
    acc.last_visit_date = date.today() - timedelta(days=200)
    db.session.commit()
    result = calculate_health_breakdown(acc.account_id)
    assert result['health_score'] == 85  # -15 for old visit


def test_hardware_age_deduction(app, db):
    acc = make_account(db, app, 'Old Hardware Account')
    acc.last_visit_date = date.today() - timedelta(days=10)
    db.session.commit()
    make_installed_product(db, app, acc.account_id,
                           hardware_age_years=5.5,
                           license_type=None)
    result = calculate_health_breakdown(acc.account_id)
    assert result['health_score'] == 90  # 100 - 10


def test_recalculate_persists_to_db(app, db):
    acc = make_account(db, app, 'Persist Test Account')
    recalculate_account_health(acc.account_id, triggered_by='test')
    updated = Account.query.get(acc.account_id)
    assert updated.health_score is not None
    assert updated.health_status in ('Healthy', 'At-Risk', 'Critical')
