"""Agent endpoints blueprint."""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.models.account import Account
from app.models.agent_run import AgentRun
from app.middleware.scope import get_current_user, scoped_accounts_query
from app.utils.responses import success_response, error_response
from app.services import agent_service

agent_bp = Blueprint('agent', __name__)


@agent_bp.route('/runs', methods=['GET'])
@jwt_required()
def list_runs():
    """List agent runs — filtered by account_id and/or run_type."""
    account_id = request.args.get('account_id', type=int)
    run_type = request.args.get('run_type')
    limit = request.args.get('limit', 10, type=int)

    query = AgentRun.query
    if account_id:
        query = query.filter_by(account_id=account_id)
    if run_type:
        query = query.filter_by(run_type=run_type)
    query = query.order_by(AgentRun.started_at.desc()).limit(limit)
    runs = query.all()
    return success_response([r.to_dict() for r in runs])


@agent_bp.route('/run', methods=['POST'])
@jwt_required()
def run_agent():
    """Unified agent run endpoint: run_type + account_id."""
    current_user = get_current_user()
    data = request.get_json(silent=True) or {}
    run_type = data.get('run_type', '')
    account_id = data.get('account_id')

    try:
        if run_type == 'market_analysis':
            if not account_id:
                return error_response('VALIDATION_ERROR', 'account_id is required', 400)
            result = agent_service.run_market_analysis(account_id, current_user.user_id)
        elif run_type in ('proposal', 'existing_proposal'):
            if not account_id:
                return error_response('VALIDATION_ERROR', 'account_id is required', 400)
            result = agent_service.run_proposal(
                account_id, current_user.user_id,
                focus_products=data.get('focus_products', []),
                notes=data.get('notes', ''),
            )
        else:
            return error_response('VALIDATION_ERROR', f'Unknown run_type: {run_type}', 400)
        return success_response(result)
    except Exception as e:
        return error_response('AGENT_ERROR', str(e), 500)


@agent_bp.route('/prospect', methods=['POST'])
@agent_bp.route('/prospects/analyze', methods=['POST'])
@jwt_required()
def prospect_analyze():
    """Prospect analysis — alias routes for compatibility."""
    current_user = get_current_user()
    data = request.get_json(silent=True) or {}
    required = ('company_name', 'industry')
    for f in required:
        if not data.get(f):
            return error_response('VALIDATION_ERROR', f'{f} is required', 400)
    try:
        result = agent_service.run_prospect_analysis(data, current_user.user_id)
        # Return the nested analysis directly so the frontend can consume it
        return success_response(result.get('analysis', result))
    except Exception as e:
        return error_response('AGENT_ERROR', str(e), 500)


@agent_bp.route('/prospects/proposal', methods=['POST'])
@jwt_required()
def prospect_proposal():
    current_user = get_current_user()
    data = request.get_json(silent=True) or {}
    try:
        result = agent_service.run_prospect_proposal(
            data.get('prospect', {}),
            data.get('recommendations', []),
            current_user.user_id,
        )
        return success_response(result)
    except Exception as e:
        return error_response('AGENT_ERROR', str(e), 500)


@agent_bp.route('/accounts/<int:account_id>/market-analysis', methods=['POST'])
@jwt_required()
def market_analysis(account_id):
    current_user = get_current_user()
    account = scoped_accounts_query(
        Account.query.filter_by(is_deleted=False, account_id=account_id), current_user
    ).first()
    if not account:
        return error_response('NOT_FOUND', 'Account not found', 404)
    try:
        result = agent_service.run_market_analysis(account_id, current_user.user_id)
        return success_response(result)
    except Exception as e:
        return error_response('AGENT_ERROR', str(e), 500)


@agent_bp.route('/accounts/<int:account_id>/proposal', methods=['POST'])
@jwt_required()
def proposal(account_id):
    current_user = get_current_user()
    account = scoped_accounts_query(
        Account.query.filter_by(is_deleted=False, account_id=account_id), current_user
    ).first()
    if not account:
        return error_response('NOT_FOUND', 'Account not found', 404)
    data = request.get_json(silent=True) or {}
    try:
        result = agent_service.run_proposal(
            account_id, current_user.user_id,
            focus_products=data.get('focus_products', []),
            notes=data.get('notes', ''),
        )
        return success_response(result)
    except Exception as e:
        return error_response('AGENT_ERROR', str(e), 500)


@agent_bp.route('/runs/<int:run_id>', methods=['GET'])
@jwt_required()
def get_run(run_id):
    run = AgentRun.query.get(run_id)
    if not run:
        return error_response('NOT_FOUND', 'Agent run not found', 404)
    return success_response(run.to_dict())
