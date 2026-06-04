"""Tickets blueprint."""
from datetime import datetime
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.ticket import Ticket
from app.models.account import Account
from app.middleware.scope import get_current_user, scoped_tickets_query
from app.utils.responses import success_response, error_response, paginated_response
from app.utils.pagination import get_pagination_params, paginate_query
from app.services import health_service

tickets_bp = Blueprint('tickets', __name__)


@tickets_bp.route('', methods=['GET'])
@jwt_required()
def list_tickets():
    current_user = get_current_user()
    page, per_page = get_pagination_params()
    query = scoped_tickets_query(Ticket.query, current_user)

    if account_id := request.args.get('account_id'):
        query = query.filter(Ticket.account_id == int(account_id))
    if status := request.args.get('status'):
        query = query.filter(Ticket.status == status)
    if priority := request.args.get('priority'):
        query = query.filter(Ticket.priority == priority)
    if category := request.args.get('category'):
        query = query.filter(Ticket.category == category)
    if search := request.args.get('search', '').strip():
        query = query.filter(Ticket.title.ilike(f'%{search}%'))

    query = query.order_by(Ticket.created_at.desc())
    items, total = paginate_query(query, page, per_page)
    return paginated_response([t.to_dict() for t in items], page, per_page, total)


@tickets_bp.route('', methods=['POST'])
@jwt_required()
def create_ticket():
    current_user = get_current_user()
    data = request.get_json(silent=True) or {}
    if not data.get('account_id'):
        return error_response('VALIDATION_ERROR', 'account_id is required', 400)
    if not data.get('title'):
        return error_response('VALIDATION_ERROR', 'title is required', 400)

    # Scope check
    account = Account.query.filter_by(account_id=data['account_id'], is_deleted=False).first()
    if not account:
        return error_response('NOT_FOUND', 'Account not found', 404)
    if current_user.role == 'Sales_manager' and account.zone_id != current_user.zone_id:
        return error_response('FORBIDDEN', 'Account is outside your zone', 403)

    ticket = Ticket(
        account_id=data['account_id'],
        install_id=data.get('install_id'),
        ticket_ref=data.get('ticket_ref'),
        title=data['title'],
        description=data.get('description'),
        priority=data.get('priority', 'Medium'),
        category=data.get('category', 'Other'),
        raised_by=data.get('raised_by'),
        assigned_to=data.get('assigned_to'),
        source=data.get('source', 'manual'),
    )
    db.session.add(ticket)
    db.session.commit()
    health_service.recalculate_account_health(data['account_id'], triggered_by='ticket_update')
    return success_response(ticket.to_dict(), message='Ticket created', status_code=201)


@tickets_bp.route('/<int:ticket_id>', methods=['PATCH'])
@jwt_required()
def update_ticket(ticket_id):
    current_user = get_current_user()
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return error_response('NOT_FOUND', 'Ticket not found', 404)

    # Scope check
    account = Account.query.get(ticket.account_id)
    if current_user.role == 'Sales_manager' and account and account.zone_id != current_user.zone_id:
        return error_response('FORBIDDEN', 'Access denied', 403)

    data = request.get_json(silent=True) or {}
    old_status = ticket.status
    for field in ('title', 'description', 'priority', 'status', 'category',
                  'assigned_to', 'sla_breach', 'raised_by'):
        if field in data:
            setattr(ticket, field, data[field])

    if 'resolved_on' in data and data['resolved_on']:
        ticket.resolved_on = datetime.fromisoformat(data['resolved_on'])
    if ticket.status in ('Resolved', 'Closed') and not ticket.resolved_on:
        ticket.resolved_on = datetime.utcnow()

    db.session.commit()
    # Trigger health recalculation on status change
    if ticket.status != old_status:
        health_service.recalculate_account_health(ticket.account_id, triggered_by='ticket_update')
    return success_response(ticket.to_dict(), message='Ticket updated')


@tickets_bp.route('/sync', methods=['POST'])
@jwt_required()
def sync_tickets():
    """Import tickets from an external source (mock)."""
    data = request.get_json(silent=True) or {}
    source = data.get('source', 'api')
    records = data.get('data', [])
    created = updated = skipped = 0
    for rec in records:
        if not rec.get('ticket_ref') or not rec.get('title') or not rec.get('account_id'):
            skipped += 1
            continue
        existing = Ticket.query.filter_by(ticket_ref=rec['ticket_ref']).first()
        if existing:
            existing.title = rec.get('title', existing.title)
            existing.status = rec.get('status', existing.status)
            existing.priority = rec.get('priority', existing.priority)
            existing.source = source
            updated += 1
        else:
            t = Ticket(
                account_id=rec['account_id'],
                ticket_ref=rec['ticket_ref'],
                title=rec['title'],
                status=rec.get('status', 'Open'),
                priority=rec.get('priority', 'Medium'),
                source=source,
            )
            db.session.add(t)
            created += 1
    db.session.commit()
    return success_response({'created': created, 'updated': updated, 'skipped': skipped})
