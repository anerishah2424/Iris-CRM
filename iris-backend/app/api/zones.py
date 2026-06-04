"""Zones blueprint for shared access."""
from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.models.zone import Zone
from app.utils.responses import success_response

zones_bp = Blueprint('zones', __name__)

@zones_bp.route('', methods=['GET'])
@jwt_required()
def list_zones():
    """List all zones (accessible by any authenticated user)."""
    zones = Zone.query.order_by(Zone.zone_name).all()
    return success_response([z.to_dict() for z in zones])
