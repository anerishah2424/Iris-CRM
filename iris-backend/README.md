# IRIS Backend — Matrix Comsec Sales Portal

Production-ready Python Flask REST API for the IRIS Sales Manager portal.

---

## Prerequisites

- Python 3.11+
- pip
- (Production) PostgreSQL 15+, Redis

---

## Setup

```bash
cd iris-backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

---

## Environment Configuration

Copy `.env.example` to `.env` and edit:

| Variable | Description | Default |
|---|---|---|
| `FLASK_ENV` | `development` / `production` / `testing` | `development` |
| `SECRET_KEY` | Flask secret key | `dev-secret` |
| `JWT_SECRET_KEY` | JWT signing key | `jwt-dev-secret` |
| `DATABASE_URL` | PostgreSQL URL (prod) | SQLite in dev |
| `CORS_ORIGINS` | Allowed CORS origins | `*` |
| `CELERY_BROKER_URL` | Redis URL for Celery | `redis://localhost:6379/0` |

---

## Database Initialization

```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

---

## Seed Data

```bash
python seed/seed.py
```

Creates:
- 5 zones (North, South, East, West, Central)
- 6 users (1 matrix_manager + 5 Sales_managers)
- 30+ products across all Matrix Comsec domains
- 20 accounts spread across all zones
- 40+ installed products
- 30+ tickets (some accounts with >3 open tickets)
- 3 software releases with match criteria
- Visit logs + health scores recalculated

**Default credentials:** `admin@matrix.com` / `Matrix@123`

---

## Running Dev Server

```bash
python run.py
# or
flask run --port 5000
```

API base URL: `http://localhost:5000/api`

---

## Running Tests

```bash
pytest tests/ -v
```

---

## Auth Flow

```
POST /api/auth/login
  Body: { "username": "admin@matrix.com", "password": "Matrix@123" }
  Response: { access_token, refresh_token, user, zone }

All subsequent requests:
  Header: Authorization: Bearer <access_token>

POST /api/auth/refresh   — get new access token using refresh token
POST /api/auth/logout    — blacklist current token
GET  /api/auth/me        — current user info
```

Access token expires after **8 hours**. Refresh token expires after **7 days**.

---

## Role Summary

| Role | Access Level |
|---|---|
| `matrix_manager` | Full access to all zones, accounts, admin endpoints |
| `Sales_manager` | Scoped to assigned zone only; cannot access admin endpoints |

---

## Health Score Formula

```
Start: 100 points

Excluded: license_status='Discontinued' AND expired >30 days → skip entirely

Open ticket deductions:
  Per ticket (up to 3): -8 pts each
  If open_count > 3:    -20 pts additional

License expiry deductions (per non-excluded installed product):
  Expired:              -45 pts
  Expiring 1–30 days:   -35 pts
  Expiring 31–90 days:  -20 pts
  Expiring 91–180 days: -10 pts

Hardware/software age: -10 pts (once) if any product age > 4 years

Engagement: -15 pts if last visit > 180 days ago or never

Final = max(0, 100 - deductions)

Status:
  Healthy  : score >= 70
  At-Risk  : score 40–69
  Critical : score < 40 OR open_tickets > 3 OR
             any expired active license OR
             any active license expiring < 30 days
```

---

## Release Matching Logic

Each release has a `match_criteria` JSON. Additive scoring per installed product:

| Criterion | Points |
|---|---|
| Product name match (case-insensitive) | +3 |
| `installed_version` < `older_than_version` (semver) | +3 |
| Category match | +2 |
| Domain match | +2 |
| `hardware_age_years` > threshold | +2 |
| License expiring within N days | +2 |
| Account industry in list | +2 |
| Keyword in notes/product name | +1 |

**Minimum score to create a match: 3**

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/refresh` | Refresh token | Refresh access token |
| GET | `/api/auth/me` | JWT | Current user |
| POST | `/api/auth/logout` | JWT | Logout |
| GET | `/api/dashboard/summary` | JWT | Zone dashboard stats |
| GET | `/api/dashboard/opportunities` | JWT | Top 10 alerts |
| GET/POST | `/api/accounts` | JWT | List/create accounts |
| GET/PATCH/DELETE | `/api/accounts/:id` | JWT | Account detail |
| GET/POST | `/api/accounts/:id/products` | JWT | Installed products |
| PATCH/DELETE | `/api/accounts/:id/products/:install_id` | JWT | Update/remove |
| GET/POST | `/api/accounts/:id/tickets` | JWT | Account tickets |
| GET | `/api/accounts/:id/health` | JWT | Health breakdown |
| GET/POST | `/api/accounts/:id/visits` | JWT | Visit logs |
| GET/POST | `/api/tickets` | JWT | All tickets |
| PATCH | `/api/tickets/:id` | JWT | Update ticket |
| POST | `/api/tickets/sync` | JWT | Import tickets |
| POST | `/api/health/recalculate` | JWT | Bulk recalculate |
| GET/PATCH | `/api/renewals` | JWT | Renewals list |
| POST | `/api/renewals/:id/remind` | JWT | Log reminder |
| GET | `/api/new-releases` | JWT | Releases list |
| GET | `/api/new-releases/:id/matches` | JWT | Matched clients |
| POST | `/api/new-releases/:id/recompute` | JWT | Re-run matching |
| POST | `/api/new-releases/:id/notify` | JWT | Send reminders |
| GET/POST/PATCH | `/api/products` | JWT | Product catalog |
| GET/POST/PATCH | `/api/si-partners` | JWT | SI partners |
| POST | `/api/agent/accounts/:id/market-analysis` | JWT | AI analysis |
| POST | `/api/agent/accounts/:id/proposal` | JWT | Generate proposal |
| POST | `/api/agent/prospects/analyze` | JWT | Prospect analysis |
| POST | `/api/agent/prospects/proposal` | JWT | Prospect proposal |
| GET | `/api/agent/runs/:run_id` | JWT | Poll agent run |
| GET/POST | `/api/admin/users` | matrix_manager | Manage users |
| GET/POST/PATCH/DELETE | `/api/admin/zones` | matrix_manager | Manage zones |
| GET/POST/PATCH/DELETE | `/api/admin/releases` | matrix_manager | Manage releases |
