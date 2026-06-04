"""Renewal bucketing, semver, and release matching tests."""
import pytest
from datetime import date, timedelta
from app.extensions import db
from app.models.account import Account
from app.models.installed_product import InstalledProduct
from app.models.renewal import Renewal
from app.models.release import SoftwareRelease
from app.services.renewal_service import get_renewals_for_zone
from app.services.release_matching_service import compute_matches
from app.utils.version import semver_lt
from tests.conftest import get_token



# ─── Semver Tests ─────────────────────────────────────────────────────────────

def test_semver_lt_basic():
    assert semver_lt('4.1', '5.0') is True
    assert semver_lt('5.0', '4.1') is False
    assert semver_lt('4.1', '4.1') is False


def test_semver_lt_patch():
    assert semver_lt('4.2.0', '4.2.1') is True
    assert semver_lt('4.2.1', '4.2.0') is False


def test_semver_lt_mixed_length():
    assert semver_lt('4', '4.2') is True
    assert semver_lt('4.2', '5') is True
    assert semver_lt('5.0.0', '5.0') is False


def test_semver_lt_with_suffix():
    assert semver_lt('4.1.0-beta', '5.0') is True
    assert semver_lt('5.0.0-rc1', '4.9') is False


# ─── Renewal Bucket Tests ─────────────────────────────────────────────────────

def test_renewal_buckets(app, db, client):
    token = get_token(client)
    resp = client.get('/api/renewals',
                      headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['success'] is True
    assert isinstance(data['data'], list)



def test_renewal_bucket_30_filter(app, db):
    """Renewals expiring in >30d should NOT appear in 30-day bucket."""
    acc_id = app.config['TEST_ACC_WEST_ID']
    prod_id = app.config['TEST_PROD_ID']
    admin_id = app.config['TEST_ADMIN_ID']

    ip = InstalledProduct(account_id=acc_id, product_id=prod_id,
                          quantity=1, added_by=admin_id)
    db.session.add(ip)
    db.session.commit()

    # Renewal due in 20 days -> should appear in 30d bucket
    r1 = Renewal(account_id=acc_id, install_id=ip.install_id,
                 renewal_type='License', expiry_date=date.today() + timedelta(days=20))
    # Renewal due in 45 days -> should NOT appear in 30d bucket
    r2 = Renewal(account_id=acc_id, install_id=ip.install_id,
                 renewal_type='AMC', expiry_date=date.today() + timedelta(days=45))
    db.session.add_all([r1, r2])
    db.session.commit()

    zone_id = app.config['TEST_ZONE_WEST_ID']
    results = get_renewals_for_zone(zone_id=zone_id, bucket='30')
    cutoff = date.today() + timedelta(days=30)
    for r in results:
        ed = date.fromisoformat(r['expiry_date'])
        assert ed <= cutoff, f"Expiry {ed} exceeds 30-day cutoff {cutoff}"


def test_renewal_no_bucket_returns_all(app, db):
    """No bucket filter returns all renewals for zone."""
    zone_id = app.config['TEST_ZONE_WEST_ID']
    results_all = get_renewals_for_zone(zone_id=zone_id)
    assert isinstance(results_all, list)


# ─── Release Matching Tests ────────────────────────────────────────────────────

def test_release_matching_by_product_name(app, db):
    acc_id = app.config['TEST_ACC_WEST_ID']
    prod_id = app.config['TEST_PROD_ID']
    admin_id = app.config['TEST_ADMIN_ID']

    ip = InstalledProduct(account_id=acc_id, product_id=prod_id,
                          quantity=1, installed_version='4.1',
                          license_type='Annual', added_by=admin_id)
    db.session.add(ip)

    rel = SoftwareRelease(
        product_name='COSEC ACS', domain='Access Control',
        new_version='6.0', release_date=date.today(),
        release_title='COSEC ACS v6.0 Test',
        match_criteria='{"product_name":"COSEC ACS","older_than_version":"6.0"}',
        is_active=True, added_by=admin_id,
    )
    db.session.add(rel)
    db.session.commit()

    zone_id = app.config['TEST_ZONE_WEST_ID']
    matches = compute_matches(rel.release_id, zone_id=zone_id)
    assert len(matches) >= 1
    all_reasons = ' '.join(m['match_reason'] for m in matches)
    assert 'COSEC ACS' in all_reasons


def test_no_match_for_nonexistent_product(app, db):
    admin_id = app.config['TEST_ADMIN_ID']
    rel = SoftwareRelease(
        product_name='NONEXISTENT XYZ 9999', domain='Telecom',
        new_version='99.0', release_date=date.today(),
        release_title='No Match Release',
        match_criteria='{"product_name":"NONEXISTENT XYZ 9999"}',
        is_active=True, added_by=admin_id,
    )
    db.session.add(rel)
    db.session.commit()
    matches = compute_matches(rel.release_id)
    assert len(matches) == 0


def test_recompute_does_not_duplicate_matches(app, db):
    """Running compute_matches twice should not create duplicate records."""
    acc_id = app.config['TEST_ACC_WEST_ID']
    prod_id = app.config['TEST_PROD_ID']
    admin_id = app.config['TEST_ADMIN_ID']

    ip = InstalledProduct(account_id=acc_id, product_id=prod_id,
                          quantity=1, installed_version='3.0',
                          license_type='Annual', added_by=admin_id)
    db.session.add(ip)

    rel = SoftwareRelease(
        product_name='COSEC ACS', domain='Access Control',
        new_version='5.0', release_date=date.today(),
        release_title='Recompute Test Release',
        match_criteria='{"product_name":"COSEC ACS","older_than_version":"5.0"}',
        is_active=True, added_by=admin_id,
    )
    db.session.add(rel)
    db.session.commit()

    zone_id = app.config['TEST_ZONE_WEST_ID']
    first = compute_matches(rel.release_id, zone_id=zone_id)
    second = compute_matches(rel.release_id, zone_id=zone_id)
    assert len(first) == len(second)
