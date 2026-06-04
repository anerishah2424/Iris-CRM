"""Health score endpoints."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.models.account import Account
from app.middleware.scope import get_current_user, scoped_accounts_query
from app.utils.responses import success_response, error_response
from app.services import health_service

health_bp = Blueprint('health', __name__)


@health_bp.route('/recalculate', methods=['POST'])
@jwt_required()
def recalculate():
    current_user = get_current_user()
    data = request.get_json(silent=True) or {}
    account_ids = data.get('account_ids', [])

    if account_ids:
        results = []
        for aid in account_ids:
            account = Account.query.get(aid)
            if not account:
                continue
            if (current_user.role == 'Sales_manager'
                    and account.zone_id != current_user.zone_id):
                continue
            try:
                r = health_service.recalculate_account_health(aid, triggered_by='manual')
                results.append({'account_id': aid, 'success': True,
                                'health_score': r['health_score'],
                                'health_status': r['health_status']})
            except Exception as e:
                results.append({'account_id': aid, 'success': False, 'error': str(e)})
    else:
        zone_id = current_user.zone_id if current_user.role == 'Sales_manager' else None
        results = health_service.recalculate_all(zone_id=zone_id)

    return success_response({'updated': len(results), 'summary': results})
