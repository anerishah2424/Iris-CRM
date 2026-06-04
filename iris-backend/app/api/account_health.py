"""Health score endpoint for individual accounts (nested under accounts blueprint)."""
from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.models.account import Account
from app.models.health_score import HealthScoreLog
from app.middleware.scope import get_current_user, scoped_accounts_query
from app.utils.responses import success_response, error_response
from app.services import health_service

account_health_bp = Blueprint('account_health', __name__)


@account_health_bp.route('/<int:account_id>/health', methods=['GET'])
@jwt_required()
def get_account_health(account_id):
    current_user = get_current_user()
    account = scoped_accounts_query(
        Account.query.filter_by(is_deleted=False, account_id=account_id), current_user
    ).first()
    if not account:
        return error_response('NOT_FOUND', 'Account not found', 404)
    try:
        breakdown = health_service.calculate_health_breakdown(account_id)
        return success_response(breakdown)
    except ValueError as e:
        return error_response('NOT_FOUND', str(e), 404)


@account_health_bp.route('/<int:account_id>/health/history', methods=['GET'])
@jwt_required()
def get_account_health_history(account_id):
    """Return the last 30 health score log entries for the account."""
    current_user = get_current_user()
    account = scoped_accounts_query(
        Account.query.filter_by(is_deleted=False, account_id=account_id), current_user
    ).first()
    if not account:
        return error_response('NOT_FOUND', 'Account not found', 404)
    logs = (HealthScoreLog.query
            .filter_by(account_id=account_id)
            .order_by(HealthScoreLog.recalculated_at.asc())
            .limit(30)
            .all())
    # Map to a simpler shape for the chart
    history = [{
        'log_id': l.log_id,
        'health_score': l.score_after,
        'health_status': l.status_after,
        'calculated_at': l.recalculated_at.isoformat() if l.recalculated_at else None,
        'triggered_by': l.triggered_by,
    } for l in logs]
    return success_response(history)


@account_health_bp.route('/<int:account_id>/health/recalculate', methods=['POST'])
@jwt_required()
def recalculate_account_health(account_id):
    """Recalculate and persist health score for a single account."""
    current_user = get_current_user()
    account = scoped_accounts_query(
        Account.query.filter_by(is_deleted=False, account_id=account_id), current_user
    ).first()
    if not account:
        return error_response('NOT_FOUND', 'Account not found', 404)
    try:
        result = health_service.recalculate_account_health(account_id, triggered_by='manual')
        return success_response(result, message='Health score recalculated')
    except Exception as e:
        return error_response('INTERNAL_ERROR', str(e), 500)

