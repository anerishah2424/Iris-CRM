"""Admin — Zones blueprint."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.zone import Zone
from app.models.user import User
from app.models.account import Account
from app.middleware.scope import get_current_user
from app.utils.responses import success_response, error_response

admin_zones_bp = Blueprint('admin_zones', __name__)


def _manager_only(current_user):
    if not current_user or current_user.role != 'matrix_manager':
        return error_response('FORBIDDEN', 'Admin access required', 403)
    return None


@admin_zones_bp.route('', methods=['GET'])
@jwt_required()
def list_zones():
    current_user = get_current_user()
    err = _manager_only(current_user)
    if err:
        return err
    zones = Zone.query.order_by(Zone.zone_name).all()
    result = []
    for z in zones:
        d = z.to_dict()
        d['sm_count'] = User.query.filter_by(zone_id=z.zone_id, role='Sales_manager').count()
        d['accounts_count'] = Account.query.filter_by(zone_id=z.zone_id, is_deleted=False).count()
        result.append(d)
    return success_response(result)


@admin_zones_bp.route('', methods=['POST'])
@jwt_required()
def create_zone():
    current_user = get_current_user()
    err = _manager_only(current_user)
    if err:
        return err
    data = request.get_json(silent=True) or {}
    if not data.get('zone_name'):
        return error_response('VALIDATION_ERROR', 'zone_name is required', 400)
    zone = Zone(zone_name=data['zone_name'], sales_office=data.get('sales_office'))
    states_data = data.get('states', [])
    zone.states = ",".join(states_data) if isinstance(states_data, list) else str(states_data)
    db.session.add(zone)
    db.session.commit()
    return success_response(zone.to_dict(), message='Zone created', status_code=201)


@admin_zones_bp.route('/<int:zone_id>', methods=['PATCH'])
@jwt_required()
def update_zone(zone_id):
    current_user = get_current_user()
    err = _manager_only(current_user)
    if err:
        return err
    zone = Zone.query.get(zone_id)
    if not zone:
        return error_response('NOT_FOUND', 'Zone not found', 404)
    data = request.get_json(silent=True) or {}
    if 'zone_name' in data:
        zone.zone_name = data['zone_name']
    if 'states' in data:
        states_data = data['states']
        zone.states = ",".join(states_data) if isinstance(states_data, list) else str(states_data)
    if 'sales_office' in data:
        zone.sales_office = data['sales_office']
    db.session.commit()
    return success_response(zone.to_dict(), message='Zone updated')


@admin_zones_bp.route('/<int:zone_id>', methods=['DELETE'])
@jwt_required()
def delete_zone(zone_id):
    current_user = get_current_user()
    err = _manager_only(current_user)
    if err:
        return err
    zone = Zone.query.get(zone_id)
    if not zone:
        return error_response('NOT_FOUND', 'Zone not found', 404)
    user_count = User.query.filter_by(zone_id=zone_id).count()
    account_count = Account.query.filter_by(zone_id=zone_id, is_deleted=False).count()
    if user_count > 0 or account_count > 0:
        return error_response(
            'CONFLICT',
            f'Zone has {user_count} users and {account_count} accounts. Reassign before deleting.',
            409
        )
    db.session.delete(zone)
    db.session.commit()
    return success_response(None, message='Zone deleted')
