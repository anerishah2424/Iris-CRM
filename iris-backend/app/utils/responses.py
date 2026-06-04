"""Standard JSON response helpers."""
from flask import jsonify
from typing import Any, Optional


def success_response(data: Any = None, message: str = 'OK', status_code: int = 200,
                     meta: Optional[dict] = None):
    """Return a standard success envelope."""
    payload = {
        'success': True,
        'data': data,
        'message': message,
    }
    if meta is not None:
        payload['meta'] = meta
    return jsonify(payload), status_code


def error_response(error_code: str, message: str, status_code: int = 400):
    """Return a standard error envelope."""
    return jsonify({
        'success': False,
        'error': error_code,
        'message': message,
    }), status_code


def paginated_response(items: list, page: int, per_page: int, total: int,
                       message: str = 'OK', status_code: int = 200):
    """Return a paginated list response."""
    return success_response(
        data=items,
        message=message,
        status_code=status_code,
        meta={
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': (total + per_page - 1) // per_page,
        }
    )
