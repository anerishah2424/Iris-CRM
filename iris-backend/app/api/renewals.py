"""Renewals blueprint."""
from datetime import datetime
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.renewal import Renewal
from app.models.account import Account
from app.middleware.scope import get_current_user, scoped_renewals_query
from app.utils.responses import success_response, error_response, paginated_response
from app.utils.pagination import get_pagination_params, paginate_query
from app.services.renewal_service import get_renewals_for_zone

renewals_bp = Blueprint('renewals', __name__)


@renewals_bp.route('', methods=['GET'])
@jwt_required()
def list_renewals():
    current_user = get_current_user()
    page, per_page = get_pagination_params()
    bucket = request.args.get('bucket')
    zone_id = current_user.zone_id if current_user.role == 'Sales_manager' else None

    if request.args.get('account_id'):
        account_id = int(request.args.get('account_id'))
        query = scoped_renewals_query(
            Renewal.query.filter_by(account_id=account_id), current_user
        )
        items, total = paginate_query(query.order_by(Renewal.expiry_date), page, per_page)
        data = [r.to_dict(include_relations=True) for r in items]
    else:
        all_items = get_renewals_for_zone(zone_id=zone_id, bucket=bucket)
        total = len(all_items)
        start = (page - 1) * per_page
        data = all_items[start:start + per_page]

    return paginated_response(data, page, per_page, total)


@renewals_bp.route('/<int:renewal_id>', methods=['PATCH'])
@jwt_required()
def update_renewal(renewal_id):
    current_user = get_current_user()
    renewal = Renewal.query.get(renewal_id)
    if not renewal:
        return error_response('NOT_FOUND', 'Renewal not found', 404)
    # Scope check
    account = Account.query.get(renewal.account_id)
    if current_user.role == 'Sales_manager' and account and account.zone_id != current_user.zone_id:
        return error_response('FORBIDDEN', 'Access denied', 403)

    data = request.get_json(silent=True) or {}
    for field in ('renewal_status', 'reminder_status', 'notes'):
        if field in data:
            setattr(renewal, field, data[field])
    db.session.commit()
    return success_response(renewal.to_dict(include_relations=True), message='Renewal updated')


@renewals_bp.route('/<int:renewal_id>/remind', methods=['POST'])
@jwt_required()
def remind_renewal(renewal_id):
    current_user = get_current_user()
    renewal = Renewal.query.get(renewal_id)
    if not renewal:
        return error_response('NOT_FOUND', 'Renewal not found', 404)
    account = Account.query.get(renewal.account_id)
    if current_user.role == 'Sales_manager' and account and account.zone_id != current_user.zone_id:
        return error_response('FORBIDDEN', 'Access denied', 403)

    renewal.reminder_sent_at = datetime.utcnow()
    renewal.reminder_sent_by = current_user.user_id
    renewal.renewal_status = 'Due Soon'
    renewal.reminder_status = 'Reminded'
    db.session.commit()
    return success_response(renewal.to_dict(include_relations=True),
                            message='Reminder logged')
