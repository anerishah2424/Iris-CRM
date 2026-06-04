"""Installed products sub-blueprint (nested under /accounts/<id>/products)."""
from datetime import datetime, date
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.installed_product import InstalledProduct
from app.models.account import Account
from app.models.product import Product
from app.middleware.scope import get_current_user, scoped_accounts_query
from app.utils.responses import success_response, error_response
from app.services import health_service, renewal_service

installed_products_bp = Blueprint('installed_products', __name__)


def _get_scoped_account(account_id, current_user):
    query = scoped_accounts_query(
        Account.query.filter_by(is_deleted=False, account_id=account_id), current_user
    )
    return query.first()


@installed_products_bp.route('/<int:account_id>/products', methods=['GET'])
@jwt_required()
def list_installed_products(account_id):
    current_user = get_current_user()
    account = _get_scoped_account(account_id, current_user)
    if not account:
        return error_response('NOT_FOUND', 'Account not found', 404)

    ips = InstalledProduct.query.filter_by(account_id=account_id).all()
    return success_response([ip.to_dict(include_product=True) for ip in ips])


@installed_products_bp.route('/<int:account_id>/products', methods=['POST'])
@jwt_required()
def add_installed_product(account_id):
    current_user = get_current_user()
    account = _get_scoped_account(account_id, current_user)
    if not account:
        return error_response('NOT_FOUND', 'Account not found', 404)

    data = request.get_json(silent=True) or {}
    if not data.get('product_id'):
        return error_response('VALIDATION_ERROR', 'product_id is required', 400)

    product = Product.query.get(data['product_id'])
    if not product:
        return error_response('NOT_FOUND', 'Product not found', 404)

    ip = InstalledProduct(
        account_id=account_id,
        product_id=data['product_id'],
        sap_code=data.get('sap_code') or product.sap_code,
        product_name=product.product_name,
        domain=product.domain,
        category=product.category,
        series=product.model_series,
        quantity=data.get('quantity', 1),
        installed_version=data.get('installed_version'),
        install_date=date.fromisoformat(data['installation_date']) if data.get('installation_date') else None,
        warranty_expiry=date.fromisoformat(data['warranty_expiry']) if data.get('warranty_expiry') else None,
        license_expiry=date.fromisoformat(data['license_expiry']) if data.get('license_expiry') else None,
        license_type=data.get('license_type') or product.license_type,
        site_location=data.get('site_location'),
        notes=data.get('notes'),
        added_by=current_user.user_id,
    )
    if data.get('serial_numbers'):
        ip.serial_numbers = data['serial_numbers']
    
    db.session.add(ip)
    db.session.commit()

    # Sync renewal records and recalculate health
    renewal_service.sync_renewal_records_for_account(account_id)
    health_service.recalculate_account_health(account_id, triggered_by='license_update')

    return success_response(ip.to_dict(include_product=True),
                            message='Installed product added', status_code=201)


@installed_products_bp.route('/<int:account_id>/products/<int:install_id>', methods=['PATCH'])
@jwt_required()
def update_installed_product(account_id, install_id):
    current_user = get_current_user()
    account = _get_scoped_account(account_id, current_user)
    if not account:
        return error_response('NOT_FOUND', 'Account not found', 404)

    ip = InstalledProduct.query.filter_by(install_id=install_id, account_id=account_id).first()
    if not ip:
        return error_response('NOT_FOUND', 'Installed product not found', 404)

    data = request.get_json(silent=True) or {}
    
    for field in ('installed_version', 'quantity', 'license_type', 'license_status',
                  'site_location', 'notes'):
        if field in data:
            setattr(ip, field, data[field])
            
    # Fix date fields - handle empty strings from frontend
    date_map = {
        'license_expiry': 'license_expiry',
        'warranty_expiry': 'warranty_expiry',
        'installation_date': 'install_date', # Map frontend field to backend column
        'amc_start_date': 'amc_start_date',
        'amc_end_date': 'amc_end_date'
    }
    
    for req_key, db_col in date_map.items():
        if req_key in data:
            val = data[req_key]
            setattr(ip, db_col, date.fromisoformat(val) if val else None)
            
    if 'hardware_age_years' in data:
        ip.hardware_age_years = data['hardware_age_years']
    if 'serial_numbers' in data:
        ip.serial_numbers = data['serial_numbers']

    db.session.commit()
    renewal_service.sync_renewal_records_for_account(account_id)
    health_service.recalculate_account_health(account_id, triggered_by='license_update')
    return success_response(ip.to_dict(include_product=True), message='Updated')


@installed_products_bp.route('/<int:account_id>/products/<int:install_id>', methods=['DELETE'])
@jwt_required()
def delete_installed_product(account_id, install_id):
    current_user = get_current_user()
    account = _get_scoped_account(account_id, current_user)
    if not account:
        return error_response('NOT_FOUND', 'Account not found', 404)

    ip = InstalledProduct.query.filter_by(install_id=install_id, account_id=account_id).first()
    if not ip:
        return error_response('NOT_FOUND', 'Installed product not found', 404)

    db.session.delete(ip)
    db.session.commit()
    health_service.recalculate_account_health(account_id, triggered_by='license_update')
    return success_response(None, message='Installed product removed')
