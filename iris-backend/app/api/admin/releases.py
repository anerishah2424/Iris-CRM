"""Admin — Releases blueprint."""
import json
from datetime import date
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.release import SoftwareRelease
from app.middleware.scope import get_current_user
from app.utils.responses import success_response, error_response, paginated_response
from app.utils.pagination import get_pagination_params, paginate_query

admin_releases_bp = Blueprint('admin_releases', __name__)


def _manager_only(current_user):
    if not current_user or current_user.role != 'matrix_manager':
        return error_response('FORBIDDEN', 'Admin access required', 403)
    return None


@admin_releases_bp.route('', methods=['GET'])
@jwt_required()
def list_releases():
    current_user = get_current_user()
    err = _manager_only(current_user)
    if err:
        return err
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


@admin_releases_bp.route('', methods=['POST'])
@jwt_required()
def create_release():
    current_user = get_current_user()
    err = _manager_only(current_user)
    if err:
        return err
    data = request.get_json(silent=True) or {}
    match_criteria = data.get('match_criteria')
    if not match_criteria:
        # Default match criteria: match by product name
        match_criteria = {'product_name': data['product_name']}

    release = SoftwareRelease(
        product_id=data.get('product_id'),
        product_name=data['product_name'],
        domain=data.get('domain'),
        category=data.get('category'),
        new_version=data['new_version'],
        release_date=date.fromisoformat(data['release_date']),
        release_title=data['release_title'],
        description=data.get('description'),
        match_criteria=json.dumps(match_criteria) if isinstance(match_criteria, dict) else match_criteria,
        added_by=current_user.user_id,
    )
    release.highlights = data.get('highlights', [])
    db.session.add(release)
    db.session.commit()
    return success_response(release.to_dict(), message='Release created', status_code=201)


@admin_releases_bp.route('/<int:release_id>', methods=['PATCH'])
@jwt_required()
def update_release(release_id):
    current_user = get_current_user()
    err = _manager_only(current_user)
    if err:
        return err
    release = SoftwareRelease.query.get(release_id)
    if not release:
        return error_response('NOT_FOUND', 'Release not found', 404)
    data = request.get_json(silent=True) or {}
    for field in ('product_name', 'domain', 'category', 'new_version', 'release_title',
                  'description', 'is_active'):
        if field in data:
            setattr(release, field, data[field])
    if 'release_date' in data:
        release.release_date = date.fromisoformat(data['release_date'])
    if 'highlights' in data:
        release.highlights = data['highlights']
    if 'match_criteria' in data:
        mc = data['match_criteria']
        release.match_criteria = json.dumps(mc) if isinstance(mc, dict) else mc
    db.session.commit()
    return success_response(release.to_dict(), message='Release updated')


@admin_releases_bp.route('/<int:release_id>', methods=['DELETE'])
@jwt_required()
def delete_release(release_id):
    current_user = get_current_user()
    err = _manager_only(current_user)
    if err:
        return err
    release = SoftwareRelease.query.get(release_id)
    if not release:
        return error_response('NOT_FOUND', 'Release not found', 404)
    release.is_active = False  # Soft delete
    db.session.commit()
    return success_response(None, message='Release deactivated')
