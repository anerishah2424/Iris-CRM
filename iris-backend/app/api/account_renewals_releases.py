"""Account-level renewals and release-matches sub-blueprints (nested under /accounts)."""
from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.models.account import Account
from app.models.renewal import Renewal
from app.models.release_match import ReleaseMatch
from app.middleware.scope import get_current_user, scoped_accounts_query
from app.utils.responses import success_response, error_response

account_renewals_bp = Blueprint('account_renewals', __name__)
account_releases_bp = Blueprint('account_release_matches', __name__)


# ─── Account Renewals ──────────────────────────────────────────────────────────

@account_renewals_bp.route('/<int:account_id>/renewals', methods=['GET'])
@jwt_required()
def get_account_renewals(account_id):
    """List all renewals for a specific account."""
    current_user = get_current_user()
    account = scoped_accounts_query(
        Account.query.filter_by(is_deleted=False, account_id=account_id), current_user
    ).first()
    if not account:
        return error_response('NOT_FOUND', 'Account not found', 404)
    renewals = (Renewal.query
                .filter_by(account_id=account_id)
                .order_by(Renewal.expiry_date)
                .all())
    return success_response([r.to_dict(include_relations=True) for r in renewals])


# ─── Account Release Matches ───────────────────────────────────────────────────

@account_releases_bp.route('/<int:account_id>/release-matches', methods=['GET'])
@jwt_required()
def get_account_release_matches(account_id):
    """List all release matches for a specific account."""
    current_user = get_current_user()
    account = scoped_accounts_query(
        Account.query.filter_by(is_deleted=False, account_id=account_id), current_user
    ).first()
    if not account:
        return error_response('NOT_FOUND', 'Account not found', 404)
    matches = (ReleaseMatch.query
               .filter_by(account_id=account_id)
               .order_by(ReleaseMatch.match_score.desc())
               .all())
    return success_response([m.to_dict(include_relations=True) for m in matches])
