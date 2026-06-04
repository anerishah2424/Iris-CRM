"""Account-level tickets sub-blueprint."""
from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.models.ticket import Ticket
from app.models.account import Account
from app.middleware.scope import get_current_user, scoped_accounts_query
from app.utils.responses import success_response, error_response

account_tickets_bp = Blueprint('account_tickets', __name__)


@account_tickets_bp.route('/<int:account_id>/tickets', methods=['GET'])
@jwt_required()
def get_account_tickets(account_id):
    current_user = get_current_user()
    account = scoped_accounts_query(
        Account.query.filter_by(is_deleted=False, account_id=account_id), current_user
    ).first()
    if not account:
        return error_response('NOT_FOUND', 'Account not found', 404)
    tickets = (Ticket.query.filter_by(account_id=account_id)
               .order_by(Ticket.created_at.desc()).all())
    return success_response([t.to_dict() for t in tickets])
