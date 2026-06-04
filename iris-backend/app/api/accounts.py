"""Accounts endpoints."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.account import Account
from app.models.zone import Zone
from app.models.ticket import Ticket
from app.middleware.scope import get_current_user, scoped_accounts_query
from app.utils.responses import success_response, error_response, paginated_response
from app.utils.pagination import get_pagination_params, paginate_query
from app.services import health_service, renewal_service

accounts_bp = Blueprint('accounts', __name__)


def _derive_zone_from_state(state: str):
    zones = Zone.query.all()
    for zone in zones:
        if state in zone.states:
            return zone.zone_id
    return None


@accounts_bp.route('', methods=['GET'])
@jwt_required()
def list_accounts():
    current_user = get_current_user()
    page, per_page = get_pagination_params()
    query = scoped_accounts_query(Account.query.filter_by(is_deleted=False), current_user)

    if search := request.args.get('search', '').strip():
        query = query.filter(Account.account_name.ilike(f'%{search}%'))
    if industry := request.args.get('industry'):
        query = query.filter(Account.industry == industry)
    if health_status := request.args.get('health_status'):
        if ',' in health_status:
            statuses = [s.strip() for s in health_status.split(',')]
            query = query.filter(Account.health_status.in_(statuses))
        else:
            query = query.filter(Account.health_status == health_status)
    if zone_id := request.args.get('zone_id'):
        query = query.filter(Account.zone_id == int(zone_id))
    if state := request.args.get('state'):
        query = query.filter(Account.state == state)
    if account_type := request.args.get('account_type'):
        query = query.filter(Account.account_type == account_type)

    sort_by = request.args.get('sort_by', 'account_name')
    order = request.args.get('order', 'asc')
    col = getattr(Account, sort_by, Account.account_name)
    query = query.order_by(col.desc() if order == 'desc' else col.asc())

    items, total = paginate_query(query, page, per_page)
    data = []
    for a in items:
        d = a.to_dict()
        d['open_ticket_count'] = a.tickets.filter(
            Ticket.status.in_(('Open', 'In Progress'))).count()
        data.append(d)
    return paginated_response(data, page, per_page, total)


@accounts_bp.route('', methods=['POST'])
@jwt_required()
def create_account():
    current_user = get_current_user()
    data = request.get_json(silent=True) or {}
    for f in ('account_name', 'industry', 'city', 'state'):
        if not data.get(f):
            return error_response('VALIDATION_ERROR', f'{f} is required', 400)

    zone_id = data.get('zone_id') or _derive_zone_from_state(data['state'])
    account = Account(
        account_name=data['account_name'],
        industry=data['industry'],
        sub_industry=data.get('sub_industry'),
        city=data['city'],
        state=data['state'],
        zone_id=zone_id,
        si_id=data.get('si_id'),
        sales_manager_id=data.get('sales_manager_id'),
        address=data.get('address'),
        pincode=data.get('pincode'),
        gstin=data.get('gstin'),
        pan=data.get('pan'),
        website=data.get('website'),
        contact_name=data.get('contact_name'),
        contact_phone=data.get('contact_phone'),
        contact_email=data.get('contact_email'),
        account_type=data.get('account_type', 'existing'),
        notes=data.get('notes'),
        created_by=current_user.user_id,
    )
    db.session.add(account)
    db.session.commit()
    return success_response(account.to_dict(include_relations=True),
                            message='Account created', status_code=201)


@accounts_bp.route('/<int:account_id>', methods=['GET'])
@jwt_required()
def get_account(account_id):
    current_user = get_current_user()
    account = scoped_accounts_query(
        Account.query.filter_by(is_deleted=False, account_id=account_id), current_user
    ).first()
    if not account:
        return error_response('NOT_FOUND', 'Account not found', 404)
    data = account.to_dict(include_relations=True)
    data['installed_products_count'] = account.installed_products.count()
    data['open_tickets_count'] = account.tickets.filter(
        Ticket.status.in_(('Open', 'In Progress'))).count()
    return success_response(data)


@accounts_bp.route('/<int:account_id>', methods=['PATCH'])
@jwt_required()
def update_account(account_id):
    current_user = get_current_user()
    account = scoped_accounts_query(
        Account.query.filter_by(is_deleted=False, account_id=account_id), current_user
    ).first()
    if not account:
        return error_response('NOT_FOUND', 'Account not found', 404)
    data = request.get_json(silent=True) or {}
    for field in ('account_name', 'industry', 'sub_industry', 'city', 'state', 'si_id',
                  'sales_manager_id', 'address', 'pincode', 'gstin', 'pan', 'website',
                  'contact_name', 'contact_phone', 'contact_email', 'account_type', 'notes'):
        if field in data:
            setattr(account, field, data[field])
    if 'state' in data:
        account.zone_id = _derive_zone_from_state(data['state']) or account.zone_id
    db.session.commit()
    return success_response(account.to_dict(include_relations=True), message='Account updated')


@accounts_bp.route('/<int:account_id>', methods=['DELETE'])
@jwt_required()
def delete_account(account_id):
    current_user = get_current_user()
    if current_user.role != 'matrix_manager':
        return error_response('FORBIDDEN', 'Only matrix managers can delete accounts', 403)
    account = Account.query.filter_by(account_id=account_id, is_deleted=False).first()
    if not account:
        return error_response('NOT_FOUND', 'Account not found', 404)
    account.is_deleted = True
    db.session.commit()
    return success_response(None, message='Account soft-deleted')
