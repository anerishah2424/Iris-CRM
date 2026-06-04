"""SI Partners blueprint."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.si_partner import SIPartner
from app.middleware.scope import get_current_user, scoped_si_partners_query
from app.utils.responses import success_response, error_response, paginated_response
from app.utils.pagination import get_pagination_params, paginate_query

si_partners_bp = Blueprint('si_partners', __name__)


@si_partners_bp.route('', methods=['GET'])
@jwt_required()
def list_si_partners():
    current_user = get_current_user()
    page, per_page = get_pagination_params()
    query = scoped_si_partners_query(SIPartner.query.filter_by(is_active=True), current_user)
    if state := request.args.get('state'):
        query = query.filter(SIPartner.state == state)
    if search := request.args.get('search', '').strip():
        query = query.filter(SIPartner.si_name.ilike(f'%{search}%'))
    items, total = paginate_query(query.order_by(SIPartner.si_name), page, per_page)
    return paginated_response([s.to_dict() for s in items], page, per_page, total)


@si_partners_bp.route('', methods=['POST'])
@jwt_required()
def create_si_partner():
    data = request.get_json(silent=True) or {}
    if not data.get('si_name'):
        return error_response('VALIDATION_ERROR', 'si_name is required', 400)
    si = SIPartner(
        si_name=data['si_name'],
        contact_name=data.get('contact_name'),
        contact_phone=data.get('contact_phone'),
        contact_email=data.get('contact_email'),
        city=data.get('city'),
        state=data.get('state'),
        zone_id=data.get('zone_id'),
    )
    db.session.add(si)
    db.session.commit()
    return success_response(si.to_dict(), message='SI Partner created', status_code=201)


@si_partners_bp.route('/<int:si_id>', methods=['PATCH'])
@jwt_required()
def update_si_partner(si_id):
    si = SIPartner.query.get(si_id)
    if not si:
        return error_response('NOT_FOUND', 'SI Partner not found', 404)
    data = request.get_json(silent=True) or {}
    for field in ('si_name', 'contact_name', 'contact_phone', 'contact_email',
                  'city', 'state', 'zone_id', 'is_active'):
        if field in data:
            setattr(si, field, data[field])
    db.session.commit()
    return success_response(si.to_dict(), message='SI Partner updated')
