"""Visit logs sub-blueprint (nested under /accounts/<id>/visits)."""
from datetime import date
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.visit_log import VisitLog
from app.models.account import Account
from app.middleware.scope import get_current_user, scoped_accounts_query
from app.utils.responses import success_response, error_response
from app.services import health_service

visits_bp = Blueprint('visits', __name__)


def _get_scoped_account(account_id, current_user):
    return scoped_accounts_query(
        Account.query.filter_by(is_deleted=False, account_id=account_id), current_user
    ).first()


@visits_bp.route('/<int:account_id>/visits', methods=['GET'])
@jwt_required()
def list_visits(account_id):
    current_user = get_current_user()
    if not _get_scoped_account(account_id, current_user):
        return error_response('NOT_FOUND', 'Account not found', 404)
    visits = (VisitLog.query.filter_by(account_id=account_id)
              .order_by(VisitLog.visit_date.desc()).all())
    return success_response([v.to_dict() for v in visits])


@visits_bp.route('/<int:account_id>/visits', methods=['POST'])
@jwt_required()
def create_visit(account_id):
    current_user = get_current_user()
    account = _get_scoped_account(account_id, current_user)
    if not account:
        return error_response('NOT_FOUND', 'Account not found', 404)
    data = request.get_json(silent=True) or {}
    if not data.get('visit_date'):
        return error_response('VALIDATION_ERROR', 'visit_date is required', 400)

    visit_date = date.fromisoformat(data['visit_date'])
    visit = VisitLog(
        account_id=account_id,
        visited_by=current_user.user_id,
        visit_type=data.get('visit_type', 'SM Visit'),
        visit_date=visit_date,
        notes=data.get('notes'),
        next_visit_date=date.fromisoformat(data['next_visit_date']) if data.get('next_visit_date') else None,
    )
    db.session.add(visit)

    # Update last_visit_date on account
    if account.last_visit_date is None or visit_date > account.last_visit_date:
        account.last_visit_date = visit_date

    db.session.commit()
    health_service.recalculate_account_health(account_id, triggered_by='manual')
    return success_response(visit.to_dict(), message='Visit logged', status_code=201)
