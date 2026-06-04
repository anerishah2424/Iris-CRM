"""
Comprehensive seed enhancer — adds tickets, renewals, visit logs,
and health score history across all 40 accounts.
Run AFTER user_seed.py has seeded the base data.
"""
import sys, os, json, random
from datetime import datetime, date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.extensions import db
from app.models.account import Account
from app.models.installed_product import InstalledProduct
from app.models.ticket import Ticket
from app.models.renewal import Renewal
from app.models.visit_log import VisitLog
from app.models.health_score import HealthScoreLog
from app.models.user import User
from app.services import health_service

app = create_app('development')
random.seed(42)

TODAY = date.today()

TICKET_ISSUES = [
    ("IP camera firmware update failed", "IPVS", "Hardware Fault"),
    ("SAMAS software login error", "IPVS", "Software Bug"),
    ("NVR storage running at 95% capacity", "IPVS", "Configuration"),
    ("EIVA analytics false alarm rate high", "IPVS", "Software Bug"),
    ("ANPR recognition accuracy below 85%", "IPVS", "Software Bug"),
    ("Camera feed intermittent disconnection", "IPVS", "Hardware Fault"),
    ("License dongle not detected after reboot", "IPVS", "Hardware Fault"),
    ("PTZ preset positions drifting", "IPVS", "Hardware Fault"),
    ("Video wall display output flickering", "IPVS", "Configuration"),
    ("COSEC door controller offline", "ACTA", "Hardware Fault"),
    ("Face recognition false rejects", "ACTA", "Software Bug"),
    ("Biometric reader not enrolling", "ACTA", "Hardware Fault"),
    ("Access control audit log gap", "ACTA", "Software Bug"),
    ("CENTRA platform sync failure", "ACTA", "Configuration"),
    ("Time attendance report mismatch", "ACTA", "Software Bug"),
    ("Visitor management kiosk crash", "ACTA", "Software Bug"),
    ("Door lock relay not responding", "ACTA", "Hardware Fault"),
    ("Card reader firmware mismatch", "ACTA", "Configuration"),
    ("Fire alarm integration not triggering", "ACTA", "Configuration"),
    ("Turnstile gate jammed", "ACTA", "Hardware Fault"),
]

RAISERS = ["Rajesh K.", "Meera J.", "Vikas T.", "Deepak R.", "Sunita M.",
           "Amit P.", "Priya S.", "Rohan G.", "Kavita N.", "Suresh B."]
SOURCES = ["On-Site", "Phone", "Email", "Portal"]
PRIORITIES = ["Low", "Medium", "Medium", "High", "High", "Critical"]
STATUSES = ["Open", "In Progress", "Resolved", "Closed"]

VISIT_TYPES = ["SM Visit", "SI Visit", "Demo", "Support", "Review"]
VISIT_NOTES = [
    "Discussed upgrade plan for SATATYA cameras",
    "Reviewed COSEC access control expansion",
    "Demo of VYOM cloud platform",
    "Technical support for NVR configuration",
    "Quarterly business review with IT head",
    "License renewal discussion",
    "New requirement for parking ANPR",
    "Attended security audit meeting",
    "Site survey for additional camera locations",
    "Training session for new CENTRA users",
]


def seed_tickets(accounts, users):
    """Create 80-120 tickets across accounts with varied statuses."""
    print("Seeding tickets...")
    Ticket.query.delete()
    db.session.commit()

    user_ids = [u.user_id for u in users]
    tickets_created = 0

    for acc in accounts:
        count = random.randint(0, 6)
        for _ in range(count):
            issue, domain, category = random.choice(TICKET_ISSUES)
            days_ago = random.randint(1, 400)
            created = TODAY - timedelta(days=days_ago)
            status = random.choice(STATUSES)
            priority = random.choice(PRIORITIES)

            resolved = None
            if status in ("Resolved", "Closed"):
                resolved = created + timedelta(days=random.randint(1, 30))

            sla_breach = status == "Open" and days_ago > 14

            t = Ticket(
                ticket_ref=f"TKT{20000 + tickets_created}",
                account_id=acc.account_id,
                title=f"{issue} at {acc.account_name}",
                description=f"Reported issue with {domain} system: {issue}",
                priority=priority,
                status=status,
                category=category,
                raised_by=random.choice(RAISERS),
                source=random.choice(SOURCES),
                raised_on=datetime.combine(created, datetime.min.time()),
                resolved_on=datetime.combine(resolved, datetime.min.time()) if resolved else None,
                sla_breach=sla_breach,
                assigned_to=random.choice(user_ids),
            )
            db.session.add(t)
            tickets_created += 1

    db.session.commit()
    print(f"  Created {tickets_created} tickets")
    return tickets_created


def seed_renewals(accounts):
    """Create renewals for installed products with license expiry."""
    print("Seeding renewals...")
    Renewal.query.delete()
    db.session.commit()

    renewals_created = 0
    for acc in accounts:
        ips = InstalledProduct.query.filter_by(account_id=acc.account_id).all()
        for ip in ips:
            if ip.license_expiry:
                # License renewal
                days_to = (ip.license_expiry - TODAY).days
                if days_to < 0:
                    rstatus = "Overdue"
                elif days_to <= 30:
                    rstatus = "Due Soon"
                elif days_to <= 90:
                    rstatus = "Upcoming"
                else:
                    rstatus = "Upcoming"

                r = Renewal(
                    account_id=acc.account_id,
                    install_id=ip.install_id,
                    renewal_type="License",
                    expiry_date=ip.license_expiry,
                    renewal_status=rstatus,
                    reminder_status="Pending" if rstatus != "Renewed" else "Closed",
                )
                db.session.add(r)
                renewals_created += 1

            # AMC renewal for some hardware
            if ip.category == "HARDWARE" and random.random() < 0.3:
                amc_exp = TODAY + timedelta(days=random.randint(-60, 180))
                days_to = (amc_exp - TODAY).days
                if days_to < 0:
                    rstatus = "Overdue"
                elif days_to <= 30:
                    rstatus = "Due Soon"
                else:
                    rstatus = "Upcoming"

                r = Renewal(
                    account_id=acc.account_id,
                    install_id=ip.install_id,
                    renewal_type="AMC",
                    expiry_date=amc_exp,
                    renewal_status=rstatus,
                    reminder_status="Pending",
                )
                db.session.add(r)
                renewals_created += 1

    db.session.commit()
    print(f"  Created {renewals_created} renewals")
    return renewals_created


def seed_visits(accounts, users):
    """Create visit logs so dashboard shows engagement data."""
    print("Seeding visit logs...")
    VisitLog.query.delete()
    db.session.commit()

    user_ids = [u.user_id for u in users if u.role == "Sales_manager"]
    visits_created = 0

    for acc in accounts:
        count = random.randint(0, 4)
        for _ in range(count):
            days_ago = random.randint(5, 365)
            vdate = TODAY - timedelta(days=days_ago)
            v = VisitLog(
                account_id=acc.account_id,
                visited_by=random.choice(user_ids) if user_ids else None,
                visit_type=random.choice(VISIT_TYPES),
                visit_date=vdate,
                notes=random.choice(VISIT_NOTES),
                next_visit_date=vdate + timedelta(days=random.randint(30, 90)),
            )
            db.session.add(v)
            visits_created += 1

        # Update last_visit_date on account
        if count > 0:
            latest = TODAY - timedelta(days=random.randint(5, 200))
            acc.last_visit_date = latest

    db.session.commit()
    print(f"  Created {visits_created} visit logs")
    return visits_created


def recalculate_health(accounts):
    """Recalculate and create health history for all accounts."""
    print("Recalculating health scores...")
    HealthScoreLog.query.delete()
    db.session.commit()

    for acc in accounts:
        # Create fake historical entries (3-5 per account)
        for i in range(random.randint(2, 5)):
            days_ago = (i + 1) * random.randint(20, 60)
            fake_score = random.randint(40, 100)
            if fake_score >= 75:
                fake_status = "Healthy"
            elif fake_score >= 45:
                fake_status = "At-Risk"
            else:
                fake_status = "Critical"

            log = HealthScoreLog(
                account_id=acc.account_id,
                score_before=fake_score + random.randint(-10, 10),
                score_after=fake_score,
                status_before=random.choice(["Healthy", "At-Risk", "Critical"]),
                status_after=fake_status,
                triggered_by="cron",
                recalculated_at=datetime.combine(
                    TODAY - timedelta(days=days_ago), datetime.min.time()
                ),
                breakdown=json.dumps({"base_score": 100, "total_deduction": 100 - fake_score,
                                       "deductions": [], "ticket_count": 0,
                                       "license_expiry_deduction": 0}),
            )
            db.session.add(log)
        db.session.commit()

    # Now do real recalculation
    for acc in accounts:
        try:
            health_service.recalculate_account_health(acc.account_id, triggered_by="seed")
        except Exception as e:
            print(f"  WARN: Health calc failed for {acc.account_id}: {e}")

    print("  Health scores recalculated for all accounts")


def seed_releases(users):
    """Seed some software releases to show the functionality."""
    print("Seeding software releases...")
    from app.models.release import SoftwareRelease
    SoftwareRelease.query.delete()
    db.session.commit()

    manager = next((u for u in users if u.role == 'matrix_manager'), None)
    mgr_id = manager.user_id if manager else 1

    releases = [
        {
            'product_name': 'SATATYA NVR',
            'domain': 'Video Surveillance',
            'version': '3.5.2',
            'title': 'SATATYA NVR 3.5.2 — AI Analytics Update',
            'desc': 'This update brings advanced AI analytics including intruder detection and loitering to all v3 models.',
            'highlights': ['Advanced AI Analytics', 'Fixed playback lag on 4K streams', 'Support for new IP cameras'],
            'criteria': {'product_name': 'SATATYA NVR'}
        },
        {
            'product_name': 'COSEC CENTRA',
            'domain': 'Access Control',
            'version': '12.4.0',
            'title': 'COSEC CENTRA 12.4 — Performance & Security Patch',
            'desc': 'Major security update for the central platform and database performance improvements.',
            'highlights': ['Database optimization for 10k+ users', 'Enhanced SSL/TLS security', 'Mobile app sync speed increased'],
            'criteria': {'product_name': 'COSEC CENTRA'}
        },
        {
            'product_name': 'COSEC ARGO',
            'domain': 'Access Control',
            'version': '2.1.0',
            'title': 'COSEC ARGO v2.1 — Face Recognition Improvement',
            'desc': 'Significantly improved face recognition accuracy in low-light conditions.',
            'highlights': ['Low-light accuracy +20%', 'Liveness detection update', 'UI/UX polish on device screen'],
            'criteria': {'product_name': 'COSEC ARGO'}
        }
    ]

    for rel in releases:
        sr = SoftwareRelease(
            product_name=rel['product_name'],
            domain=rel['domain'],
            new_version=rel['version'],
            release_date=TODAY - timedelta(days=random.randint(2, 30)),
            release_title=rel['title'],
            description=rel['desc'],
            highlights=rel['highlights'],
            match_criteria=json.dumps(rel['criteria']),
            added_by=mgr_id
        )
        db.session.add(sr)
    
    db.session.commit()
    print(f"  Created {len(releases)} software releases")

def main():
    with app.app_context():
        accounts = Account.query.filter_by(is_deleted=False).all()
        users = User.query.all()

        print(f"\nEnhancing {len(accounts)} accounts...\n")

        tc = seed_tickets(accounts, users)
        rc = seed_renewals(accounts)
        vc = seed_visits(accounts, users)
        seed_releases(users)
        recalculate_health(accounts)

        # Print summary stats
        open_t = Ticket.query.filter(Ticket.status.in_(("Open", "In Progress"))).count()
        critical_t = Ticket.query.filter(
            Ticket.status.in_(("Open", "In Progress")),
            Ticket.priority == "Critical"
        ).count()
        due_30 = Renewal.query.filter(
            Renewal.expiry_date >= TODAY,
            Renewal.expiry_date <= TODAY + timedelta(days=30)
        ).count()
        overdue = Renewal.query.filter(Renewal.renewal_status == "Overdue").count()

        critical_accs = Account.query.filter_by(health_status="Critical", is_deleted=False).count()
        at_risk_accs = Account.query.filter_by(health_status="At-Risk", is_deleted=False).count()
        healthy_accs = Account.query.filter_by(health_status="Healthy", is_deleted=False).count()

        print(f"\n{'='*50}")
        print(f" SEED ENHANCEMENT COMPLETE")
        print(f"{'='*50}")
        print(f" Tickets:     {tc} total, {open_t} open, {critical_t} critical")
        print(f" Renewals:    {rc} total, {due_30} due in 30d, {overdue} overdue")
        print(f" Visit Logs:  {vc}")
        print(f" Health:      {healthy_accs} healthy, {at_risk_accs} at-risk, {critical_accs} critical")
        print(f"{'='*50}\n")


if __name__ == "__main__":
    main()
