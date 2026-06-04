"""Renewal service."""
from datetime import date, timedelta
from typing import Optional, List
from app.models.renewal import Renewal
from app.models.account import Account
from app.extensions import db


def get_renewals_for_zone(zone_id: Optional[int] = None,
                          bucket: Optional[str] = None) -> List[dict]:
    """Return renewals optionally filtered by zone and bucket (30/60/90/expired)."""
    today = date.today()
    query = Renewal.query.join(Account, Renewal.account_id == Account.account_id)

    if zone_id is not None:
        query = query.filter(Account.zone_id == zone_id)

    query = query.filter(Account.is_deleted == False)

    renewals = query.all()
    results = []
    for renewal in renewals:
        if renewal.expiry_date is None:
            continue
        days_remaining = (renewal.expiry_date - today).days

        if bucket == 'expired' and days_remaining >= 0:
            continue
        elif bucket == '30' and not (0 <= days_remaining <= 30):
            continue
        elif bucket == '60' and not (0 <= days_remaining <= 60):
            continue
        elif bucket == '90' and not (0 <= days_remaining <= 90):
            continue

        item = renewal.to_dict(include_relations=True)
        item['days_remaining'] = days_remaining
        results.append(item)

    # Sort by expiry date ascending
    results.sort(key=lambda x: x['expiry_date'])
    return results


def get_expiring_soon(days: int = 30, zone_id: Optional[int] = None) -> List[dict]:
    """Return renewals expiring within `days` days."""
    today = date.today()
    cutoff = today + timedelta(days=days)
    query = (Renewal.query
             .join(Account, Renewal.account_id == Account.account_id)
             .filter(Renewal.expiry_date >= today)
             .filter(Renewal.expiry_date <= cutoff))
    if zone_id is not None:
        query = query.filter(Account.zone_id == zone_id)
    renewals = query.all()
    results = []
    for r in renewals:
        item = r.to_dict(include_relations=True)
        item['days_remaining'] = (r.expiry_date - today).days
        results.append(item)
    results.sort(key=lambda x: x['days_remaining'])
    return results


def sync_renewal_records_for_account(account_id: int) -> None:
    """Ensure renewal records exist for all active installed_products of an account."""
    from app.models.installed_product import InstalledProduct
    ips = InstalledProduct.query.filter_by(account_id=account_id).all()
    for ip in ips:
        # License renewal
        if ip.license_expiry and ip.license_type not in ('Perpetual', 'None', None):
            existing = Renewal.query.filter_by(
                account_id=account_id, install_id=ip.install_id, renewal_type='License'
            ).first()
            if not existing:
                r = Renewal(
                    account_id=account_id,
                    install_id=ip.install_id,
                    renewal_type='License',
                    expiry_date=ip.license_expiry,
                )
                db.session.add(r)
            else:
                existing.expiry_date = ip.license_expiry
        # AMC renewal
        if ip.amc_end_date:
            existing_amc = Renewal.query.filter_by(
                account_id=account_id, install_id=ip.install_id, renewal_type='AMC'
            ).first()
            if not existing_amc:
                r = Renewal(
                    account_id=account_id,
                    install_id=ip.install_id,
                    renewal_type='AMC',
                    expiry_date=ip.amc_end_date,
                )
                db.session.add(r)
            else:
                existing_amc.expiry_date = ip.amc_end_date
        # Warranty renewal
        if ip.warranty_expiry:
            existing_w = Renewal.query.filter_by(
                account_id=account_id, install_id=ip.install_id, renewal_type='Warranty'
            ).first()
            if not existing_w:
                r = Renewal(
                    account_id=account_id,
                    install_id=ip.install_id,
                    renewal_type='Warranty',
                    expiry_date=ip.warranty_expiry,
                )
                db.session.add(r)
            else:
                existing_w.expiry_date = ip.warranty_expiry
    db.session.commit()
