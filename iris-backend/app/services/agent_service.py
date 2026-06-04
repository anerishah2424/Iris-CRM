"""Agent service — mock implementations for dev."""
import json
import logging
from datetime import datetime
from app.extensions import db
from app.models.agent_run import AgentRun
from app.models.account import Account
from app.models.installed_product import InstalledProduct
from app.models.ticket import Ticket

logger = logging.getLogger(__name__)


def _create_run(run_type, account_id, user_id, input_payload):
    run = AgentRun(
        run_type=run_type,
        account_id=account_id,
        initiated_by=user_id,
        status='running',
        input_payload=json.dumps(input_payload),
    )
    db.session.add(run)
    db.session.flush()
    return run


def _complete_run(run, output):
    run.status = 'completed'
    run.output_payload = json.dumps(output)
    run.completed_at = datetime.utcnow()
    run.duration_ms = int((run.completed_at - run.started_at).total_seconds() * 1000)
    db.session.commit()


def run_market_analysis(account_id: int, user_id: int) -> dict:
    account = Account.query.get(account_id)
    if not account:
        raise ValueError('Account not found')
    ips = InstalledProduct.query.filter_by(account_id=account_id).all()
    installed_names = [ip.product.product_name for ip in ips if ip.product]
    run = _create_run('market_analysis', account_id, user_id, {'account_id': account_id})
    output = {
        'run_id': run.run_id,
        'analysis': {
            'account_summary': f'{account.account_name}, {account.city} — {account.industry}',
            'expansion_signals': [
                'Potential expansion based on industry growth trends',
                f'Operating in {account.state} — high-growth corridor',
            ],
            'recommended_products': [
                {
                    'product_name': 'SATATYA ANPR Camera',
                    'priority': 'HIGH',
                    'source': 'industry_analysis',
                    'reason': 'Logistics/warehouse operations benefit from ANPR',
                    'suggested_quantity': 4,
                },
                {
                    'product_name': 'COSEC ARGO FACE300M',
                    'priority': 'MEDIUM',
                    'source': 'compliance_signal',
                    'reason': 'Biometric access control for secure areas',
                    'suggested_quantity': 2,
                },
            ],
            'risk_flags': [f'Installed: {", ".join(installed_names[:3]) or "None"}'],
            'suggested_next_action': 'Schedule quarterly review and demo new products',
        },
    }
    _complete_run(run, output)
    return output


def run_proposal(account_id: int, user_id: int, focus_products=None, notes='') -> dict:
    account = Account.query.get(account_id)
    if not account:
        raise ValueError('Account not found')
    run = _create_run('existing_proposal', account_id, user_id,
                      {'account_id': account_id, 'focus_products': focus_products or [], 'notes': notes})
    output = {
        'run_id': run.run_id,
        'proposal': {
            'prepared_for': account.account_name,
            'prepared_by': 'Matrix Comsec IRIS System',
            'date': datetime.utcnow().strftime('%Y-%m-%d'),
            'sections': [
                {
                    'title': 'Executive Summary',
                    'content': f'Proposal for {account.account_name} to enhance security infrastructure.',
                },
                {
                    'title': 'Recommended Products',
                    'items': [
                        {
                            'product_name': 'SATATYA CIDR 2MP',
                            'quantity': 10,
                            'unit_price': 8500,
                            'total': 85000,
                            'justification': 'HD perimeter surveillance',
                        },
                        {
                            'product_name': 'COSEC ACS (10 doors)',
                            'quantity': 1,
                            'unit_price': 125000,
                            'total': 125000,
                            'justification': 'Access control for secure zones',
                        },
                    ],
                },
                {
                    'title': 'Total Investment',
                    'subtotal': 210000,
                    'gst_note': 'GST applicable as per prevailing rates',
                },
            ],
        },
    }
    _complete_run(run, output)
    return output


def run_prospect_analysis(prospect_data: dict, user_id: int) -> dict:
    run = _create_run('prospect_analysis', None, user_id, prospect_data)
    output = {
        'run_id': run.run_id,
        'analysis': {
            'company': prospect_data.get('company_name'),
            'industry': prospect_data.get('industry'),
            'recommendations': [
                {
                    'product_name': 'SATATYA CIDR 5MP',
                    'priority': 'HIGH',
                    'reason': f'Ideal for {prospect_data.get("industry", "enterprise")} environments',
                    'suggested_quantity': 6,
                },
                {
                    'product_name': 'COSEC VEGA FAX',
                    'priority': 'HIGH',
                    'reason': 'Time-attendance for workforce management',
                    'suggested_quantity': 4,
                },
            ],
            'competitive_analysis': 'Matrix offers superior value vs competitors with local support',
            'suggested_next_action': 'Send introductory email and schedule demo',
        },
    }
    _complete_run(run, output)
    return output


def run_prospect_proposal(prospect_data: dict, recommendations: list, user_id: int) -> dict:
    run = _create_run('prospect_proposal', None, user_id,
                      {'prospect': prospect_data, 'recommendations': recommendations})
    output = {
        'run_id': run.run_id,
        'proposal': {
            'prepared_for': prospect_data.get('company_name'),
            'date': datetime.utcnow().strftime('%Y-%m-%d'),
            'sections': [
                {
                    'title': 'About Matrix Comsec',
                    'content': 'Leading Indian manufacturer of IP Video Surveillance, Access Control, and Telecom products.',
                },
                {
                    'title': 'Proposed Solution',
                    'items': recommendations or [
                        {'product_name': 'SATATYA CIDR 5MP', 'quantity': 6, 'unit_price': 12000, 'total': 72000},
                    ],
                },
            ],
        },
    }
    _complete_run(run, output)
    return output
