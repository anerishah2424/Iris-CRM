#!/usr/bin/env python3
"""
Enterprise Market Researching AI Agent - Working Prototype
Generates latest news and information for prospective clients
"""

import asyncio
from typing import Dict, List, Any, Optional, TypedDict
from dataclasses import dataclass, asdict
import json
import google.generativeai as genai


@dataclass
class ClientInfo:
    company_name: str
    industry: str
    company_size: str
    location: Dict[str, Any]
    budget_range: Optional[str] = None

@dataclass
class ClientInsight:
    recent_news: List[Dict[str, str]]
    expansion_signals: List[str]
    risk_factors: List[str]
    talking_points: List[str]


class GeminiClient:
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemma-3-4b-it")

    async def generate_json(self, prompt: str, temperature=0.3):
        response = self.model.generate_content(
            prompt,
            generation_config={
                "temperature": temperature,
            }
        )

        text = response.text
        try:
            return json.loads(text)
        except:
            # fallback if model adds extra text
            start = text.find("{")
            end = text.rfind("}") + 1
            return json.loads(text[start:end])


class MarketResearchEngine:
    """Gather external intelligence"""
    
    def __init__(self, gemini_client):
        self.client = gemini_client
    
    async def research(self, client_info: ClientInfo) -> ClientInsight:
        """Generate insights"""
        
        prompt = f"""
You are a market intelligence analyst generating realistic, up-to-date business insights.

Company: {client_info["company_name"]}
Industry: {client_info["industry"]}

Instructions:
- Focus on RECENT (last 6–12 months) developments and signals.
- Avoid generic statements; include specific, plausible details (markets, products, regions, partnerships, funding, etc.).
- If exact real-world data is uncertain, generate HIGHLY PLAUSIBLE insights based on industry trends — do NOT hallucinate precise facts like exact dates or fabricated sources.
- Keep insights concise but information-dense.
- Ensure each item is distinct and non-overlapping.

Return ONLY valid JSON in this exact structure:
{{
  "recent_news": [
    {{
      "title": "...",
      "snippet": "...",
      "relevance": "Why this matters for growth/strategy"
    }}
  ],
  "expansion_signals": [
    "Specific signal indicating expansion (e.g., hiring, new geography, product launch)"
  ],
  "risk_factors": [
    "Concrete business risk (market, regulatory, competitive, operational)"
  ],
  "talking_points": [
    "Insightful, conversation-ready point for sales/strategy discussions"
  ]
}}

Constraints:
- 2–3 items per section
- No fluff, no buzzwords
- No placeholders
- No markdown, no explanations outside JSON
"""
        try:
            response = await self.client.generate_json(
                prompt,
                temperature=0.1,
            )

            return ClientInsight(
                recent_news=response.get('recent_news', []),
                expansion_signals=response.get('expansion_signals', []),
                risk_factors=response.get('risk_factors', []),
                talking_points=response.get('talking_points', [])
            )
        except Exception as e:
            return ClientInsight(recent_news=[], expansion_signals=[], risk_factors=[], talking_points=[])


# ============================================================================
# ORCHESTRATOR
# ============================================================================

class ResearchOrchestrator:
    """Main orchestrator"""
    
    def __init__(self, api_key: str):
        self.client = GeminiClient(api_key=api_key)
        self.market_researcher = MarketResearchEngine(self.client)

    async def research_information(self, state: ClientInfo) -> ClientInsight:
        """Execute workflow"""
        
        state['status'] = 'processing'
        state['errors'] = []
        
        try:
            state = await self.market_researcher.research(state)
            
        except Exception as e:
            print(f"\n FATAL ERROR: {e}")
            state['status'] = 'failed'
            state['errors'].append(str(e))
        
        return state


# ============================================================================
# MAIN
# ============================================================================

async def main(data=None):
    """Main execution"""
    
    api_key = "AIzaSyBu8T9m8EJPCXGHK"

    if not api_key:
        print(" GEMINI_API_KEY not set")
        return
    
    orchestrator = ResearchOrchestrator(api_key)
    
    if data:
        client_list = data
    else:
        client_list = {
            "company_name": "Unknown Company",
            "industry": "General",
            "company_size": "Mid-sized",
            "location": {"state": "N/A", "city": "N/A"},
            "budget_range": "Unknown"
        }

    final_state = await orchestrator.research_information(client_list)
    return final_state


def run_market_research(client_details):
    result = asyncio.run(main(client_details))
    
    if result:
        print(f"SUCCESS! Research completed for: {client_details.get('company_name', 'Unknown')}")
        return result
    return None
