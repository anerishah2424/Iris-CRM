"""Main seed script."""
import sys
import os
import json
from datetime import date, timedelta, datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.extensions import db, bcrypt
from app.models.zone import Zone
from app.models.user import User
from app.models.si_partner import SIPartner
from app.models.account import Account
from app.models.product import Product
from app.models.installed_product import InstalledProduct
from app.models.ticket import Ticket
from app.models.renewal import Renewal
from app.models.release import SoftwareRelease
from app.models.visit_log import VisitLog
from app.models.product_knowledge_base import ProductKnowledgeBase
from app.services.health_service import recalculate_account_health
from app.services.renewal_service import sync_renewal_records_for_account
from app.services.release_matching_service import compute_matches

app = create_app('development')

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

def load_json(filename):
    with open(os.path.join(DATA_DIR, filename)) as f:
        return json.load(f)

def seed_zones():
    print("Seeding zones...")
    zones_data = load_json('zones.json')
    zones = []
    for zd in zones_data:
        z = Zone(zone_name=zd['zone_name'], sales_office=zd.get('sales_office'))
        states = zd.get('states', [])
        z.states = ', '.join(states) if isinstance(states, list) else states
        db.session.add(z)
        zones.append(z)
    db.session.commit()
    return {z.zone_name: z for z in zones}

def seed_users(zone_map):
    print("Seeding users...")
    pw = bcrypt.generate_password_hash('Matrix@123').decode('utf-8')
    admin = User(full_name='Matrix Admin', email='admin@matrix.com',
                 username='admin', password_hash=pw, role='matrix_manager',
                 zone_id=None, designation='National Sales Head', phone='9000000000')
    db.session.add(admin)
    sm_data = [
        ('North SM', 'sm.north@matrix.com', 'sm_north', 'North', 'Regional Sales Manager - North'),
        ('South SM', 'sm.south@matrix.com', 'sm_south', 'South', 'Regional Sales Manager - South'),
        ('West SM',  'sm.west@matrix.com',  'sm_west',  'West',  'Regional Sales Manager - West'),
        ('East SM',  'sm.east@matrix.com',  'sm_east',  'East',  'Regional Sales Manager - East'),
        ('Central SM','sm.central@matrix.com','sm_central','Central','Regional Sales Manager - Central'),
    ]
    users = [admin]
    for name, email, uname, zone_name, desig in sm_data:
        u = User(full_name=name, email=email, username=uname,
                 password_hash=pw, role='Sales_manager',
                 zone_id=zone_map[zone_name].zone_id, designation=desig,
                 phone='900000000' + str(len(users)))
        db.session.add(u)
        users.append(u)
    db.session.commit()
    return users

def seed_si_partners(zone_map):
    print("Seeding SI partners...")
    sis = [
        ('Secure Vision Systems', 'Ankit Patel', 'North Delhi',   'Delhi',      'North'),
        ('TechGuard Solutions',   'Ravi Verma',  'Bangalore',     'Karnataka',  'South'),
        ('SafeNet Integrators',   'Kiran Shah',  'Ahmedabad',     'Gujarat',    'West'),
        ('Eastern Security Co',   'Sunil Ghosh', 'Kolkata',       'West Bengal','East'),
        ('CentralTech Security',  'Amit Dubey',  'Bhopal',        'Madhya Pradesh','Central'),
    ]
    si_objs = []
    for name, contact, city, state, zone in sis:
        si = SIPartner(si_name=name, contact_name=contact, city=city,
                       state=state, zone_id=zone_map[zone].zone_id,
                       contact_email=f"{contact.lower().replace(' ','.')}@{name.lower().replace(' ','')}si.com",
                       contact_phone='98765' + str(40000 + len(si_objs)))
        db.session.add(si)
        si_objs.append(si)
    db.session.commit()
    return si_objs

def seed_products():
    print("Seeding products...")
    products = [
        # Video Surveillance — Cameras
        dict(sap_code='CAM-CIDR-2MP', product_name='SATATYA CIDR20FL36CWP', domain='Video Surveillance',
             category='IP Camera - Dome', model_series='SATATYA', deployment_type='On-Premise',
             resolution_mp=2.0, is_stqc_er_compliant=True, is_bis_certified=True, is_onvif=True,
             unit_price=8500, license_type='None', expected_lifespan_years=5,
             keywords='dome,indoor,2mp,camera,surveillance', industry_fit='Manufacturing,Banking,Retail,Healthcare',
             status='Active', description='2MP Full HD Indoor Dome Camera, STQC ER compliant'),
        dict(sap_code='CAM-CIDR-5MP', product_name='SATATYA CIDR50FL28CWP', domain='Video Surveillance',
             category='IP Camera - Dome', model_series='SATATYA', resolution_mp=5.0,
             is_stqc_er_compliant=True, is_bis_certified=True, is_onvif=True,
             unit_price=14500, license_type='None', expected_lifespan_years=5,
             keywords='dome,5mp,camera,surveillance,high resolution',
             industry_fit='Pharma,IT,Government,Hospitality', status='Active',
             description='5MP Full HD Indoor Dome Camera'),
        dict(sap_code='CAM-CIDR-8MP', product_name='SATATYA CIDR80FL28CWP', domain='Video Surveillance',
             category='IP Camera - Dome', model_series='SATATYA', resolution_mp=8.0,
             is_stqc_er_compliant=True, unit_price=22000, license_type='None',
             expected_lifespan_years=5, keywords='dome,8mp,4k,camera', status='Active'),
        dict(sap_code='CAM-CIBR-2MP', product_name='SATATYA CIBR20FL36CWP', domain='Video Surveillance',
             category='IP Camera - Bullet', model_series='SATATYA', resolution_mp=2.0,
             is_stqc_er_compliant=True, is_onvif=True, unit_price=9500, license_type='None',
             expected_lifespan_years=5, keywords='bullet,outdoor,2mp,perimeter,surveillance',
             industry_fit='Manufacturing,Energy,Logistics', status='Active'),
        dict(sap_code='CAM-CIBR-5MP', product_name='SATATYA CIBR50FL36CWP', domain='Video Surveillance',
             category='IP Camera - Bullet', model_series='SATATYA', resolution_mp=5.0,
             is_stqc_er_compliant=True, unit_price=16000, license_type='None',
             expected_lifespan_years=5, keywords='bullet,5mp,outdoor,perimeter', status='Active'),
        dict(sap_code='CAM-PTZ-36X', product_name='SATATYA CAPTZ36X', domain='Video Surveillance',
             category='IP Camera - PTZ', model_series='SATATYA', resolution_mp=2.0,
             is_onvif=True, unit_price=85000, license_type='None', expected_lifespan_years=7,
             keywords='ptz,optical zoom,perimeter,wide area,parking,warehouse', status='Active'),
        dict(sap_code='CAM-FISH-2MP', product_name='SATATYA CIFR20OL360CWP', domain='Video Surveillance',
             category='IP Camera - Fisheye', model_series='SATATYA', resolution_mp=2.0,
             unit_price=18000, license_type='None', expected_lifespan_years=5,
             keywords='fisheye,360,panoramic,lobby,retail', status='Active'),
        dict(sap_code='CAM-ANPR-2MP', product_name='SATATYA ANPR20FL8CWP', domain='Video Surveillance',
             category='ANPR Camera', model_series='SATATYA', resolution_mp=2.0,
             unit_price=45000, license_type='None', expected_lifespan_years=7,
             keywords='anpr,lpr,vehicle,truck,gate,fleet,warehouse,parking,number plate',
             industry_fit='Manufacturing,Logistics,Energy,Real Estate', status='Active'),
        # NVR
        dict(sap_code='NVR-0401', product_name='SATATYA NVR0401X', domain='Video Surveillance',
             category='NVR', model_series='SATATYA', unit_price=12000, license_type='None',
             expected_lifespan_years=5, keywords='nvr,recorder,4 channel', status='Active'),
        dict(sap_code='NVR-1601', product_name='SATATYA NVR1601X', domain='Video Surveillance',
             category='NVR', model_series='SATATYA', unit_price=28000, license_type='None',
             expected_lifespan_years=5, keywords='nvr,recorder,16 channel', status='Active'),
        dict(sap_code='NVR-3201', product_name='SATATYA NVR3201X', domain='Video Surveillance',
             category='NVR', model_series='SATATYA', unit_price=48000, license_type='None',
             expected_lifespan_years=5, keywords='nvr,recorder,32 channel', status='Active'),
        # VMS
        dict(sap_code='VMS-SAMAS', product_name='SATATYA SAMAS Enterprise VMS', domain='Video Surveillance',
             category='VMS', model_series='SATATYA', deployment_type='On-Premise',
             unit_price=150000, license_type='Annual', expected_lifespan_years=5,
             keywords='vms,video management,enterprise,multi site', status='Active',
             description='Enterprise Video Management Software'),
        # Access Control
        dict(sap_code='AC-PANEL200P', product_name='COSEC PANEL200P', domain='Access Control',
             category='Access Controller', model_series='COSEC PANEL', deployment_type='On-Premise',
             unit_price=35000, license_type='None', expected_lifespan_years=7,
             keywords='access control,panel,door controller,200 doors', status='Active'),
        dict(sap_code='AC-PANEL800', product_name='COSEC PANEL800', domain='Access Control',
             category='Access Controller', model_series='COSEC PANEL', unit_price=65000,
             license_type='None', expected_lifespan_years=7, keywords='access panel,800 doors,enterprise', status='Active'),
        dict(sap_code='AC-ARGO-FACEM', product_name='COSEC ARGO FACEM', domain='Access Control',
             category='Biometric + Face Reader', model_series='COSEC ARGO', unit_price=28000,
             license_type='None', expected_lifespan_years=7,
             keywords='face recognition,biometric,access,attendance', status='Active'),
        dict(sap_code='AC-ARGO-FACE300M', product_name='COSEC ARGO FACE300M', domain='Access Control',
             category='Biometric + Face Reader', model_series='COSEC ARGO', unit_price=35000,
             license_type='None', expected_lifespan_years=7,
             keywords='face,biometric,300 face,mask detection', status='Active'),
        dict(sap_code='AC-ARGO-FAXM', product_name='COSEC ARGO FAXM', domain='Access Control',
             category='Fingerprint + RFID Reader', model_series='COSEC ARGO', unit_price=18000,
             license_type='None', expected_lifespan_years=7,
             keywords='fingerprint,rfid,biometric,access', status='Active'),
        dict(sap_code='AC-PATH-RFID', product_name='COSEC PATH RFID', domain='Access Control',
             category='RFID Card Reader', model_series='COSEC PATH', unit_price=8500,
             license_type='None', expected_lifespan_years=5,
             keywords='rfid,card reader,access', status='Active'),
        dict(sap_code='AC-ACS-SW', product_name='COSEC ACS Software', domain='Access Control',
             category='Access Control Software', model_series='COSEC ACS', deployment_type='On-Premise',
             unit_price=125000, license_type='Annual', expected_lifespan_years=5,
             keywords='access control software,acs,door license,management',
             industry_fit='Manufacturing,Pharma,IT,Banking,Government', status='Active'),
        # Time Attendance
        dict(sap_code='TA-VEGA-FAX', product_name='COSEC VEGA FAX', domain='Time Attendance',
             category='Face + Finger Terminal', model_series='COSEC VEGA', unit_price=22000,
             license_type='None', expected_lifespan_years=7,
             keywords='time attendance,face,finger,terminal', status='Active'),
        dict(sap_code='TA-ATOM', product_name='COSEC ATOM', domain='Time Attendance',
             category='Face + Finger Terminal', model_series='COSEC ATOM', unit_price=18000,
             license_type='None', expected_lifespan_years=7,
             keywords='attendance,atom,fingerprint,compact', status='Active'),
        dict(sap_code='TA-SAMAY', product_name='COSEC SAMAY', domain='Time Attendance',
             category='Time Attendance Software', model_series='COSEC SAMAY', deployment_type='On-Premise',
             unit_price=85000, license_type='Annual', expected_lifespan_years=5,
             keywords='time attendance software,samay,payroll,shift', status='Active'),
        dict(sap_code='TA-VISITOR', product_name='COSEC Visitor Management', domain='Time Attendance',
             category='Visitor Management', model_series='COSEC', unit_price=45000,
             license_type='Annual', expected_lifespan_years=5,
             keywords='visitor,management,gate pass,qr code', status='Active'),
        # Telecom
        dict(sap_code='TEL-VP206', product_name='VISIONPRO 206', domain='Telecom',
             category='IP PBX', model_series='VISIONPRO', unit_price=25000,
             license_type='None', expected_lifespan_years=7,
             keywords='pbx,ip pbx,6 port,small office', status='Active'),
        dict(sap_code='TEL-VP508', product_name='VISIONPRO 508', domain='Telecom',
             category='IP PBX', model_series='VISIONPRO', unit_price=45000,
             license_type='None', expected_lifespan_years=7,
             keywords='pbx,ip pbx,8 port,mid office', status='Active'),
        dict(sap_code='TEL-ETERNITY-GENX', product_name='ETERNITY GENX', domain='Telecom',
             category='Hybrid IP PBX', model_series='ETERNITY', unit_price=85000,
             license_type='None', expected_lifespan_years=7,
             keywords='hybrid pbx,gsm,analog,enterprise', status='Active'),
        dict(sap_code='TEL-PRASAR-UCS', product_name='PRASAR UCS', domain='Telecom',
             category='Unified Communications', model_series='PRASAR', deployment_type='On-Premise',
             unit_price=250000, license_type='Annual', expected_lifespan_years=5,
             keywords='unified communications,ucs,collaboration,video conferencing', status='Active'),
        dict(sap_code='TEL-SARVAM-UMG', product_name='SARVAM UMG GENX', domain='Telecom',
             category='GSM Gateway', model_series='SARVAM', unit_price=35000,
             license_type='None', expected_lifespan_years=7,
             keywords='gsm gateway,sim,mobile,voip', status='Active'),
        dict(sap_code='TEL-VDPX', product_name='VDPX Video Door Phone', domain='Telecom',
             category='Video Door Phone', model_series='VDPX', unit_price=12000,
             license_type='None', expected_lifespan_years=5,
             keywords='video door phone,vdp,intercom,entry', status='Active'),
        # Intrusion
        dict(sap_code='INT-VIGIL', product_name='VIGIL Intrusion Alarm Panel', domain='Intrusion Alarm',
             category='Intrusion Alarm Panel', model_series='VIGIL', unit_price=15000,
             license_type='None', expected_lifespan_years=7,
             keywords='intrusion,alarm,panel,burglary,security', status='Active'),
    ]
    objs = []
    for pd in products:
        p = Product(**pd)
        db.session.add(p)
        objs.append(p)
    db.session.commit()
    return {p.sap_code: p for p in objs}

def seed_accounts(zone_map, si_list, users):
    print("Seeding accounts...")
    accounts_data = load_json('accounts.json')
    sm_by_zone = {}
    for u in users:
        if u.role == 'Sales_manager' and u.zone_id:
            sm_by_zone[u.zone_id] = u

    accs = []
    for i, ad in enumerate(accounts_data):
        state = ad['state']
        zone_id = None
        for z in zone_map.values():
            if state in z.states:
                zone_id = z.zone_id
                break
        si = si_list[i % len(si_list)]
        sm = sm_by_zone.get(zone_id)
        acc = Account(
            account_name=ad['account_name'], industry=ad['industry'],
            city=ad['city'], state=state, zone_id=zone_id,
            si_id=si.si_id, sales_manager_id=sm.user_id if sm else None,
            contact_name=ad.get('contact_name'), contact_phone=ad.get('contact_phone'),
            account_type=ad.get('account_type', 'existing'),
            notes=ad.get('notes'),
            health_score=100, health_status='Healthy',
            created_by=users[0].user_id,
        )
        db.session.add(acc)
        accs.append(acc)
    db.session.commit()
    return accs

def seed_installed_products(accounts, product_map, users):
    print("Seeding installed products...")
    today = date.today()
    combos = [
        # (sap_code, version, age_yrs, lic_type, lic_offset_days, status)
        ('CAM-CIDR-2MP', None, 2.0, 'None', None, 'Active'),
        ('CAM-CIBR-5MP', None, 3.0, 'None', None, 'Active'),
        ('NVR-1601',     None, 3.0, 'None', None, 'Active'),
        ('AC-ACS-SW',    '4.1', 1.0, 'Annual', 45, 'Active'),
        ('VMS-SAMAS',    '2.5', 2.0, 'Annual', -10, 'Expired'),
        ('AC-ARGO-FACEM', None, 5.5, 'None', None, 'Active'),
        ('TA-SAMAY',     '3.0', 1.5, 'Annual', 80, 'Active'),
        ('CAM-ANPR-2MP', None, 1.0, 'None', None, 'Active'),
        ('TEL-ETERNITY-GENX', None, 6.0, 'None', None, 'Active'),
        ('TA-VEGA-FAX',  None, 2.0, 'None', None, 'Active'),
    ]
    install_objs = []
    for i, acc in enumerate(accounts):
        combo_a = combos[i % len(combos)]
        combo_b = combos[(i + 3) % len(combos)]
        for combo in [combo_a, combo_b]:
            sap, ver, age, lt, lic_off, lic_status = combo
            prod = product_map.get(sap)
            if not prod:
                continue
            inst_date = today - timedelta(days=int(age * 365))
            lic_exp = (today + timedelta(days=lic_off)) if lic_off is not None else None
            ip = InstalledProduct(
                account_id=acc.account_id, product_id=prod.product_id,
                sap_code=sap, quantity=max(1, (i % 4) + 1),
                installed_version=ver, install_date=inst_date,
                hardware_age_years=age, license_type=lt,
                license_expiry=lic_exp, license_status=lic_status,
                site_location='Head Office', added_by=users[0].user_id,
                warranty_expiry=inst_date + timedelta(days=365 * 3),
                amc_start_date=inst_date, amc_end_date=today + timedelta(days=90),
            )
            db.session.add(ip)
            install_objs.append(ip)
    db.session.commit()
    return install_objs

def seed_tickets(accounts, users):
    print("Seeding tickets...")
    priorities = ['Low', 'Medium', 'High', 'Critical']
    statuses = ['Open', 'In Progress', 'Resolved', 'Closed']
    categories = ['Hardware Fault', 'Software Bug', 'Configuration', 'Training', 'Upgrade']
    tickets = []
    for i, acc in enumerate(accounts):
        # First 5 accounts get >3 open tickets (critical trigger)
        n_open = 4 if i < 5 else 1
        for j in range(n_open):
            t = Ticket(
                account_id=acc.account_id,
                title=f'Issue #{j+1} - {categories[j % len(categories)]} at {acc.account_name}',
                description='Reported by client. Needs urgent attention.',
                priority=priorities[(i + j) % len(priorities)],
                status='Open', category=categories[j % len(categories)],
                raised_by=acc.contact_name or 'Client Contact',
                source='manual', assigned_to=users[1].user_id,
            )
            db.session.add(t)
            tickets.append(t)
        # Add some resolved tickets
        t2 = Ticket(
            account_id=acc.account_id,
            title=f'Resolved: Maintenance visit #{i}',
            priority='Low', status='Resolved',
            category='Configuration', raised_by=acc.contact_name or 'Client',
            resolved_on=datetime.utcnow(), source='manual',
        )
        db.session.add(t2)
        tickets.append(t2)
    db.session.commit()
    return tickets

def seed_visit_logs(accounts, users):
    print("Seeding visit logs...")
    today = date.today()
    for i, acc in enumerate(accounts):
        # Some accounts have visits older than 6 months
        days_ago = 200 if i % 4 == 0 else (30 + i * 5)
        visit_date = today - timedelta(days=days_ago)
        v = VisitLog(
            account_id=acc.account_id, visited_by=users[1].user_id,
            visit_type='SM Visit', visit_date=visit_date,
            notes='Quarterly review completed.', next_visit_date=visit_date + timedelta(days=90),
        )
        db.session.add(v)
        if acc.last_visit_date is None or visit_date > acc.last_visit_date:
            acc.last_visit_date = visit_date
    db.session.commit()

def seed_releases(product_map, users):
    print("Seeding releases...")
    releases_data = [
        dict(
            product_id=product_map['AC-ACS-SW'].product_id,
            product_name='COSEC ACS Software', domain='Access Control',
            category='Access Control Software', new_version='6.0',
            release_date=date(2025, 12, 1), release_title='COSEC ACS v6.0 - Major Update',
            description='New UI, enhanced biometric support, cloud sync.',
            highlights=['New dashboard', 'Mobile app integration', 'Multi-site support'],
            match_criteria={'product_name': 'COSEC ACS', 'older_than_version': '5.0',
                            'category': 'Access Control Software',
                            'industries': ['Manufacturing', 'Pharma', 'IT', 'Banking'],
                            'keywords': ['access', 'biometric']},
            added_by=users[0].user_id,
        ),
        dict(
            product_id=product_map['VMS-SAMAS'].product_id,
            product_name='SATATYA SAMAS VMS', domain='Video Surveillance',
            category='VMS', new_version='3.0',
            release_date=date(2025, 11, 15), release_title='SATATYA SAMAS VMS v3.0',
            description='AI analytics, ANPR integration, cloud backup.',
            highlights=['AI motion analytics', 'ANPR module', 'Failover NVR'],
            match_criteria={'product_name': 'SATATYA SAMAS', 'older_than_version': '3.0',
                            'domain': 'Video Surveillance',
                            'industries': ['Retail', 'Manufacturing', 'Logistics'],
                            'keywords': ['nvr', 'vms', 'surveillance']},
            added_by=users[0].user_id,
        ),
        dict(
            product_id=product_map['TEL-ETERNITY-GENX'].product_id,
            product_name='ETERNITY GENX IP PBX', domain='Telecom',
            category='Hybrid IP PBX', new_version='7.0',
            release_date=date(2025, 10, 1), release_title='ETERNITY GENX v7.0 - UC Ready',
            description='Unified Communications integration, WebRTC support.',
            highlights=['WebRTC softphone', 'CRM integration', 'Call recording'],
            match_criteria={'product_name': 'ETERNITY GENX', 'older_than_version': '7.0',
                            'domain': 'Telecom',
                            'hardware_age_gt_years': 4,
                            'industries': ['IT', 'Banking', 'Healthcare']},
            added_by=users[0].user_id,
        ),
    ]
    import json
    rel_objs = []
    for rd in releases_data:
        mc = rd.pop('match_criteria')
        hl = rd.pop('highlights')
        r = SoftwareRelease(**rd, match_criteria=json.dumps(mc))
        r.highlights = hl
        db.session.add(r)
        rel_objs.append(r)
    db.session.commit()
    return rel_objs

def main():
    with app.app_context():
        print("Dropping and recreating all tables...")
        db.drop_all()
        db.create_all()

        zone_map = seed_zones()
        users = seed_users(zone_map)
        si_list = seed_si_partners(zone_map)
        product_map = seed_products()
        accounts = seed_accounts(zone_map, si_list, users)
        install_objs = seed_installed_products(accounts, product_map, users)
        seed_tickets(accounts, users)
        seed_visit_logs(accounts, users)
        releases = seed_releases(product_map, users)

        print("Syncing renewal records...")
        for acc in accounts:
            sync_renewal_records_for_account(acc.account_id)

        print("Recalculating health scores...")
        for acc in accounts:
            recalculate_account_health(acc.account_id, triggered_by='cron')

        print("Computing release matches...")
        for rel in releases:
            compute_matches(rel.release_id)

        print(f"\n[SUCCESS] Seed complete!")
        print(f"   Zones: {len(zone_map)}")
        print(f"   Users: {len(users)} (admin + 5 SMs)")
        print(f"   Products: {len(product_map)}")
        print(f"   Accounts: {len(accounts)}")
        print(f"   Installed products: {len(install_objs)}")
        print(f"   Releases: {len(releases)}")
        print(f"\n   Login: admin@matrix.com / Matrix@123")

if __name__ == '__main__':
    main()
