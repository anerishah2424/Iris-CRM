"""
Health score service.

Algorithm (out of 100):
  Start at 100 and subtract:

  TICKET PENALTY  (open + in-progress tickets)
    1 ticket  → -10
    2 tickets → -20
    3 tickets → -30
    4+ tickets → -40  (cap)

  LICENSE EXPIRY PENALTY  (per installed product that has a license_expiry)
    Already expired        → -40
    Expires within 30 days → -25
    Expires 31-90 days     → -15
    Expires 91-180 days    →  -5
    > 180 days             →   0
    (cap total license penalty at -45 so one bad renewal doesn't crush score)

  STATUS
    score >= 75  → Healthy
    score >= 45  → At-Risk
    score <  45  → Critical
    (override: any expired license  → Critical)
    (override: any expiring < 30 d  → At-Risk minimum)
"""
import json
import logging
from datetime import date, timedelta
from typing import Optional, List, Dict, Any

from app.extensions import db
from app.models.account import Account
from app.models.installed_product import InstalledProduct
from app.models.ticket import Ticket
from app.models.health_score import HealthScoreLog

logger = logging.getLogger(__name__)

OPEN_TICKET_STATES = ('Open', 'In Progress')

# Ticket penalty table (capped)
TICKET_PENALTY_TABLE = {1: 10, 2: 20, 3: 30}
TICKET_PENALTY_CAP = 40

# License expiry penalty windows (days_to_expiry -> deduction_points)
LICENSE_WINDOWS = [
    (0,   40, 'Expired license'),
    (30,  25, 'Expires within 30 days'),
    (90,  15, 'Expires within 90 days'),
    (180,  5, 'Expires within 180 days'),
]
LICENSE_PENALTY_CAP = 45


def calculate_health_breakdown(account_id: int) -> Dict[str, Any]:
    """
    Compute health score without persisting. Returns a breakdown dict.
    """
    today = date.today()
    account = Account.query.get(account_id)
    if not account:
        raise ValueError(f'Account {account_id} not found')

    installed_products = InstalledProduct.query.filter_by(account_id=account_id).all()
    open_tickets = Ticket.query.filter(
        Ticket.account_id == account_id,
        Ticket.status.in_(OPEN_TICKET_STATES)
    ).all()

    deductions = []
    total_deduction = 0

    # ── 1. Ticket Penalty ──────────────────────────────────────────────────
    open_count = len(open_tickets)
    ticket_penalty = TICKET_PENALTY_TABLE.get(open_count, TICKET_PENALTY_CAP if open_count > 3 else 0)
    if open_count > 0:
        deductions.append({
            'reason': f'{open_count} open/in-progress ticket{"s" if open_count != 1 else ""}',
            'points': -ticket_penalty,
        })
        total_deduction += ticket_penalty

    # ── 2. License Expiry Penalty ──────────────────────────────────────────
    license_total = 0
    any_expired = False
    any_expiring_soon = False

    for ip in installed_products:
        if ip.license_expiry is None:
            continue
        # Skip perpetual/no-license products
        if ip.license_type in ('Perpetual', 'None', None):
            # But still check if seeded with explicit expiry (treat as Annual)
            if ip.license_type is None and ip.license_expiry is None:
                continue

        days = (ip.license_expiry - today).days
        pname = ip.product_name or (ip.product.product_name if ip.product else f'#{ip.product_id}')

        if days < 0:
            pts = 40
            reason = f'Expired: {pname} (expired {abs(days)} days ago)'
            any_expired = True
        elif days <= 30:
            pts = 25
            reason = f'Expiring in {days}d: {pname}'
            any_expiring_soon = True
        elif days <= 90:
            pts = 15
            reason = f'Expiring in {days}d: {pname}'
        elif days <= 180:
            pts = 5
            reason = f'Expiring in {days}d: {pname}'
        else:
            continue

        if license_total + pts > LICENSE_PENALTY_CAP:
            pts = max(0, LICENSE_PENALTY_CAP - license_total)
            if pts == 0:
                break

        deductions.append({'reason': reason, 'points': -pts})
        license_total += pts

    total_deduction += license_total

    # ── 3. Final score & status ────────────────────────────────────────────
    final_score = max(0, 100 - total_deduction)

    if any_expired or final_score < 45:
        status = 'Critical'
    elif any_expiring_soon or final_score < 75:
        status = 'At-Risk'
    else:
        status = 'Healthy'

    return {
        'account_id': account_id,
        'account_name': account.account_name,
        'health_score': final_score,
        'health_status': status,
        'breakdown': {
            'base_score': 100,
            'total_deduction': total_deduction,
            'deductions': deductions,
            'ticket_count': open_count,
            'license_expiry_deduction': license_total,
        },
        'installed_products': [ip.to_dict(include_product=True) for ip in installed_products],
        'open_tickets': [t.to_dict() for t in open_tickets],
        'recalculated_at': today.isoformat(),
    }


def recalculate_account_health(account_id: int, triggered_by: str = 'manual') -> dict:
    """Recalculate, persist to DB, and audit-log the change."""
    account = Account.query.get(account_id)
    if not account:
        raise ValueError(f'Account {account_id} not found')

    score_before = account.health_score
    status_before = account.health_status

    breakdown = calculate_health_breakdown(account_id)
    new_score = breakdown['health_score']
    new_status = breakdown['health_status']

    account.health_score = new_score
    account.health_status = new_status

    log = HealthScoreLog(
        account_id=account_id,
        score_before=score_before,
        score_after=new_score,
        status_before=status_before,
        status_after=new_status,
        triggered_by=triggered_by,
        breakdown=json.dumps(breakdown['breakdown']),
    )
    db.session.add(log)
    db.session.commit()

    logger.info(f'Health recalculated for account {account_id}: '
                f'{score_before} -> {new_score} ({new_status})')
    return breakdown


def recalculate_all(zone_id: Optional[int] = None) -> List[dict]:
    """Batch recalculate health scores for all (or zone-filtered) accounts."""
    query = Account.query.filter_by(is_deleted=False)
    if zone_id is not None:
        query = query.filter_by(zone_id=zone_id)
    accounts = query.all()
    results = []
    for account in accounts:
        try:
            result = recalculate_account_health(account.account_id, triggered_by='batch')
            results.append({
                'account_id': account.account_id,
                'account_name': account.account_name,
                'health_score': result['health_score'],
                'health_status': result['health_status'],
                'success': True,
            })
        except Exception as e:
            logger.error(f'Failed to recalculate health for account {account.account_id}: {e}')
            results.append({
                'account_id': account.account_id,
                'success': False,
                'error': str(e),
            })
    return results
