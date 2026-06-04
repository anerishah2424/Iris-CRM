"""Dashboard endpoints."""
from datetime import date, timedelta
from flask import Blueprint
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from app.extensions import db
from app.models.account import Account
from app.models.ticket import Ticket
from app.models.renewal import Renewal
from app.models.release_match import ReleaseMatch
from app.middleware.scope import get_current_user, scoped_accounts_query
from app.utils.responses import success_response

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('', methods=['GET'])
@dashboard_bp.route('/summary', methods=['GET'])
@jwt_required()
def summary():
    current_user = get_current_user()
    today = date.today()

    # Base account query scoped to zone
    base_q = scoped_accounts_query(
        Account.query.filter_by(is_deleted=False), current_user
    )
    accounts = base_q.all()
    account_ids = [a.account_id for a in accounts]

    total_accounts = len(accounts)
    healthy = sum(1 for a in accounts if a.health_status == 'Healthy')
    at_risk = sum(1 for a in accounts if a.health_status == 'At-Risk')
    critical = sum(1 for a in accounts if a.health_status == 'Critical')
    avg_score = (
        sum(a.health_score or 0 for a in accounts) / total_accounts
        if total_accounts else 0
    )

    # Tickets
    open_tickets = 0
    critical_tickets = 0
    if account_ids:
        open_tickets = Ticket.query.filter(
            Ticket.account_id.in_(account_ids),
            Ticket.status.in_(('Open', 'In Progress'))
        ).count()
        critical_tickets = Ticket.query.filter(
            Ticket.account_id.in_(account_ids),
            Ticket.status.in_(('Open', 'In Progress')),
            Ticket.priority == 'Critical'
        ).count()

    # Renewals
    r30 = r60 = r90 = 0
    if account_ids:
        for days in [30, 60, 90]:
            cutoff = today + timedelta(days=days)
            count = Renewal.query.filter(
                Renewal.account_id.in_(account_ids),
                Renewal.expiry_date >= today,
                Renewal.expiry_date <= cutoff,
            ).count()
            if days == 30:
                r30 = count
            elif days == 60:
                r60 = count
            else:
                r90 = count

    # Pending release matches
    releases_pending = 0
    if account_ids:
        releases_pending = ReleaseMatch.query.filter(
            ReleaseMatch.account_id.in_(account_ids),
            ReleaseMatch.reminder_status == 'Pending',
        ).count()

    return success_response({
        'total_accounts': total_accounts,
        'healthy_accounts': healthy,
        'at_risk_accounts': at_risk,
        'critical_accounts': critical,
        'open_tickets': open_tickets,
        'critical_tickets': critical_tickets,
        'renewals_due_30_days': r30,
        'renewals_due_60_days': r60,
        'renewals_due_90_days': r90,
        'avg_health_score': round(avg_score, 1),
        'releases_pending_review': releases_pending,
    })


@dashboard_bp.route('/opportunities', methods=['GET'])
@jwt_required()
def opportunities():
    current_user = get_current_user()
    today = date.today()
    base_q = scoped_accounts_query(
        Account.query.filter_by(is_deleted=False), current_user
    )
    accounts = base_q.all()
    account_ids = [a.account_id for a in accounts]
    account_map = {a.account_id: a for a in accounts}

    items = []

    # Health critical accounts are already shown in the Accounts table on the dashboard
    # to avoid redundancy, we only show event-driven alerts here

    # Renewals due soon
    if account_ids:
        renewals = Renewal.query.filter(
            Renewal.account_id.in_(account_ids),
            Renewal.expiry_date >= today,
            Renewal.expiry_date <= today + timedelta(days=90),
        ).order_by(Renewal.expiry_date).all()
        for r in renewals:
            days = (r.expiry_date - today).days
            priority = 'HIGH' if days <= 30 else ('MEDIUM' if days <= 60 else 'LOW')
            account = account_map.get(r.account_id)
            items.append({
                'type': 'renewal_alert',
                'account_id': r.account_id,
                'account_name': account.account_name if account else '',
                'message': f'{r.renewal_type} renewal due in {days} days',
                'priority': priority,
                'due_date': r.expiry_date.isoformat(),
            })

    # Release matches pending
    if account_ids:
        matches = ReleaseMatch.query.filter(
            ReleaseMatch.account_id.in_(account_ids),
            ReleaseMatch.reminder_status == 'Pending',
        ).limit(20).all()
        for m in matches:
            account = account_map.get(m.account_id)
            items.append({
                'type': 'release_match',
                'account_id': m.account_id,
                'account_name': account.account_name if account else '',
                'message': f'New release match: {m.match_reason[:60]}',
                'priority': 'MEDIUM',
                'due_date': None,
            })

    # No-visit accounts
    threshold = today - timedelta(days=180)
    for a in accounts:
        if a.last_visit_date is None or a.last_visit_date < threshold:
            items.append({
                'type': 'no_visit',
                'account_id': a.account_id,
                'account_name': a.account_name,
                'message': f'No visit in over 6 months',
                'priority': 'LOW',
                'due_date': None,
            })

    # Sort: HIGH first, then by due_date
    priority_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
    items.sort(key=lambda x: (priority_order.get(x['priority'], 3), x['due_date'] or '9999'))
    return success_response(items[:10])


@dashboard_bp.route('/activity', methods=['GET'])
@jwt_required()
def activity():
    from app.models.visit_log import VisitLog
    current_user = get_current_user()

    # Get recent visits scoped to zone
    visit_query = db.session.query(VisitLog).join(Account).filter(Account.is_deleted == False)
    if current_user.role == 'Sales_manager' and current_user.zone_id:
        visit_query = visit_query.filter(Account.zone_id == current_user.zone_id)

    recent_visits = visit_query.order_by(VisitLog.visit_date.desc()).limit(10).all()

    # Get recent ticket updates
    ticket_query = db.session.query(Ticket).join(Account).filter(Account.is_deleted == False)
    if current_user.role == 'Sales_manager' and current_user.zone_id:
        ticket_query = ticket_query.filter(Account.zone_id == current_user.zone_id)

    recent_tickets = ticket_query.order_by(Ticket.updated_at.desc()).limit(10).all()

    combined = []
    for v in recent_visits:
        combined.append({
            'type': 'visit',
            'id': v.visit_id,
            'account_id': v.account_id,
            'account_name': v.account.account_name,
            'title': f'{v.visit_type} logged',
            'subtitle': v.notes[:60] + '...' if v.notes and len(v.notes) > 60 else v.notes,
            'date': v.visit_date.isoformat(),
            'timestamp': v.created_at.isoformat()
        })

    for t in recent_tickets:
        combined.append({
            'type': 'ticket',
            'id': t.ticket_id,
            'account_id': t.account_id,
            'account_name': t.account.account_name,
            'title': f'Ticket #{t.ticket_id} updated',
            'subtitle': f'Status: {t.status} | {t.title}',
            'date': t.updated_at.date().isoformat(),
            'timestamp': t.updated_at.isoformat()
        })

    combined.sort(key=lambda x: x['timestamp'], reverse=True)
    return success_response(combined[:10])
