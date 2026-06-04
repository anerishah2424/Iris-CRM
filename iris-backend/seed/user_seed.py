"""Seed script - loads all data from seed_data.json."""
import sys
import os
import json
from datetime import datetime, date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.extensions import db, bcrypt
from app.models.zone import Zone
from app.models.account import Account
from app.models.product import Product
from app.models.installed_product import InstalledProduct
from app.models.user import User
from app.models.ticket import Ticket

app = create_app('development')

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'seed_data.json')


def parse_date(s):
    if not s:
        return None
    try:
        return datetime.strptime(s, '%Y-%m-%d').date()
    except Exception:
        return None


def parse_datetime(s):
    if not s:
        return None
    try:
        return datetime.strptime(s, '%Y-%m-%d')
    except Exception:
        return None


def seed():
    with open(DATA_FILE, 'r') as f:
        data = json.load(f)

    with app.app_context():
        print("Dropping and recreating all tables...")
        db.drop_all()
        db.create_all()
        db.session.commit()

        # ── ZONES ────────────────────────────────────────────────────────────
        print("Seeding zones...")
        for zd in data['zones']:
            states_str = ', '.join(zd['states']) if isinstance(zd['states'], list) else zd['states']
            z = Zone(
                zone_id=zd['zone_id'],
                zone_name=zd['zone_name'],
                states=states_str,
                sales_office=zd['sales_office']
            )
            db.session.add(z)
        db.session.commit()

        # ── USERS ─────────────────────────────────────────────────────────────
        print("Seeding users...")
        pw = bcrypt.generate_password_hash('Matrix@123').decode('utf-8')
        for ud in data['users']:
            u = User(
                full_name=ud['full_name'],
                email=ud['email'],
                username=ud['username'],
                password_hash=bcrypt.generate_password_hash(ud.get('password_hash', 'Matrix@123')).decode('utf-8'),
                role=ud['role'],
                zone_id=ud.get('zone_id'),
                phone=ud.get('phone'),
                is_active=ud.get('is_active', True)
            )
            db.session.add(u)
        db.session.commit()

        # ── PRODUCT CATALOG ───────────────────────────────────────────────────
        print("Seeding product catalog...")
        seeded_sap = set()
        for pd in data['products']:
            if pd['sap_code'] in seeded_sap:
                continue
            p = Product(
                sap_code=pd['sap_code'],
                product_name=pd['product_name'],
                domain=pd['domain'],
                category=pd['category'],
                series=pd.get('series'),
                deployment_type=pd.get('deployment_type'),
                unit_price=pd.get('unit_price'),
                status=pd.get('status', 'ACTIVE')
            )
            db.session.add(p)
            seeded_sap.add(pd['sap_code'])

        # extra products referenced in installations but not in catalog
        for ip in data['installations']:
            sc = ip['sap_code']
            if sc not in seeded_sap:
                p = Product(
                    sap_code=sc,
                    product_name=ip['product_name'],
                    domain=ip['domain'],
                    category=ip['category'],
                    status='ACTIVE'
                )
                db.session.add(p)
                seeded_sap.add(sc)
        db.session.commit()

        # ── ACCOUNTS ──────────────────────────────────────────────────────────
        print("Seeding accounts...")
        user_map = {u.full_name: u for u in User.query.all()}
        for ad in data['accounts']:
            sm_name = ad.get('sales_manager')
            sm = user_map.get(sm_name)
            acc = Account(
                account_id=ad['account_id'],
                account_name=ad['account_name'],
                industry=ad['industry'],
                sub_industry=ad.get('sub_industry'),
                city=ad['city'],
                state=ad['state'],
                si_name=ad.get('si_name'),
                vad_company=ad.get('vad_company'),
                sales_manager=sm_name,
                sales_manager_id=sm.user_id if sm else None,
                zone_id=sm.zone_id if sm else ad.get('zone_id'),
                health_score=ad.get('health_score'),
                health_status=ad.get('health_status'),
                created_on=parse_datetime(ad.get('created_on')) or datetime.utcnow()
            )
            db.session.add(acc)
        db.session.commit()

        # ── INSTALLED PRODUCTS ────────────────────────────────────────────────
        print("Seeding installed products...")
        prod_map = {p.sap_code: p for p in Product.query.all()}
        for ipd in data['installations']:
            prod = prod_map.get(ipd['sap_code'])
            if not prod:
                print(f"  WARNING: no product for sap_code {ipd['sap_code']}, skipping")
                continue
            has_expiry = bool(ipd.get('license_expiry'))
            ip = InstalledProduct(
                account_id=ipd['account_id'],
                product_id=prod.product_id,
                sap_code=ipd['sap_code'],
                product_name=ipd['product_name'],
                domain=ipd['domain'],
                category=ipd['category'],
                series=prod.series,
                quantity=ipd['quantity'],
                install_date=parse_date(ipd.get('install_date')),
                license_expiry=parse_date(ipd.get('license_expiry')),
                license_type='Annual' if has_expiry else 'None',
                license_status='Expired' if has_expiry else 'Active',
            )
            db.session.add(ip)
        db.session.commit()

        # ── TICKETS ───────────────────────────────────────────────────────────
        print("Seeding tickets...")
        for td in data['tickets']:
            t = Ticket(
                ticket_ref=td['id'],
                account_id=td['account_id'],
                title=td['issue'],
                priority=td['priority'].capitalize(),
                status=td['status'],
                raised_by=td.get('raised_by'),
                source=td.get('source', 'manual'),
                raised_on=parse_datetime(td.get('created_on')) or datetime.utcnow(),
                resolved_on=parse_datetime(td.get('resolved_on'))
            )
            db.session.add(t)
        db.session.commit()

        print(f"Done! Seeded {len(data['zones'])} zones, {len(data['users'])} users, "
              f"{len(seeded_sap)} products, {len(data['accounts'])} accounts, "
              f"{len(data['installations'])} installations, {len(data['tickets'])} tickets.")


if __name__ == '__main__':
    seed()
