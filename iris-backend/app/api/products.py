"""Products catalog blueprint."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.product import Product
from app.models.product_knowledge_base import ProductKnowledgeBase
from app.middleware.scope import get_current_user
from app.utils.responses import success_response, error_response, paginated_response
from app.utils.pagination import get_pagination_params, paginate_query
from app.services.recommendation_service import get_recommendations

products_bp = Blueprint('products', __name__)


@products_bp.route('', methods=['GET'])
@jwt_required()
def list_products():
    page, per_page = get_pagination_params()
    query = Product.query
    if domain := request.args.get('domain'):
        query = query.filter(Product.domain == domain)
    if category := request.args.get('category'):
        query = query.filter(Product.category == category)
    if status := request.args.get('status'):
        query = query.filter(Product.status == status)
    if search := request.args.get('search', '').strip():
        query = query.filter(Product.product_name.ilike(f'%{search}%'))
    query = query.order_by(Product.domain, Product.product_name)
    items, total = paginate_query(query, page, per_page)
    return paginated_response([p.to_dict() for p in items], page, per_page, total)


@products_bp.route('', methods=['POST'])
@jwt_required()
def create_product():
    current_user = get_current_user()
    if current_user.role != 'matrix_manager':
        return error_response('FORBIDDEN', 'Only matrix managers can add products', 403)
    data = request.get_json(silent=True) or {}
    if not data.get('product_name') or not data.get('domain'):
        return error_response('VALIDATION_ERROR', 'product_name and domain are required', 400)
    product = Product(**{k: v for k, v in data.items()
                         if hasattr(Product, k) and k != 'product_id'})
    db.session.add(product)
    db.session.commit()
    return success_response(product.to_dict(), message='Product created', status_code=201)


@products_bp.route('/<int:product_id>', methods=['PATCH'])
@jwt_required()
def update_product(product_id):
    current_user = get_current_user()
    if current_user.role != 'matrix_manager':
        return error_response('FORBIDDEN', 'Only matrix managers can update products', 403)
    product = Product.query.get(product_id)
    if not product:
        return error_response('NOT_FOUND', 'Product not found', 404)
    data = request.get_json(silent=True) or {}
    for field in ('product_name', 'domain', 'category', 'model_series', 'unit_price',
                  'status', 'keywords', 'description', 'is_stqc_er_compliant',
                  'is_bis_certified', 'is_onvif', 'license_type', 'expected_lifespan_years',
                  'deployment_type', 'datasheet_url', 'industry_fit'):
        if field in data:
            setattr(product, field, data[field])
    db.session.commit()
    return success_response(product.to_dict(), message='Product updated')


@products_bp.route('/<int:product_id>/recommendations', methods=['GET'])
@jwt_required()
def product_recommendations(product_id):
    product = Product.query.get(product_id)
    if not product:
        return error_response('NOT_FOUND', 'Product not found', 404)
    kb = ProductKnowledgeBase.query.filter_by(product_id=product_id).first()
    complementary = []
    if kb and kb.complementary_ids:
        complementary = [Product.query.get(pid).to_dict()
                         for pid in kb.complementary_ids
                         if Product.query.get(pid)]
    return success_response({
        'product': product.to_dict(),
        'complementary_products': complementary,
        'industry_fit': kb.industry_fit if kb else [],
        'use_cases': kb.use_cases if kb else [],
    })
