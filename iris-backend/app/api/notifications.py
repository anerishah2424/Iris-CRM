"""Notifications blueprint."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.notification import Notification
from app.middleware.scope import get_current_user
from app.utils.responses import success_response, error_response

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('', methods=['GET'])
@jwt_required()
def list_notifications():
    current_user = get_current_user()
    if not current_user:
        return error_response('UNAUTHORIZED', 'User not found', 401)
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    
    query = Notification.query.filter_by(user_id=current_user.user_id)
    if unread_only:
        query = query.filter_by(is_read=False)
        
    notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
    return success_response({
        'notifications': [n.to_dict() for n in notifications],
        'unread_count': Notification.query.filter_by(user_id=current_user.user_id, is_read=False).count()
    })

@notifications_bp.route('/mark-read', methods=['POST'])
@jwt_required()
def mark_read():
    current_user = get_current_user()
    data = request.get_json(silent=True) or {}
    notification_id = data.get('notification_id')
    
    if notification_id:
        n = Notification.query.filter_by(notification_id=notification_id, user_id=current_user.user_id).first()
        if n:
            n.is_read = True
    else:
        # Mark all as read
        Notification.query.filter_by(user_id=current_user.user_id, is_read=False).update({'is_read': True})
        
    db.session.commit()
    return success_response(None, message='Marked as read')

@notifications_bp.route('/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    current_user = get_current_user()
    n = Notification.query.filter_by(notification_id=notification_id, user_id=current_user.user_id).first()
    if not n:
        return error_response('NOT_FOUND', 'Notification not found', 404)
        
    db.session.delete(n)
    db.session.commit()
    return success_response(None, message='Deleted')
