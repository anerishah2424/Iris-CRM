"""Tests for accounts and zone scoping."""
import pytest
from app.extensions import db
from app.models.account import Account
from app.models.zone import Zone
from tests.conftest import get_token


def test_admin_sees_all_accounts(client, app):
    token = get_token(client)
    resp = client.get('/api/accounts',
                      headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['meta']['total'] >= 2


def test_sm_scoped_to_own_zone(client, app):
    # SM West login
    token_west = get_token(client, 'sm_west_test')
    token_north = get_token(client, 'sm_north_test')

    west_id = app.config['TEST_ACC_WEST_ID']
    south_id = app.config['TEST_ACC_SOUTH_ID']

    # SM West can see West account
    resp = client.get(f'/api/accounts/{west_id}',
                      headers={'Authorization': f'Bearer {token_west}'})
    assert resp.status_code == 200

    # SM West cannot see South account (different zone)
    resp = client.get(f'/api/accounts/{south_id}',
                      headers={'Authorization': f'Bearer {token_west}'})
    assert resp.status_code == 404


def test_create_account(client, app):
    token = get_token(client)
    resp = client.post('/api/accounts',
                       json={'account_name': 'Test Corp Gujarat',
                             'industry': 'Manufacturing',
                             'city': 'Test City',
                             'state': 'Gujarat'},
                       headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 201
    data = resp.get_json()['data']
    assert data['account_name'] == 'Test Corp Gujarat'


def test_create_account_missing_field(client):
    token = get_token(client)
    resp = client.post('/api/accounts',
                       json={'account_name': 'Incomplete'},
                       headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 400


def test_soft_delete_account(client, app):
    # Create throwaway account
    token = get_token(client)
    create_resp = client.post('/api/accounts',
                              json={'account_name': 'Delete Me Corp',
                                    'industry': 'Retail',
                                    'city': 'Pune',
                                    'state': 'Maharashtra'},
                              headers={'Authorization': f'Bearer {token}'})
    assert create_resp.status_code == 201
    acc_id = create_resp.get_json()['data']['account_id']

    # Only matrix_manager can delete
    resp = client.delete(f'/api/accounts/{acc_id}',
                         headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 200

    # Verify soft-deleted (GET returns 404)
    get_resp = client.get(f'/api/accounts/{acc_id}',
                          headers={'Authorization': f'Bearer {token}'})
    assert get_resp.status_code == 404
