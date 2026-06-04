"""Zone/region scope enforcement middleware."""
from functools import wraps
from flask_jwt_extended import get_jwt_identity, get_jwt
from flask import abort
from app.models.account import Account
from app.models.ticket import Ticket
from app.models.renewal import Renewal
from app.models.release_match import ReleaseMatch
from app.models.visit_log import VisitLog
from app.models.si_partner import SIPartner


def get_current_user():
    """Fetch the current User object from JWT identity."""
    from app.models.user import User
    user_id = int(get_jwt_identity())
    return User.query.get(user_id)


def scoped_accounts_query(query, current_user):
    """Apply zone scoping to a SQLAlchemy query on Account model."""
    if current_user is None:
        abort(401)
    if current_user.role == 'Sales_manager' and current_user.zone_id:
        return query.filter(Account.zone_id == current_user.zone_id)
    return query  # matrix_manager: unfiltered


def scoped_tickets_query(query, current_user):
    """Apply zone scoping via join to accounts."""
    if current_user is None:
        abort(401)
    if current_user.role == 'Sales_manager' and current_user.zone_id:
        return (query.join(Account, Ticket.account_id == Account.account_id)
                .filter(Account.zone_id == current_user.zone_id))
    return query


def scoped_renewals_query(query, current_user):
    """Apply zone scoping to renewals via accounts."""
    if current_user is None:
        abort(401)
    if current_user.role == 'Sales_manager' and current_user.zone_id:
        return (query.join(Account, Renewal.account_id == Account.account_id)
                .filter(Account.zone_id == current_user.zone_id))
    return query


def scoped_release_matches_query(query, current_user):
    """Apply zone scoping to release matches via accounts."""
    if current_user is None:
        abort(401)
    if current_user.role == 'Sales_manager' and current_user.zone_id:
        return (query.join(Account, ReleaseMatch.account_id == Account.account_id)
                .filter(Account.zone_id == current_user.zone_id))
    return query


def scoped_si_partners_query(query, current_user):
    """Apply zone scoping to SI partners."""
    if current_user is None:
        abort(401)
    if current_user.role == 'Sales_manager' and current_user.zone_id:
        return query.filter(SIPartner.zone_id == current_user.zone_id)
    return query


def require_role(*roles):
    """Decorator — requires user to have one of the given roles."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            current_user = get_current_user()
            if current_user is None or not current_user.is_active:
                abort(401)
            if current_user.role not in roles:
                abort(403)
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def require_account_scope(fn):
    """Decorator — ensures Sales_manager can only access accounts in their zone."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        from app.models.account import Account
        account_id = kwargs.get('account_id') or kwargs.get('id')
        if account_id:
            current_user = get_current_user()
            if current_user and current_user.role == 'Sales_manager':
                account = Account.query.get(account_id)
                if account and account.zone_id != current_user.zone_id:
                    abort(403)
        return fn(*args, **kwargs)
    return wrapper
