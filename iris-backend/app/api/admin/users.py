"""Admin — Users blueprint."""
import secrets
import string
from datetime import datetime
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.zone import Zone
from app.middleware.scope import get_current_user, require_role
from app.utils.responses import success_response, error_response, paginated_response
from app.utils.pagination import get_pagination_params, paginate_query

admin_users_bp = Blueprint('admin_users', __name__)


def _manager_only(current_user):
    if not current_user or current_user.role != 'matrix_manager':
        return error_response('FORBIDDEN', 'Admin access required', 403)
    return None


@admin_users_bp.route('', methods=['GET'])
@jwt_required()
def list_users():
    current_user = get_current_user()
    err = _manager_only(current_user)
    if err:
        return err
    page, per_page = get_pagination_params()
    query = User.query
    if role := request.args.get('role'):
        query = query.filter(User.role == role)
    if zone_id := request.args.get('zone_id'):
        query = query.filter(User.zone_id == int(zone_id))
    if is_active := request.args.get('is_active'):
        query = query.filter(User.is_active == (is_active.lower() == 'true'))
    if search := request.args.get('search', '').strip():
        query = query.filter(
            User.full_name.ilike(f'%{search}%') | User.email.ilike(f'%{search}%')
        )
    items, total = paginate_query(query.order_by(User.created_at.desc()), page, per_page)
    return paginated_response([u.to_dict(include_zone=True) for u in items], page, per_page, total)


@admin_users_bp.route('', methods=['POST'])
@jwt_required()
def create_user():
    current_user = get_current_user()
    err = _manager_only(current_user)
    if err:
        return err
    data = request.get_json(silent=True) or {}
    for f in ('full_name', 'email', 'username', 'password', 'role'):
        if not data.get(f):
            return error_response('VALIDATION_ERROR', f'{f} is required', 400)
    if User.query.filter_by(email=data['email']).first():
        return error_response('CONFLICT', 'Email already exists', 409)
    if User.query.filter_by(username=data['username']).first():
        return error_response('CONFLICT', 'Username already exists', 409)

    user = User(
        full_name=data['full_name'],
        email=data['email'],
        username=data['username'],
        password_hash=bcrypt.generate_password_hash(data['password']).decode('utf-8'),
        role=data['role'],
        zone_id=data.get('zone_id'),
        phone=data.get('phone'),
        designation=data.get('designation'),
    )
    db.session.add(user)
    db.session.commit()
    return success_response(user.to_dict(include_zone=True),
                            message='User created', status_code=201)


@admin_users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    current_user = get_current_user()
    err = _manager_only(current_user)
    if err:
        return err
    user = User.query.get(user_id)
    if not user:
        return error_response('NOT_FOUND', 'User not found', 404)
    return success_response(user.to_dict(include_zone=True))


@admin_users_bp.route('/<int:user_id>', methods=['PATCH'])
@jwt_required()
def update_user(user_id):
    current_user = get_current_user()
    err = _manager_only(current_user)
    if err:
        return err
    user = User.query.get(user_id)
    if not user:
        return error_response('NOT_FOUND', 'User not found', 404)
    data = request.get_json(silent=True) or {}
    # Cannot change own role
    if 'role' in data and user.user_id == current_user.user_id:
        return error_response('FORBIDDEN', 'Cannot change your own role', 403)
    for field in ('role', 'zone_id', 'is_active', 'designation', 'phone'):
        if field in data:
            setattr(user, field, data[field])
    if 'password' in data and data['password']:
        user.password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user.updated_at = datetime.utcnow()
    db.session.commit()
    return success_response(user.to_dict(include_zone=True), message='User updated')


@admin_users_bp.route('/<int:user_id>/reset-password', methods=['POST'])
@jwt_required()
def reset_password(user_id):
    current_user = get_current_user()
    err = _manager_only(current_user)
    if err:
        return err
    user = User.query.get(user_id)
    if not user:
        return error_response('NOT_FOUND', 'User not found', 404)
    alphabet = string.ascii_letters + string.digits + '!@#$'
    temp_pw = ''.join(secrets.choice(alphabet) for _ in range(12))
    user.password_hash = bcrypt.generate_password_hash(temp_pw).decode('utf-8')
    db.session.commit()
    return success_response({'temporary_password': temp_pw},
                            message='Password reset successfully')
