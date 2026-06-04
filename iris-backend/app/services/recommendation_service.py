"""Product recommendation service."""
import logging
from typing import List, Dict, Any

from app.models.account import Account
from app.models.installed_product import InstalledProduct
from app.models.product import Product
from app.models.product_knowledge_base import ProductKnowledgeBase

logger = logging.getLogger(__name__)


def score_recommendation(account, installed, kb_entry) -> int:
    score = 0
    if account.industry and account.industry in kb_entry.industry_fit:
        score += 3
    if account.notes:
        notes_lower = account.notes.lower()
        for kw in kb_entry.trigger_keywords:
            if kw.lower() in notes_lower:
                score += 2
                break
    if installed and installed.product:
        comp_ids = [str(c) for c in kb_entry.complementary_ids]
        if str(installed.product_id) in comp_ids:
            score += 2
    return score + kb_entry.priority_weight


def get_recommendations(account_id: int) -> List[Dict[str, Any]]:
    account = Account.query.get(account_id)
    if not account:
        return []
    installed = InstalledProduct.query.filter_by(account_id=account_id).all()
    installed_product_ids = {ip.product_id for ip in installed}
    kb_entries = ProductKnowledgeBase.query.all()
    scored = []
    for kb in kb_entries:
        if kb.product_id in installed_product_ids:
            continue
        product = Product.query.get(kb.product_id)
        if not product or product.status != 'Active':
            continue
        best_score = max((score_recommendation(account, ip, kb) for ip in installed), default=0)
        if best_score > 0:
            scored.append({
                'product_id': product.product_id,
                'product_name': product.product_name,
                'domain': product.domain,
                'category': product.category,
                'unit_price': float(product.unit_price) if product.unit_price else None,
                'use_cases': kb.use_cases,
                'score': best_score,
            })
    scored.sort(key=lambda x: x['score'], reverse=True)
    return scored[:10]
