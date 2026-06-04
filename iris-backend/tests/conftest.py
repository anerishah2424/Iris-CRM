"""Pytest configuration and fixtures."""
import pytest
from app import create_app
from app.extensions import db as _db, bcrypt


@pytest.fixture(scope='session')
def app():
    """Create application for testing."""
    _app = create_app('testing')
    with _app.app_context():
        _db.create_all()
        _seed_minimal(_app)
        yield _app
        _db.drop_all()


@pytest.fixture(scope='session')
def db(app):
    return _db


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture(scope='session')
def admin_token(app):
    """Get admin JWT token."""
    client = app.test_client()
    resp = client.post('/api/auth/login',
                       json={'username': 'admin_test', 'password': 'Test@1234'})
    return resp.get_json()['data']['access_token']


@pytest.fixture(scope='session')
def sm_west_token(app):
    client = app.test_client()
    resp = client.post('/api/auth/login',
                       json={'username': 'sm_west_test', 'password': 'Test@1234'})
    return resp.get_json()['data']['access_token']


@pytest.fixture(scope='session')
def sm_north_token(app):
    client = app.test_client()
    resp = client.post('/api/auth/login',
                       json={'username': 'sm_north_test', 'password': 'Test@1234'})
    return resp.get_json()['data']['access_token']


def _seed_minimal(_app):
    """Seed minimal data needed for all tests."""
    from app.models.zone import Zone
    from app.models.user import User
    from app.models.account import Account
    from app.models.product import Product

    pw = bcrypt.generate_password_hash('Test@1234').decode('utf-8')

    z_west = Zone(zone_name='West', states=['Gujarat', 'Maharashtra'], sales_office='Ahmedabad')
    z_north = Zone(zone_name='North', states=['Delhi', 'Haryana'], sales_office='Delhi')
    z_south = Zone(zone_name='South', states=['Karnataka', 'Tamil Nadu'], sales_office='Bengaluru')
    _db.session.add_all([z_west, z_north, z_south])
    _db.session.flush()

    admin = User(full_name='Admin', email='admin@test.com', username='admin_test',
                 password_hash=pw, role='matrix_manager')
    sm_west = User(full_name='SM West', email='sm.west@test.com', username='sm_west_test',
                   password_hash=pw, role='Sales_manager', zone_id=z_west.zone_id)
    sm_north = User(full_name='SM North', email='sm.north@test.com', username='sm_north_test',
                    password_hash=pw, role='Sales_manager', zone_id=z_north.zone_id)
    sm_south = User(full_name='SM South', email='sm.south@test.com', username='sm_south_test',
                    password_hash=pw, role='Sales_manager', zone_id=z_south.zone_id)
    _db.session.add_all([admin, sm_west, sm_north, sm_south])
    _db.session.flush()

    acc_west = Account(account_name='West Pharma Ltd', industry='Pharma',
                       city='Ahmedabad', state='Gujarat', zone_id=z_west.zone_id,
                       account_type='existing', created_by=admin.user_id)
    acc_south = Account(account_name='South IT Corp', industry='IT',
                        city='Bengaluru', state='Karnataka', zone_id=z_south.zone_id,
                        account_type='existing', created_by=admin.user_id)
    _db.session.add_all([acc_west, acc_south])
    _db.session.flush()

    prod = Product(product_name='COSEC ACS', domain='Access Control',
                   category='Access Control', license_type='Annual',
                   expected_lifespan_years=5, status='Active', unit_price=35000)
    _db.session.add(prod)
    _db.session.commit()

    # Store IDs in app config for test access
    _app.config['TEST_ZONE_WEST_ID'] = z_west.zone_id
    _app.config['TEST_ZONE_NORTH_ID'] = z_north.zone_id
    _app.config['TEST_ZONE_SOUTH_ID'] = z_south.zone_id
    _app.config['TEST_ADMIN_ID'] = admin.user_id
    _app.config['TEST_SM_WEST_ID'] = sm_west.user_id
    _app.config['TEST_SM_NORTH_ID'] = sm_north.user_id
    _app.config['TEST_ACC_WEST_ID'] = acc_west.account_id
    _app.config['TEST_ACC_SOUTH_ID'] = acc_south.account_id
    _app.config['TEST_PROD_ID'] = prod.product_id


def get_token(client, username='admin_test', password='Test@1234'):
    """Helper to get JWT access token."""
    resp = client.post('/api/auth/login',
                       json={'username': username, 'password': password})
    return resp.get_json()['data']['access_token']


def auth_headers(token):
    return {'Authorization': f'Bearer {token}'}
