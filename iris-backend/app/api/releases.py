"""Software releases blueprint (SM view)."""
from datetime import datetime
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.models.release import SoftwareRelease
from app.models.release_match import ReleaseMatch
from app.models.account import Account
from app.middleware.scope import get_current_user, scoped_release_matches_query
from app.utils.responses import success_response, error_response, paginated_response
from app.utils.pagination import get_pagination_params, paginate_query
from app.services import release_matching_service
from app.extensions import db

releases_bp = Blueprint('releases', __name__)


@releases_bp.route('', methods=['GET'])
@jwt_required()
def list_releases():
    current_user = get_current_user()
    page, per_page = get_pagination_params()
    query = SoftwareRelease.query
    if is_active := request.args.get('is_active'):
        query = query.filter(SoftwareRelease.is_active == (is_active.lower() == 'true'))
    if domain := request.args.get('domain'):
        query = query.filter(SoftwareRelease.domain == domain)
    if search := request.args.get('search', '').strip():
        query = query.filter(SoftwareRelease.product_name.ilike(f'%{search}%'))
    query = query.order_by(SoftwareRelease.release_date.desc())
    items, total = paginate_query(query, page, per_page)
    return paginated_response([r.to_dict(include_match_count=True) for r in items],
                              page, per_page, total)


@releases_bp.route('/<int:release_id>', methods=['GET'])
@jwt_required()
def get_release(release_id):
    release = SoftwareRelease.query.get(release_id)
    if not release:
        return error_response('NOT_FOUND', 'Release not found', 404)
    return success_response(release.to_dict(include_match_count=True))


@releases_bp.route('/<int:release_id>/matches', methods=['GET'])
@jwt_required()
def get_release_matches(release_id):
    current_user = get_current_user()
    release = SoftwareRelease.query.get(release_id)
    if not release:
        return error_response('NOT_FOUND', 'Release not found', 404)
    query = scoped_release_matches_query(
        ReleaseMatch.query.filter_by(release_id=release_id), current_user
    )
    matches = query.order_by(ReleaseMatch.match_score.desc()).all()
    return success_response([m.to_dict(include_relations=True) for m in matches])


@releases_bp.route('/<int:release_id>/recompute', methods=['POST'])
@jwt_required()
def recompute_matches(release_id):
    current_user = get_current_user()
    zone_id = current_user.zone_id if current_user.role == 'Sales_manager' else None
    try:
        matches = release_matching_service.compute_matches(release_id, zone_id=zone_id)
        return success_response({'matches_found': len(matches), 'matches': matches})
    except ValueError as e:
        return error_response('NOT_FOUND', str(e), 404)


@releases_bp.route('/<int:release_id>/notify', methods=['POST'])
@jwt_required()
def notify_matches(release_id):
    current_user = get_current_user()
    data = request.get_json(silent=True) or {}
    account_ids = data.get('account_ids', [])

    query = scoped_release_matches_query(
        ReleaseMatch.query.filter_by(release_id=release_id, reminder_status='Pending'),
        current_user
    )
    if account_ids:
        query = query.filter(ReleaseMatch.account_id.in_(account_ids))
    matches = query.all()
    for m in matches:
        m.reminder_status = 'Reminded'
        m.reminded_at = datetime.utcnow()
        m.reminded_by = current_user.user_id
    db.session.commit()
    return success_response({'notified': len(matches)}, message='Reminders logged')


@releases_bp.route('/matches/<int:match_id>', methods=['PATCH'])
@jwt_required()
def update_match(match_id):
    """Update the reminder_status of a single release match."""
    from app.models.release_match import ReleaseMatch
    current_user = get_current_user()
    match = ReleaseMatch.query.get(match_id)
    if not match:
        return error_response('NOT_FOUND', 'Match not found', 404)
    data = request.get_json(silent=True) or {}
    if 'reminder_status' in data:
        match.reminder_status = data['reminder_status']
        if data['reminder_status'] == 'Reminded':
            match.reminded_at = datetime.utcnow()
            match.reminded_by = current_user.user_id
    db.session.commit()
    return success_response(match.to_dict(include_relations=True), message='Match updated')
