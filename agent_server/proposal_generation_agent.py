#!/usr/bin/env python3
"""
Enterprise Proposal Generation AI Agent - Working Prototype
Generates professional sales proposals for security & telecom solutions
"""

import json
import os
import asyncio
import math
from datetime import datetime
from typing import Dict, List, Any, Optional, TypedDict
from dataclasses import dataclass, asdict
from enum import Enum

# For geometric calculations
from shapely.geometry import Point, Polygon

# For LLM calls
import google.generativeai as genai
import json

class GeminiClient:
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemma-3-1b-it")

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



# ============================================================================
# DATA MODELS
# ============================================================================

@dataclass
class ClientInfo:
    company_name: str
    industry: str
    company_size: str
    location: Dict[str, Any]
    budget_range: Optional[str] = None


@dataclass
class Requirement:
    category: str
    description: str
    priority: str
    technical_specs: Dict[str, Any]
    quantity_estimate: Optional[int] = None


@dataclass
class SiteDetails:
    site_id: str
    coordinates: Dict[str, float]
    area_sqm: float
    zones: List[Dict[str, Any]]
    environment: str


@dataclass
class ProductRecommendation:
    # product_id: str
    product_name: str
    category: str
    quantity: int
    unit_price: float
    justification: str
    technical_fit_score: float


@dataclass
class CameraPlacement:
    x: float
    y: float
    coverage_radius: float
    zone: str
    mounting_height: float = 3.0


@dataclass
class MapAnalysis:
    total_devices_needed: int
    placement_suggestions: List[CameraPlacement]
    coverage_percentage: float
    blind_spots: List[Dict[str, Any]]


@dataclass
class ClientInsight:
    recent_news: List[Dict[str, str]]
    expansion_signals: List[str]
    risk_factors: List[str]
    talking_points: List[str]


@dataclass
class PricingSummary:
    subtotal_products: float
    installation_cost: float
    maintenance_annual: float
    total_investment: float
    sla_tier: str


class ProposalState(TypedDict):
    client_info: ClientInfo
    requirements: List[Requirement]
    site_details: List[SiteDetails]
    parsed_requirements: Optional[List[Requirement]]
    product_recommendations: Optional[List[ProductRecommendation]]
    map_analysis: Optional[List[MapAnalysis]]
    client_insights: Optional[ClientInsight]
    pricing: Optional[PricingSummary]
    proposal_content: Optional[Dict[str, Any]]
    status: str
    errors: List[str]


# ============================================================================
# SAMPLE PRODUCT DATABASE
# ============================================================================

PRODUCT_DATABASE = [
    {
        "product_id": "CAM-4K-DOME-001",
        "product_name": "4K Ultra HD Dome Camera",
        "category": "security",
        "subcategory": "camera",
        "unit_price": 450.00,
        "technical_specs": {
            "resolution": "4K (3840x2160)",
            "coverage_range_meters": 30,
            "environment": "indoor/outdoor",
            "power": "PoE",
            "night_vision": True,
            "weatherproof": "IP67"
        },
        "description": "Professional 4K dome camera with advanced night vision and weather resistance"
    },
    {
        "product_id": "CAM-PTZ-PRO-002",
        "product_name": "PTZ Pro Security Camera",
        "category": "security",
        "subcategory": "camera",
        "unit_price": 1200.00,
        "technical_specs": {
            "resolution": "1080p",
            "coverage_range_meters": 50,
            "environment": "outdoor",
            "power": "PoE+",
            "pan_tilt_zoom": True,
            "weatherproof": "IP66"
        },
        "description": "Pan-Tilt-Zoom camera for large area coverage with remote control"
    },
    {
        "product_id": "ACCESS-CTRL-001",
        "product_name": "Smart Access Control Panel",
        "category": "security",
        "subcategory": "access_control",
        "unit_price": 850.00,
        "technical_specs": {
            "max_doors": 4,
            "card_readers": 8,
            "biometric_support": True,
            "network": "Ethernet",
            "power": "12V DC"
        },
        "description": "Advanced access control system with biometric and card reader support"
    },
    {
        "product_id": "NVR-64CH-001",
        "product_name": "64-Channel Network Video Recorder",
        "category": "security",
        "subcategory": "nvr",
        "unit_price": 2800.00,
        "technical_specs": {
            "channels": 64,
            "storage": "Up to 96TB",
            "resolution_support": "Up to 4K",
            "recording_modes": ["continuous", "motion", "scheduled"],
            "redundancy": "RAID 5/6"
        },
        "description": "Enterprise-grade NVR for centralized video management and storage"
    },
    {
        "product_id": "SWITCH-POE-24-001",
        "product_name": "24-Port PoE+ Managed Switch",
        "category": "networking",
        "subcategory": "switch",
        "unit_price": 650.00,
        "technical_specs": {
            "ports": 24,
            "poe_budget": "370W",
            "uplink": "4x 10G SFP+",
            "management": "Layer 3",
            "power": "AC"
        },
        "description": "High-performance PoE switch for powering IP cameras and access points"
    },
    {
        "product_id": "INTERCOM-IP-001",
        "product_name": "IP Video Intercom System",
        "category": "telecom",
        "subcategory": "intercom",
        "unit_price": 950.00,
        "technical_specs": {
            "video": "1080p",
            "audio": "2-way",
            "network": "IP/SIP",
            "touchscreen": "7-inch",
            "integration": "Access control compatible"
        },
        "description": "Modern IP-based video intercom with touchscreen interface"
    },
    {
        "product_id": "PHONE-VoIP-001",
        "product_name": "Enterprise VoIP Phone",
        "category": "telecom",
        "subcategory": "phone",
        "unit_price": 185.00,
        "technical_specs": {
            "lines": 6,
            "display": "Color LCD",
            "protocol": "SIP",
            "poe": True,
            "hd_audio": True
        },
        "description": "Professional VoIP desk phone with HD audio quality"
    },
    {
        "product_id": "FIREWALL-ENT-001",
        "product_name": "Enterprise Firewall Appliance",
        "category": "networking",
        "subcategory": "firewall",
        "unit_price": 3200.00,
        "technical_specs": {
            "throughput": "10 Gbps",
            "vpn": "IPsec/SSL",
            "users": "Unlimited",
            "threat_protection": True,
            "redundancy": "HA capable"
        },
        "description": "Next-generation firewall with advanced threat protection"
    },
    {
        "product_id": "SENSOR-MOTION-001",
        "product_name": "Smart Motion Detector",
        "category": "security",
        "subcategory": "sensor",
        "unit_price": 120.00,
        "technical_specs": {
            "detection_range": 12,
            "detection_angle": 90,
            "technology": "PIR + Microwave",
            "environment": "indoor",
            "power": "12V DC"
        },
        "description": "Dual-technology motion sensor for reliable intrusion detection"
    },
    {
        "product_id": "ALARM-PANEL-001",
        "product_name": "Central Alarm Panel",
        "category": "security",
        "subcategory": "alarm",
        "unit_price": 580.00,
        "technical_specs": {
            "zones": 32,
            "outputs": 8,
            "network": "Ethernet/GSM",
            "backup_battery": True,
            "app_control": True
        },
        "description": "Intelligent alarm panel with mobile app integration"
    }
]


# ============================================================================
# AGENT MODULES
# ============================================================================

class RequirementParser:
    """Parse unstructured requirements into structured format"""
    
    def __init__(self, gemini_client):
        self.client = gemini_client

    async def parse(self, state: ProposalState) -> ProposalState:
        """Parse raw requirements using LLM"""
        
        print("\n Parsing Requirements...")
        
        raw_reqs = "\n".join([
            f"- {r.description} (Priority: {r.priority})"
            for r in state['requirements']
        ])
        
        prompt = f"""You are a technical requirements analyst for a security and telecom solutions company.

CLIENT CONTEXT:
- Company: {state['client_info'].company_name}
- Industry: {state['client_info'].industry}
- Size: {state['client_info'].company_size}

RAW REQUIREMENTS:
{raw_reqs}

TASK:
Parse and structure these requirements. Extract technical specifications, estimate quantities, and categorize.

Return ONLY valid JSON matching this schema:
{{
  "requirements": [
    {{
      "category": "security|telecom|networking",
      "description": "Clear requirement statement",
      "priority": "critical|high|medium|low",
      "technical_specs": {{}},
      "quantity_estimate": 10
    }}
  ]
}}

Be specific and actionable. Don't invent specs not mentioned."""

        try:
            response = await self.client.generate_json(
                prompt,
                temperature=0,
            )
            state['parsed_requirements'] = [
                Requirement(**req) for req in response['requirements']
            ]
            print(state['parsed_requirements'])
            print(f" Parsed {len(state['parsed_requirements'])} requirements")
            
        except Exception as e:
            print(f" Parsing failed: {e}")
            state['errors'].append(f"Requirement parsing failed: {str(e)}")
            state['parsed_requirements'] = state['requirements']

        return state


class ProductIntelligenceEngine:
    """Recommend products based on requirements"""

    def __init__(self, gemini_client):
        self.client = gemini_client
        # self.database = PRODUCT_DATABASE
        db_path = os.path.join(os.path.dirname(__file__), "Product_database", "ACTA_DB.json")
        with open(db_path, "r") as file:
            self.database = json.load(file)

    async def recommend(self, state: ProposalState) -> ProposalState:
        """Search and recommend products"""
        
        print("\n Analyzing Product Recommendations...")
        
        requirements = state['parsed_requirements'] or state['requirements']
        
        # Filter by keywords
        filtered_products = self._filter_by_keywords(requirements)
        
        # LLM ranking and justification
        recommendations = await self._rank_and_justify(
            requirements,
            filtered_products,
            state['client_info']
        )

        state['product_recommendations'] = recommendations
        print(recommendations)
        print(f" Recommended {len(recommendations)} products")

        return state
    
    def _filter_by_keywords(self, requirements: List[Requirement]) -> List[Dict]:
        """Filter products by keyword matching"""
        
        keywords = set()
        for req in requirements:
            keywords.add(req.category.lower())
            keywords.update(req.description.lower().split())
        
        filtered = []
        for product in self.database:
            product_text = f"{product['industry_scenario']} {product['location']} {product['product_name']} \
                            {product['category']} {product['notes_key_selling_points']}".lower()
            
            matches = sum(1 for kw in keywords if kw in product_text)
            
            if matches > 0:
                filtered.append({**product, 'match_score': matches})
        
        return sorted(filtered, key=lambda x: x['match_score'], reverse=True)[:15]
    
    async def _rank_and_justify(
        self,
        requirements: List[Requirement],
        products: List[Dict],
        client_info: ClientInfo
    ) -> List[ProductRecommendation]:
        """Use LLM to rank products and generate justifications"""
        
        req_text = json.dumps([asdict(r) for r in requirements], indent=2)
        prod_text = json.dumps(products, indent=2)
        
        prompt = f"""You are a sales engineer recommending security and telecom products.

CLIENT:
- Industry: {client_info.industry}
- Size: {client_info.company_size}
- Budget: {client_info.budget_range or 'Not specified'}

REQUIREMENTS:
{req_text}

AVAILABLE PRODUCTS:
{prod_text}

TASK:
Select the best products and recommend quantities.

Return ONLY valid JSON:
{{
  "recommendations": [
    {{
      "product_name": "SATATYA MIDR50FL28CWP P2",
      "quantity": 12,
      "justification": "...",
      "technical_fit_score": 85
    }}
  ]
}}

Select 5-10 products.""" # Might need to remove the limit of products here.

        try:
            response = await self.client.generate_json(
                prompt,
                temperature=0.3,
            )

            recommendations = []
            for rec in response['recommendations']:
                product = next((p for p in self.database if p['product_name'] == rec['product_name']), None)
                
                if product:
                    recommendations.append(ProductRecommendation(
                        product_name=product['product_name'],
                        category=product['category'],
                        quantity=rec['quantity'],
                        unit_price=product['unit_price'],
                        justification=rec['justification'],
                        technical_fit_score=rec['technical_fit_score']
                    ))
            
            return recommendations
            
        except Exception as e:
            print(f" Product recommendation failed: {e}")
            return [
                ProductRecommendation(
                    product_name=p['product_name'],
                    category=p['category'],
                    quantity=1,
                    unit_price=p['unit_price'],
                    justification="Recommended based on requirements",
                    technical_fit_score=50.0
                )
                for p in products[:5]
            ]


class MapAnalysisEngine:
    """Analyze site and recommend camera placement"""
    
    def analyze(self, state: ProposalState) -> ProposalState:
        """Perform deterministic map analysis"""

        if not state['site_details']:
            print("\n No site details provided, skipping map analysis")
            return state

        print("\n Analyzing Site Coverage...")
        
        analyses = []
        
        for site in state['site_details']:
            analysis = self._analyze_single_site(site, state['product_recommendations'] or [])
            analyses.append(analysis)
        
        state['map_analysis'] = analyses
        print(analyses)
        print(f" Analyzed {len(analyses)} site(s)")

        return state
    
    def _analyze_single_site(self, site: SiteDetails, products: List[ProductRecommendation]) -> MapAnalysis:
        """Analyze coverage for a single site"""
        
        coverage_range = 30
        
        # Create site boundary
        side_length = math.sqrt(site.area_sqm)
        site_polygon = Polygon([
            (0, 0), (side_length, 0), (side_length, side_length), (0, side_length)
        ])
        
        # Generate grid
        grid_points = self._generate_grid(site_polygon, spacing=5)
        
        # Greedy placement
        placements = []
        uncovered = set(grid_points)
        max_iterations = 50
        
        while len(uncovered) > 0.05 * len(grid_points) and len(placements) < max_iterations:
            best_pos = self._find_best_position(uncovered, site_polygon, coverage_range)
            
            if not best_pos:
                break
            
            placements.append(best_pos)
            covered = self._get_covered_points(best_pos, uncovered, coverage_range)
            uncovered -= covered
        
        coverage_pct = ((len(grid_points) - len(uncovered)) / len(grid_points)) * 100
        
        return MapAnalysis(
            total_devices_needed=len(placements),
            placement_suggestions=placements,
            coverage_percentage=coverage_pct,
            blind_spots=self._identify_blind_spots(uncovered)
        )
    
    def _generate_grid(self, polygon: Polygon, spacing: float) -> List[Point]:
        """Generate uniform grid"""
        minx, miny, maxx, maxy = polygon.bounds
        points = []
        x = minx
        while x <= maxx:
            y = miny
            while y <= maxy:
                point = Point(x, y)
                if polygon.contains(point):
                    points.append(point)
                y += spacing
            x += spacing
        return points
    
    def _find_best_position(self, uncovered: set, boundary: Polygon, coverage_range: float) -> Optional[CameraPlacement]:
        """Find optimal position"""
        candidates = self._get_candidate_positions(boundary)
        best_pos = None
        max_coverage = 0
        
        for x, y in candidates:
            coverage_count = len(self._get_covered_points(
                CameraPlacement(x, y, coverage_range, "unknown"),
                uncovered, coverage_range
            ))
            
            if coverage_count > max_coverage:
                max_coverage = coverage_count
                best_pos = (x, y)
        
        if best_pos:
            return CameraPlacement(x=best_pos[0], y=best_pos[1], coverage_radius=coverage_range, zone="General", mounting_height=3.0)
        return None
    
    def _get_candidate_positions(self, polygon: Polygon) -> List[tuple]:
        """Get candidate positions"""
        coords = list(polygon.exterior.coords)
        candidates = []
        for i in range(len(coords) - 1):
            candidates.append(coords[i])
            mid_x = (coords[i][0] + coords[i+1][0]) / 2
            mid_y = (coords[i][1] + coords[i+1][1]) / 2
            candidates.append((mid_x, mid_y))
        return candidates
    
    def _get_covered_points(self, camera: CameraPlacement, points: set, coverage_range: float) -> set:
        """Get covered points"""
        camera_point = Point(camera.x, camera.y)
        coverage_circle = camera_point.buffer(coverage_range)
        return {p for p in points if coverage_circle.contains(p)}
    
    def _identify_blind_spots(self, uncovered: set) -> List[Dict[str, Any]]:
        """Identify blind spots"""
        if not uncovered:
            return []
        return [{"description": "Uncovered area", "point_count": len(uncovered)}]


class ClientIntelligenceEngine:
    """Gather external intelligence"""
    
    def __init__(self, gemini_client):
        self.client = gemini_client

    async def research(self, state: ProposalState) -> ProposalState:
        """Research client"""
        
        client_info = state['client_info']
        
        if client_info.company_size in ['Mid-Market', 'Enterprise']:
            print("\n Gathering Client Intelligence...")
            insights = await self._generate_insights(client_info)
            print(insights)
            state['client_insights'] = insights
            print(" Client intelligence gathered")
        else:
            print("\n  Skipping client intelligence for SMB")
        
        return state
    
    async def _generate_insights(self, client_info: ClientInfo) -> ClientInsight:
        """Generate insights"""
        
        prompt = f"""Generate realistic business insights for a {client_info.industry} company.

Return ONLY valid JSON:
{{
  "recent_news": [{{"title": "...", "snippet": "...", "relevance": "..."}}],
  "expansion_signals": ["..."],
  "risk_factors": ["..."],
  "talking_points": ["..."]
}}

2-3 items each, industry-specific."""

        try:
            response = await self.client.generate_json(
                prompt,
                temperature=0.7,
            )
            
            return ClientInsight(
                recent_news=response.get('recent_news', []),
                expansion_signals=response.get('expansion_signals', []),
                risk_factors=response.get('risk_factors', []),
                talking_points=response.get('talking_points', [])
            )
        except Exception as e:
            return ClientInsight(recent_news=[], expansion_signals=[], risk_factors=[], talking_points=[])


class PricingEngine:
    """Calculate pricing"""
    
    def calculate(self, state: ProposalState) -> ProposalState:
        """Calculate pricing"""
        
        print("\n Calculating Pricing...")
        
        products = state['product_recommendations'] or []
        sites = state['site_details'] or []
        
        subtotal = sum(p.quantity * p.unit_price for p in products)
        base_installation = subtotal * 0.20
        site_multiplier = len(sites) if sites else 1
        installation_cost = base_installation * site_multiplier
        maintenance_annual = subtotal * 0.15
        total = subtotal + installation_cost
        
        sla_tier = "Premium" if total > 50000 else "Professional" if total > 20000 else "Standard"
        
        state['pricing'] = PricingSummary(
            subtotal_products=round(subtotal, 2),
            installation_cost=round(installation_cost, 2),
            maintenance_annual=round(maintenance_annual, 2),
            total_investment=round(total, 2),
            sla_tier=sla_tier
        )
        
        print(f" Total Investment: {total:,.2f}")
        return state


class ProposalGenerator:
    """Generate proposal document"""
    
    def __init__(self, gemini_client):
        self.client = gemini_client
    
    async def generate(self, state: ProposalState) -> ProposalState:
        """Generate proposal"""
        
        print("\n Generating Proposal Content...")
        content = await self._generate_content(state)
        state['proposal_content'] = content
        print(content)
        print(" Proposal content generated")
        return state
    
    async def _generate_content(self, state: ProposalState) -> Dict[str, Any]:
        """Generate content"""
        
        client_info = state['client_info']
        products = state['product_recommendations'] or []
        pricing = state['pricing']
        insights = state['client_insights']
        
        products_text = "\n".join([
            f"- {p.product_name} (Qty: {p.quantity}) - {p.unit_price:,.2f}\n  {p.justification}"
            for p in products
        ])
        
        insights_text = ""
        if insights:
            insights_text = json.dumps(asdict(insights), indent=2)
        
        prompt = f"""Generate a professional proposal for {client_info.company_name} in {client_info.industry}.

Products:
{products_text}

Pricing: {pricing.total_investment:,.2f}

Insights:
{insights_text}

Return JSON with sections:
{{
  "executive_summary": "...",
  "understanding_needs": "...",
  "proposed_solution": "...",
  "product_recommendations": "...",
  "implementation_plan": "...",
  "investment_summary": "..."
}}"""

        try:
            response = await self.client.generate_json(
                prompt,
                temperature=0.7,
            )
            return response
        except Exception as e:
            return {"executive_summary": "Error generating proposal", "error": str(e)}


# ============================================================================
# ORCHESTRATOR
# ============================================================================

class ProposalOrchestrator:
    """Main orchestrator"""
    
    def __init__(self, api_key: str):
        self.client = GeminiClient(api_key=api_key)
        self.requirement_parser = RequirementParser(self.client)
        self.product_engine = ProductIntelligenceEngine(self.client)
        self.map_engine = MapAnalysisEngine()
        self.client_intel_engine = ClientIntelligenceEngine(self.client)
        self.pricing_engine = PricingEngine()
        self.proposal_generator = ProposalGenerator(self.client)
    
    async def generate_proposal(self, state: ProposalState) -> ProposalState:
        """Execute workflow"""
        
        print("="*60)
        print("ENTERPRISE PROPOSAL GENERATION AGENT")
        print("="*60)
        
        state['status'] = 'processing'
        state['errors'] = []
        
        try:
            state = await self.requirement_parser.parse(state)
            
            tasks = [
                self.product_engine.recommend(state),
                self.client_intel_engine.research(state)
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, Exception):
                    state['errors'].append(str(result))
                else:
                    state.update(result)
            
            state = self.map_engine.analyze(state)
            state = self.pricing_engine.calculate(state)
            state = await self.proposal_generator.generate(state)
            
            state['status'] = 'completed'
            
            print("\n" + "="*60)
            print("PROPOSAL GENERATION COMPLETED")
            print("="*60)
            
        except Exception as e:
            print(f"\n FATAL ERROR: {e}")
            state['status'] = 'failed'
            state['errors'].append(str(e))
        
        return state


# ============================================================================
# DOCUMENT RENDERER
# ============================================================================

async def render_docx(state: ProposalState, output_path: str):
    """Render as Word document"""
    
    print("\nRendering Word Document...")
    
    # Convert Windows backslashes to forward slashes for use in JS strings
    output_path_fwd = output_path.replace("\\", "/")

    client_info = state['client_info']
    content = state['proposal_content']
    products = state['product_recommendations'] or []
    pricing = state['pricing']
    
    js_code = f"""
const {{ Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
        LevelFormat, PageBreak }} = require('docx');
const fs = require('fs');

const content = {json.dumps(content)};
const clientInfo = {json.dumps(asdict(client_info))};
const products = {json.dumps([asdict(p) for p in products])};
const pricing = {json.dumps(asdict(pricing))};

const border = {{ style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }};
const borders = {{ top: border, bottom: border, left: border, right: border }};

const doc = new Document({{
  styles: {{
    default: {{ document: {{ run: {{ font: "Arial", size: 24 }} }} }},
    paragraphStyles: [
      {{ id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: {{ size: 32, bold: true, font: "Arial", color: "2E75B6" }},
        paragraph: {{ spacing: {{ before: 480, after: 240 }}, outlineLevel: 0 }} }},
      {{ id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: {{ size: 28, bold: true, font: "Arial", color: "2E75B6" }},
        paragraph: {{ spacing: {{ before: 360, after: 180 }}, outlineLevel: 1 }} }}
    ]
  }},
  sections: [{{
    properties: {{
      page: {{
        size: {{ width: 12240, height: 15840 }},
        margin: {{ top: 1440, right: 1440, bottom: 1440, left: 1440 }}
      }}
    }},
    children: [
      new Paragraph({{
        children: [new TextRun({{ text: "PROPOSAL", size: 48, bold: true, color: "2E75B6" }})],
        alignment: AlignmentType.CENTER,
        spacing: {{ before: 2880 }}
      }}),
      new Paragraph({{
        children: [new TextRun({{ text: "Security & Telecom Solutions", size: 32, color: "666666" }})],
        alignment: AlignmentType.CENTER,
        spacing: {{ after: 720 }}
      }}),
      new Paragraph({{
        children: [new TextRun({{ text: "Prepared for:", size: 24, bold: true }})],
        alignment: AlignmentType.CENTER,
        spacing: {{ before: 1440, after: 120 }}
      }}),
      new Paragraph({{
        children: [new TextRun({{ text: clientInfo.company_name, size: 28, bold: true, color: "2E75B6" }})],
        alignment: AlignmentType.CENTER
      }}),
      new Paragraph({{
        children: [new TextRun({{ text: new Date().toLocaleDateString('en-US', {{ month: 'long', day: 'numeric', year: 'numeric' }}), size: 20, color: "666666" }})],
        alignment: AlignmentType.CENTER,
        spacing: {{ before: 240 }}
      }}),
      new Paragraph({{ children: [new PageBreak()] }}),
      
      new Paragraph({{ heading: HeadingLevel.HEADING_1, children: [new TextRun("Executive Summary")] }}),
      new Paragraph({{ children: [new TextRun(content.executive_summary || "Executive summary...")], spacing: {{ after: 240 }} }}),
      
      new Paragraph({{ heading: HeadingLevel.HEADING_1, children: [new TextRun("Understanding Your Needs")] }}),
      new Paragraph({{ children: [new TextRun(content.understanding_needs || "Requirements...")], spacing: {{ after: 240 }} }}),
      
      new Paragraph({{ heading: HeadingLevel.HEADING_1, children: [new TextRun("Proposed Solution")] }}),
      new Paragraph({{ children: [new TextRun(content.proposed_solution || "Solution...")], spacing: {{ after: 240 }} }}),
      
      new Paragraph({{ heading: HeadingLevel.HEADING_1, children: [new TextRun("Product Recommendations")] }}),
      new Paragraph({{ children: [new TextRun(content.product_recommendations || "Products...")], spacing: {{ after: 240 }} }}),
      
      new Table({{
        width: {{ size: 9360, type: WidthType.DXA }},
        columnWidths: [3744, 1872, 1872, 1872],
        rows: [
          new TableRow({{
            children: [
              new TableCell({{ borders, width: {{ size: 3744, type: WidthType.DXA }}, shading: {{ fill: "2E75B6", type: ShadingType.CLEAR }},
                margins: {{ top: 80, bottom: 80, left: 120, right: 120 }},
                children: [new Paragraph({{ children: [new TextRun({{ text: "Product", bold: true, color: "FFFFFF" }})] }})] }}),
              new TableCell({{ borders, width: {{ size: 1872, type: WidthType.DXA }}, shading: {{ fill: "2E75B6", type: ShadingType.CLEAR }},
                margins: {{ top: 80, bottom: 80, left: 120, right: 120 }},
                children: [new Paragraph({{ children: [new TextRun({{ text: "Quantity", bold: true, color: "FFFFFF" }})] }})] }}),
              new TableCell({{ borders, width: {{ size: 1872, type: WidthType.DXA }}, shading: {{ fill: "2E75B6", type: ShadingType.CLEAR }},
                margins: {{ top: 80, bottom: 80, left: 120, right: 120 }},
                children: [new Paragraph({{ children: [new TextRun({{ text: "Unit Price", bold: true, color: "FFFFFF" }})] }})] }}),
              new TableCell({{ borders, width: {{ size: 1872, type: WidthType.DXA }}, shading: {{ fill: "2E75B6", type: ShadingType.CLEAR }},
                margins: {{ top: 80, bottom: 80, left: 120, right: 120 }},
                children: [new Paragraph({{ children: [new TextRun({{ text: "Total", bold: true, color: "FFFFFF" }})] }})] }})
            ]
          }}),
          ...products.map((p, i) => new TableRow({{
            children: [
              new TableCell({{ borders, width: {{ size: 3744, type: WidthType.DXA }}, shading: {{ fill: i % 2 === 0 ? "F9F9F9" : "FFFFFF", type: ShadingType.CLEAR }},
                margins: {{ top: 80, bottom: 80, left: 120, right: 120 }}, children: [new Paragraph({{ children: [new TextRun(p.product_name)] }})] }}),
              new TableCell({{ borders, width: {{ size: 1872, type: WidthType.DXA }}, shading: {{ fill: i % 2 === 0 ? "F9F9F9" : "FFFFFF", type: ShadingType.CLEAR }},
                margins: {{ top: 80, bottom: 80, left: 120, right: 120 }}, children: [new Paragraph({{ children: [new TextRun(p.quantity.toString())], alignment: AlignmentType.CENTER }})] }}),
              new TableCell({{ borders, width: {{ size: 1872, type: WidthType.DXA }}, shading: {{ fill: i % 2 === 0 ? "F9F9F9" : "FFFFFF", type: ShadingType.CLEAR }},
                margins: {{ top: 80, bottom: 80, left: 120, right: 120 }}, children: [new Paragraph({{ children: [new TextRun("$" + p.unit_price.toLocaleString('en-US', {{minimumFractionDigits: 2}}))], alignment: AlignmentType.RIGHT }})] }}),
              new TableCell({{ borders, width: {{ size: 1872, type: WidthType.DXA }}, shading: {{ fill: i % 2 === 0 ? "F9F9F9" : "FFFFFF", type: ShadingType.CLEAR }},
                margins: {{ top: 80, bottom: 80, left: 120, right: 120 }}, children: [new Paragraph({{ children: [new TextRun("$" + (p.quantity * p.unit_price).toLocaleString('en-US', {{minimumFractionDigits: 2}}))], alignment: AlignmentType.RIGHT }})] }})
            ]
          }}))
        ]
      }}),
      
      new Paragraph({{ text: "", spacing: {{ after: 480 }} }}),
      new Paragraph({{ heading: HeadingLevel.HEADING_1, children: [new TextRun("Implementation Plan")] }}),
      new Paragraph({{ children: [new TextRun(content.implementation_plan || "Implementation...")], spacing: {{ after: 240 }} }}),
      
      new Paragraph({{ heading: HeadingLevel.HEADING_1, children: [new TextRun("Investment Summary")] }}),
      new Paragraph({{ children: [new TextRun(content.investment_summary || "Investment...")], spacing: {{ after: 240 }} }}),
      
      new Table({{
        width: {{ size: 9360, type: WidthType.DXA }},
        columnWidths: [6552, 2808],
        rows: [
          new TableRow({{ children: [
            new TableCell({{ borders, width: {{ size: 6552, type: WidthType.DXA }}, margins: {{ top: 80, bottom: 80, left: 120, right: 120 }},
              children: [new Paragraph({{ children: [new TextRun({{ text: "Products & Equipment", bold: true }})] }})] }}),
            new TableCell({{ borders, width: {{ size: 2808, type: WidthType.DXA }}, margins: {{ top: 80, bottom: 80, left: 120, right: 120 }},
              children: [new Paragraph({{ children: [new TextRun("$" + pricing.subtotal_products.toLocaleString('en-US', {{minimumFractionDigits: 2}}))], alignment: AlignmentType.RIGHT }})] }})
          ] }}),
          new TableRow({{ children: [
            new TableCell({{ borders, width: {{ size: 6552, type: WidthType.DXA }}, shading: {{ fill: "F9F9F9", type: ShadingType.CLEAR }}, margins: {{ top: 80, bottom: 80, left: 120, right: 120 }},
              children: [new Paragraph({{ children: [new TextRun({{ text: "Installation & Configuration", bold: true }})] }})] }}),
            new TableCell({{ borders, width: {{ size: 2808, type: WidthType.DXA }}, shading: {{ fill: "F9F9F9", type: ShadingType.CLEAR }}, margins: {{ top: 80, bottom: 80, left: 120, right: 120 }},
              children: [new Paragraph({{ children: [new TextRun("$" + pricing.installation_cost.toLocaleString('en-US', {{minimumFractionDigits: 2}}))], alignment: AlignmentType.RIGHT }})] }})
          ] }}),
          new TableRow({{ children: [
            new TableCell({{ borders, width: {{ size: 6552, type: WidthType.DXA }}, shading: {{ fill: "E8F4F8", type: ShadingType.CLEAR }}, margins: {{ top: 80, bottom: 80, left: 120, right: 120 }},
              children: [new Paragraph({{ children: [new TextRun({{ text: "TOTAL INVESTMENT", bold: true, size: 26 }})] }})] }}),
            new TableCell({{ borders, width: {{ size: 2808, type: WidthType.DXA }}, shading: {{ fill: "E8F4F8", type: ShadingType.CLEAR }}, margins: {{ top: 80, bottom: 80, left: 120, right: 120 }},
              children: [new Paragraph({{ children: [new TextRun({{ text: "$" + pricing.total_investment.toLocaleString('en-US', {{minimumFractionDigits: 2}}), bold: true, size: 26 }})], alignment: AlignmentType.RIGHT }})] }})
          ] }}),
          new TableRow({{ children: [
            new TableCell({{ borders, width: {{ size: 6552, type: WidthType.DXA }}, margins: {{ top: 80, bottom: 80, left: 120, right: 120 }},
              children: [new Paragraph({{ children: [new TextRun("Annual Maintenance (" + pricing.sla_tier + " SLA)")] }})] }}),
            new TableCell({{ borders, width: {{ size: 2808, type: WidthType.DXA }}, margins: {{ top: 80, bottom: 80, left: 120, right: 120 }},
              children: [new Paragraph({{ children: [new TextRun("$" + pricing.maintenance_annual.toLocaleString('en-US', {{minimumFractionDigits: 2}}) + "/year")], alignment: AlignmentType.RIGHT }})] }})
          ] }})
        ]
      }})
    ]
  }}]
}});

Packer.toBuffer(doc).then(buffer => {{
  fs.writeFileSync('{output_path_fwd}', buffer);
  console.log('Document created');
}});
"""
    
    js_file = os.path.join(os.path.dirname(__file__), "render.js")
    with open(js_file, 'w', encoding='utf-8') as f:
        f.write(js_code)
    
    import subprocess
    result = subprocess.run(['node', js_file], capture_output=True, text=True)
    
    if result.returncode != 0:
        raise Exception(f"Document generation failed: {result.stderr}")
    
    print(f"Document saved: {output_path}")


# ============================================================================
# MAIN
# ============================================================================

async def main(data):
    """Main execution"""
    
    api_key = "T9m8EJPCXGHKVXKQ6Gb6o06sbNo0ew"

    if not api_key:
        print(" GEMINI_API_KEY not set")
        return
    
    orchestrator = ProposalOrchestrator(api_key)
    
    client_details = data.get("client_info", {})
    client_requiremets = data.get("requirements", [])
    
    safe_requirements = []
    if client_requiremets and len(client_requiremets) > 0:
        safe_requirements.append(Requirement(
            category=client_requiremets[0].get("category", "general"),
            description=client_requiremets[0].get("description", "No description provided"),
            priority=client_requiremets[0].get("priority", "medium"),
            technical_specs=client_requiremets[0].get("technical_specs", {}),
            quantity_estimate=client_requiremets[0].get("quantity_estimate", None)
        ))
    
    safe_requirements.extend([
        Requirement(
            category="security",
            description="Access control for 3 entry points with biometric authentication",
            priority="high",
            technical_specs={"entry_points": 3, "biometric": True},
            quantity_estimate=3
        ),
        Requirement(
            category="networking",
            description="Network infrastructure for IP cameras and access control",
            priority="high",
            technical_specs={},
            quantity_estimate=None
        ),
        Requirement(
            category="telecom",
            description="IP-based intercom for main entrance",
            priority="medium",
            technical_specs={"video": True, "locations": 1},
            quantity_estimate=1
        )
    ])

    initial_state: ProposalState = {
    'client_info': ClientInfo(
        company_name=client_details.get("company_name", "Unknown Company"),
        industry=client_details.get("industry", "Unknown Industry"),
        company_size=client_details.get("company_size", "Unknown Size"),
        location={"city": client_details.get("location", {}).get("city", "Unknown"), "state": client_details.get("location", {}).get("state", "Unknown"), "country": "India"},
        budget_range=client_details.get("budget_range")
    ),
    'requirements': safe_requirements,
    'site_details': [
        SiteDetails(
            site_id="SITE-001",
            coordinates={"lat": 30.2672, "lon": -97.7431},
            area_sqm=5000,
            zones=[
                {"name": "Warehouse", "type": "storage", "size": 3500},
                {"name": "Loading Dock", "type": "shipping", "size": 1000},
                {"name": "Office", "type": "admin", "size": 500}
            ],
            environment="indoor"
        )
    ],
        'parsed_requirements': None,
        'product_recommendations': None,
        'map_analysis': None,
        'client_insights': None,
        'pricing': None,
        'proposal_content': None,
        'status': 'initialized',
        'errors': []
    }
    
    final_state = await orchestrator.generate_proposal(initial_state)
    
    if final_state['status'] == 'completed' or final_state['proposal_content']:
        output_path = os.path.join(os.path.dirname(__file__), "proposal_techcorp.docx")
        await render_docx(final_state, output_path)
        return output_path
    else:
        print(f"\n Errors:")
        for error in final_state['errors']:
            print(f"  - {error}")
        return None


# if __name__ == "__main__":
def run_proposal_agent(client_details):
    result = asyncio.run(main(client_details))
    
    if result:
        print(f"\n{'='*60}")
        print(f"SUCCESS! Proposal generated at: {result}")
        print(f"{'='*60}")
        return result
    return None
