"""Tests for auth endpoints."""
import pytest
from tests.conftest import get_token


def test_login_success(client, app):
    resp = client.post('/api/auth/login',
                       json={'username': 'admin_test', 'password': 'Test@1234'})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['success'] is True
    assert 'access_token' in data['data']
    assert 'refresh_token' in data['data']


def test_login_wrong_password(client, app):
    resp = client.post('/api/auth/login',
                       json={'username': 'admin_test', 'password': 'wrong'})
    assert resp.status_code == 401
    assert resp.get_json()['success'] is False


def test_login_missing_fields(client, app):
    resp = client.post('/api/auth/login', json={'username': 'admin_test'})
    assert resp.status_code == 400


def test_me_endpoint(client, app):
    token = get_token(client)
    resp = client.get('/api/auth/me',
                      headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 200
    data = resp.get_json()['data']
    assert data['user']['username'] == 'admin_test'


def test_me_no_token(client, app):
    resp = client.get('/api/auth/me')
    assert resp.status_code == 401


def test_refresh_token(client, app):
    login = client.post('/api/auth/login',
                        json={'username': 'admin_test', 'password': 'Test@1234'})
    refresh_token = login.get_json()['data']['refresh_token']
    resp = client.post('/api/auth/refresh',
                       headers={'Authorization': f'Bearer {refresh_token}'})
    assert resp.status_code == 200
    assert 'access_token' in resp.get_json()['data']


def test_logout(client, app):
    token = get_token(client)
    resp = client.post('/api/auth/logout',
                       headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code == 200
    # Revoked token should now fail
    resp2 = client.get('/api/auth/me',
                       headers={'Authorization': f'Bearer {token}'})
    assert resp2.status_code == 401

