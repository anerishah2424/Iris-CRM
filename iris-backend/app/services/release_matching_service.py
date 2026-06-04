"""Release matching service."""
import json
import logging
from datetime import date, timedelta
from typing import Optional, List

from app.extensions import db
from app.models.release import SoftwareRelease
from app.models.release_match import ReleaseMatch
from app.models.account import Account
from app.models.installed_product import InstalledProduct
from app.utils.version import semver_lt

logger = logging.getLogger(__name__)

MIN_MATCH_SCORE = 3


def compute_matches(release_id: int, zone_id: Optional[int] = None) -> List[dict]:
    """
    Run matching algorithm for a release.
    Deletes existing matches (for the zone) and recomputes.
    Returns list of match dicts.
    """
    release = SoftwareRelease.query.get(release_id)
    if not release:
        raise ValueError(f'Release {release_id} not found')

    criteria = release.get_match_criteria()
    today = date.today()

    # Delete existing matches for this release (scoped to zone if provided)
    if zone_id is not None:
        existing = (ReleaseMatch.query
                    .join(Account, ReleaseMatch.account_id == Account.account_id)
                    .filter(ReleaseMatch.release_id == release_id,
                            Account.zone_id == zone_id)
                    .all())
    else:
        existing = ReleaseMatch.query.filter_by(release_id=release_id).all()
    for m in existing:
        db.session.delete(m)
    db.session.flush()

    # Get scoped accounts
    query = Account.query.filter_by(is_deleted=False)
    if zone_id is not None:
        query = query.filter_by(zone_id=zone_id)
    accounts = query.all()

    new_matches = []
    for account in accounts:
        installed = InstalledProduct.query.filter_by(account_id=account.account_id).all()
        for ip in installed:
            score, reasons = _score_match(account, ip, criteria, today)
            if score >= MIN_MATCH_SCORE:
                match = ReleaseMatch(
                    release_id=release_id,
                    account_id=account.account_id,
                    install_id=ip.install_id,
                    match_reason='; '.join(reasons),
                    match_score=score,
                )
                db.session.add(match)
                new_matches.append({
                    'account_id': account.account_id,
                    'account_name': account.account_name,
                    'install_id': ip.install_id,
                    'installed_version': ip.installed_version,
                    'match_reason': match.match_reason,
                    'match_score': score,
                    'reminder_status': 'Pending',
                })

    db.session.commit()
    logger.info(f'Release {release_id}: found {len(new_matches)} matches')
    return new_matches


def _score_match(account: Account, ip: InstalledProduct,
                 criteria: dict, today: date):
    """Score a single installed_product against release match_criteria."""
    score = 0
    reasons = []
    product = ip.product

    # product_name match (case-insensitive)
    crit_product_name = criteria.get('product_name', '').lower()
    if crit_product_name and product:
        if crit_product_name in product.product_name.lower():
            score += 3
            reasons.append(f'Product name match: {product.product_name}')

    # installed_version < older_than_version
    older_than = criteria.get('older_than_version')
    if older_than and ip.installed_version:
        if semver_lt(ip.installed_version, older_than):
            score += 3
            reasons.append(f'Older version {ip.installed_version} < {older_than}')

    # category match
    crit_category = criteria.get('category', '').lower()
    if crit_category and product and product.category:
        if crit_category in product.category.lower():
            score += 2
            reasons.append(f'Category match: {product.category}')

    # domain match
    crit_domain = criteria.get('domain', '').lower()
    if crit_domain and product and product.domain:
        if crit_domain in product.domain.lower():
            score += 2
            reasons.append(f'Domain match: {product.domain}')

    # hardware_age_gt_years
    age_gt = criteria.get('hardware_age_gt_years')
    if age_gt is not None and ip.hardware_age_years:
        if float(ip.hardware_age_years) > float(age_gt):
            score += 2
            reasons.append(f'Hardware age {ip.hardware_age_years} > {age_gt} years')

    # license_expiry_within_days
    lic_within = criteria.get('license_expiry_within_days')
    if lic_within is not None and ip.license_expiry:
        days_to_expiry = (ip.license_expiry - today).days
        if 0 <= days_to_expiry <= int(lic_within):
            score += 2
            reasons.append(f'License expiring in {days_to_expiry} days (within {lic_within})')

    # industries
    crit_industries = [i.lower() for i in criteria.get('industries', [])]
    if crit_industries and account.industry:
        if account.industry.lower() in crit_industries:
            score += 2
            reasons.append(f'Industry match: {account.industry}')

    # keywords in account.notes or product name
    crit_keywords = [k.lower() for k in criteria.get('keywords', [])]
    if crit_keywords:
        search_text = ' '.join(filter(None, [
            account.notes or '',
            product.product_name if product else '',
            product.keywords if product else '',
        ])).lower()
        for kw in crit_keywords:
            if kw in search_text:
                score += 1
                reasons.append(f'Keyword match: {kw}')
                break  # only +1 per account even if multiple keywords match

    return score, reasons
