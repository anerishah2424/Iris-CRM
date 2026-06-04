"""Auth endpoints."""
from datetime import datetime
from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from app.extensions import db, bcrypt, token_blocklist
from app.models.user import User
from app.models.zone import Zone
from app.utils.responses import success_response, error_response
from app.middleware.scope import get_current_user

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')
    if not username or not password:
        return error_response('VALIDATION_ERROR', 'username and password are required', 400)

    user = User.query.filter(
        (User.username == username) | (User.email == username)
    ).first()

    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return error_response('INVALID_CREDENTIALS', 'Invalid username or password', 401)
    if not user.is_active:
        return error_response('ACCOUNT_DISABLED', 'Account is disabled', 403)

    additional_claims = {
        'role': user.role,
        'zone_id': user.zone_id,
        'email': user.email,
    }
    access_token = create_access_token(identity=str(user.user_id),
                                       additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=str(user.user_id),
                                         additional_claims=additional_claims)

    user.last_login = datetime.utcnow()
    db.session.commit()

    zone_data = None
    if user.zone:
        zone_data = user.zone.to_dict()

    return success_response({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer',
        'user': user.to_dict(),
        'zone': zone_data,
    }, message='Login successful')


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    claims = get_jwt()
    additional_claims = {
        'role': claims.get('role'),
        'zone_id': claims.get('zone_id'),
        'email': claims.get('email'),
    }
    access_token = create_access_token(identity=identity,
                                       additional_claims=additional_claims)
    return success_response({'access_token': access_token}, message='Token refreshed')


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user = get_current_user()
    if not user:
        return error_response('NOT_FOUND', 'User not found', 404)
    zone_data = user.zone.to_dict() if user.zone else None
    return success_response({
        'user': user.to_dict(),
        'zone': zone_data,
        'states': [s.strip() for s in user.zone.states.split(',')] if user.zone and user.zone.states else [],
    })


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    jti = get_jwt().get('jti')
    if jti:
        token_blocklist.add(jti)
    return success_response(None, message='Logged out successfully')
