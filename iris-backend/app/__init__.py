"""Application factory."""
import logging
import os
from flask import Flask
from .config import config_map
from .extensions import db, migrate, jwt, bcrypt, cors, token_blocklist


def create_app(config_name: str = 'development') -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)

    # Load config
    cfg = config_map.get(config_name, config_map['default'])
    app.config.from_object(cfg)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    
    # Handle comma-separated CORS origins
    cors_origins = app.config.get('CORS_ORIGINS', '*')
    if isinstance(cors_origins, str) and ',' in cors_origins:
        cors_origins = [o.strip() for o in cors_origins.split(',')]

    cors.init_app(app, origins=cors_origins,
                  supports_credentials=True)

    # Configure logging
    _configure_logging(app)

    # JWT callbacks
    _configure_jwt(app)

    # Register error handlers
    _register_error_handlers(app)

    # Register blueprints
    _register_blueprints(app)

    # Ensure all models are imported for migrations
    with app.app_context():
        from app import models  # noqa: F401

    return app


def _configure_logging(app: Flask) -> None:
    """Set up structured logging."""
    log_level = logging.DEBUG if app.config.get('DEBUG') else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    )
    app.logger.setLevel(log_level)


def _configure_jwt(app: Flask) -> None:
    """JWT token callbacks."""
    from .extensions import jwt as jwt_manager

    @jwt_manager.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload.get('jti')
        return jti in token_blocklist

    @jwt_manager.user_identity_loader
    def user_identity_lookup(user):
        return user

    @jwt_manager.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        from .utils.responses import error_response
        return error_response('TOKEN_EXPIRED', 'Access token has expired', 401)

    @jwt_manager.invalid_token_loader
    def invalid_token_callback(error_string):
        from .utils.responses import error_response
        return error_response('INVALID_TOKEN', f'Invalid token: {error_string}', 401)

    @jwt_manager.unauthorized_loader
    def missing_token_callback(error_string):
        from .utils.responses import error_response
        return error_response('MISSING_TOKEN', 'Authorization token is required', 401)

    @jwt_manager.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        from .utils.responses import error_response
        return error_response('TOKEN_REVOKED', 'Token has been revoked', 401)


def _register_error_handlers(app: Flask) -> None:
    """Global HTTP error handlers."""
    from .utils.responses import error_response

    @app.errorhandler(400)
    def bad_request(e):
        return error_response('BAD_REQUEST', str(e.description), 400)

    @app.errorhandler(401)
    def unauthorized(e):
        return error_response('UNAUTHORIZED', 'Authentication required', 401)

    @app.errorhandler(403)
    def forbidden(e):
        return error_response('FORBIDDEN', 'You do not have permission to access this resource', 403)

    @app.errorhandler(404)
    def not_found(e):
        return error_response('NOT_FOUND', 'Resource not found', 404)

    @app.errorhandler(405)
    def method_not_allowed(e):
        return error_response('METHOD_NOT_ALLOWED', 'Method not allowed', 405)

    @app.errorhandler(409)
    def conflict(e):
        return error_response('CONFLICT', str(e.description), 409)

    @app.errorhandler(422)
    def unprocessable(e):
        return error_response('UNPROCESSABLE_ENTITY', str(e.description), 422)

    @app.errorhandler(500)
    def internal_error(e):
        app.logger.error(f'Internal server error: {e}')
        return error_response('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', 500)


def _register_blueprints(app: Flask) -> None:
    """Register all API blueprints."""
    from .api import register_blueprints
    register_blueprints(app)
