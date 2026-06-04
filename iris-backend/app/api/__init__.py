"""Blueprint registration."""
from flask import Flask


def register_blueprints(app: Flask) -> None:
    from .auth import auth_bp
    from .dashboard import dashboard_bp
    from .accounts import accounts_bp
    from .installed_products import installed_products_bp
    from .visits import visits_bp
    from .account_tickets import account_tickets_bp
    from .account_health import account_health_bp
    from .account_renewals_releases import account_renewals_bp, account_releases_bp
    from .tickets import tickets_bp
    from .health import health_bp
    from .renewals import renewals_bp
    from .releases import releases_bp
    from .agent import agent_bp
    from .si_partners import si_partners_bp
    from .products import products_bp
    from .zones import zones_bp
    from .admin.users import admin_users_bp
    from .admin.zones import admin_zones_bp
    from .admin.releases import admin_releases_bp
    from .notifications import notifications_bp
    from .prism import prism_bp

    # ── Accounts sub-blueprints (all registered at /api/accounts) ──────────────
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(accounts_bp, url_prefix='/api/accounts')
    app.register_blueprint(installed_products_bp, url_prefix='/api/accounts')
    app.register_blueprint(visits_bp, url_prefix='/api/accounts')
    app.register_blueprint(account_tickets_bp, url_prefix='/api/accounts')
    app.register_blueprint(account_health_bp, url_prefix='/api/accounts')
    app.register_blueprint(account_renewals_bp, url_prefix='/api/accounts')
    app.register_blueprint(account_releases_bp, url_prefix='/api/accounts')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')

    # ── Top-level blueprints ───────────────────────────────────────────────────
    app.register_blueprint(tickets_bp, url_prefix='/api/tickets')
    app.register_blueprint(health_bp, url_prefix='/api/health')
    app.register_blueprint(renewals_bp, url_prefix='/api/renewals')
    app.register_blueprint(releases_bp, url_prefix='/api/releases')
    app.register_blueprint(agent_bp, url_prefix='/api/agent')
    app.register_blueprint(si_partners_bp, url_prefix='/api/si-partners')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(zones_bp, url_prefix='/api/zones')
    app.register_blueprint(prism_bp, url_prefix='/api')

    # ── Admin blueprints ───────────────────────────────────────────────────────
    app.register_blueprint(admin_users_bp, url_prefix='/api/admin/users')
    app.register_blueprint(admin_zones_bp, url_prefix='/api/admin/zones')
    app.register_blueprint(admin_releases_bp, url_prefix='/api/admin/releases')
