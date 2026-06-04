# IRIS — Intelligent Revenue & Intelligence System
## Comprehensive Project Report

**Submitted in partial fulfilment of the requirements for the degree of**
Bachelor of Engineering (Computer Engineering)

---

**Project Title:** IRIS — Intelligent Revenue & Intelligence System

**Guided By:** [Guide Name]

**Submitted By:** [Student Names & Roll Numbers]

**Academic Year:** 2025–2026

**Institution:** [Institution Name]

---

## Abstract

The enterprise sales and account management domain is characterised by large volumes of unstructured customer feedback, complex renewal timelines, and the need for timely competitive intelligence — all of which are poorly served by conventional CRM systems. Project IRIS (Intelligent Revenue & Intelligence System) addresses this gap through a purpose-built, multi-service enterprise intelligence portal designed specifically for organisations operating in the physical security, surveillance, and unified communications markets.

IRIS is architected as three independently deployable services: a React 18 + TypeScript single-page application frontend (port 5173), a Flask + SQLAlchemy RESTful API backend (port 5000), and a dedicated AI Agent microservice (port 5001) powered by Google Gemini and Perplexity Sonar. The system implements Role-Based Access Control (RBAC) with two roles — Matrix Manager (administrator) and Sales Manager — and applies zone-based data scoping so that each Sales Manager sees only accounts within their assigned geographic zone.

The centrepiece analytical component is **PRISM** (Prioritization & Research Intelligence System Module) — a custom NLP pipeline that ingests raw Excel-format customer feedback, generates sentence embeddings using the `all-MiniLM-L6-v2` transformer model, clusters semantically similar feedback using HDBSCAN density-based clustering, and ranks the resulting feature clusters using a six-factor weighted scoring formula. PRISM achieves a Silhouette Score consistently above 0.65 on datasets up to 1,000 rows, reducing feedback analysis time from 2–3 weeks to under 10 seconds.

Beyond feedback analysis, IRIS includes an AI Agent Server that hosts two autonomous agents: a Market Research Agent that uses Perplexity Sonar to retrieve live competitive intelligence from the web and synthesise it into structured, citation-backed reports; and a Proposal Generation Agent that uses Google Gemini (Gemma-3-1B-IT) to produce complete, formatted Word document proposals for prospects — reducing proposal creation time from 2–3 days to under 2 minutes.

Evaluation demonstrates that PRISM clustering quality (Silhouette Score > 0.65) is consistent with state-of-the-art short-text clustering benchmarks, and the AI agents produce outputs that are directly actionable by enterprise sales teams. IRIS is a deployable, end-to-end enterprise intelligence platform that demonstrates the practical viability of NLP and agentic AI in B2B sales workflows.

---

## Table of Contents

1. Introduction
2. Motivation and Problem Background
3. Literature Review
4. Software Design and System Architecture
5. Results and Discussion
6. Conclusion and Future Scope
7. References
8. Appendices

---

## List of Figures

- Figure 1: High-Level System Architecture Diagram (Three-Service Distributed Architecture)
- Figure 2: PRISM NLP Pipeline Flowchart (Upload → Embed → Cluster → Score → Research)
- Figure 3: PRISM Prioritization Score Formula
- Figure 4: Database Entity-Relationship (ER) Diagram
- Figure 5: Authentication and JWT Token Flow Sequence Diagram
- Figure 6: Market Research Agent Workflow (Perplexity Sonar Integration)
- Figure 7: Proposal Generation Agent Multi-Step Pipeline Diagram
- Figure 8: Frontend Routing and Component Hierarchy
- Figure 9: Role-Based Access Control and Zone Scoping Diagram
- Figure 10: PRISM Clustering — Silhouette Score vs Dataset Size Graph
- Figure 11: Before vs After Workflow Diagram (Manual vs IRIS-Assisted)
- Figure 12: Dashboard Screenshot
- Figure 13: PRISM Prioritization Page Screenshot
- Figure 14: AI Market Research Report Screenshot

---

## List of Tables

- Table 1: Technology Stack Summary
- Table 2: Hardware and Software Requirements
- Table 3: Database Schema Summary (Core Models)
- Table 4: API Endpoint Reference
- Table 5: PRISM Scoring Weights and Formula Components
- Table 6: System Testing Results
- Table 7: PRISM Clustering Performance Metrics
- Table 8: Comparison with Existing CRM Systems
- Table 9: Agile Sprint Summary

---

## List of Abbreviations

| Abbreviation | Full Form |
|---|---|
| IRIS | Intelligent Revenue & Intelligence System |
| PRISM | Prioritization & Research Intelligence System Module |
| CRM | Customer Relationship Management |
| NLP | Natural Language Processing |
| API | Application Programming Interface |
| JWT | JSON Web Token |
| RBAC | Role-Based Access Control |
| SPA | Single Page Application |
| ORM | Object-Relational Mapper |
| REST | Representational State Transfer |
| LLM | Large Language Model |
| AMC | Annual Maintenance Contract |
| EOL | End of Life |
| KPI | Key Performance Indicator |
| HDBSCAN | Hierarchical Density-Based Spatial Clustering of Applications with Noise |
| SBERT | Sentence-BERT |
| MCDA | Multi-Criteria Decision Analysis |
| ER | Entity-Relationship |
| VAD | Value Added Distributor |
| SI | System Integrator |

---

## Chapter 1: Introduction

### 1.1 What is IRIS?

IRIS (Intelligent Revenue & Intelligence System) is a full-stack, multi-service enterprise intelligence portal built for organisations that sell physical security, surveillance, access control, and unified communications solutions to large institutional clients. It is not a generic CRM; it is a domain-specific, AI-augmented account management and sales intelligence platform.

At its core, IRIS allows Matrix Managers (administrators) and Sales Managers to:
- Track and manage their full portfolio of enterprise accounts, prospects, and installed products.
- Monitor account health through a quantified Health Score (0–100) that reflects ticket load, renewal status, and visit recency.
- Analyse thousands of rows of unstructured customer feedback in seconds using the PRISM NLP engine.
- Receive live, citation-backed competitive intelligence from the web via the Perplexity Sonar API.
- Generate complete, formatted sales proposals as Word documents in under 2 minutes using the Gemini AI agent.
- Manage support tickets, product renewals (AMC/License/Warranty), and software releases with account-level matching.

The name reflects the system's dual purpose: managing **Revenue** (accounts, renewals, proposals) and providing **Intelligence** (PRISM analysis, market research, competitive data).

### 1.1.1 System Architecture and Sub-Systems

IRIS comprises three tightly integrated, independently deployable services:

1. **iris-frontend** (Port 5173): A React 18 + TypeScript Single Page Application (SPA) bootstrapped with Vite. It provides the complete user interface across all modules.
2. **iris-backend** (Port 5000): A Flask + SQLAlchemy RESTful API service backed by SQLite (development) or PostgreSQL (production). Hosts all business logic, authentication, PRISM NLP pipeline, and data management.
3. **agent_server** (Port 5001): An isolated Flask microservice hosting the Proposal Generation Agent (Google Gemini / Gemma-3-1B-IT) and the Market Research Agent (Perplexity Sonar).

[INSERT IMAGE: High-Level System Architecture Diagram showing the three services, their ports, communication flows (REST/JSON with JWT auth between frontend↔backend, REST/JSON without auth between frontend↔agent_server), and external API connections (Perplexity, Gemini)]

### 1.1.2 Core Technology Stack

**Table 1: Technology Stack Summary**

| Layer | Technology | Version | Role |
|---|---|---|---|
| Frontend Framework | React + TypeScript | 18.x | SPA UI |
| Frontend Build Tool | Vite | 5.x | Dev server & bundler |
| State Management | Zustand | 4.x | Auth state (token, role, zone) |
| Server State | TanStack React Query | 5.x | API caching & refetching |
| Routing | React Router | v6 | Client-side routing |
| UI Animations | Framer Motion | 11.x | Page transitions & micro-animations |
| Icon Library | Lucide React | — | Consistent icon set |
| Backend Framework | Flask | 3.0.3 | RESTful API server |
| ORM | SQLAlchemy | 2.0.30 | Database abstraction |
| Authentication | Flask-JWT-Extended | 4.6.0 | JWT access & refresh tokens |
| Password Hashing | Flask-Bcrypt | 1.0.1 | Bcrypt password hashing |
| CORS | Flask-CORS | 4.0.1 | Cross-origin request handling |
| Database (Dev) | SQLite | 3.x | Local file-based database |
| Database (Prod) | PostgreSQL | 15.x | Production relational database |
| NLP Embeddings | SentenceTransformers | — | `all-MiniLM-L6-v2` model |
| Clustering | HDBSCAN (scikit-learn) | — | Density-based feedback clustering |
| Data Processing | Pandas | — | Excel ingestion and manipulation |
| AI Agent LLM | Google Gemini (Gemma-3-1B-IT) | — | Proposal generation |
| Market Research | Perplexity Sonar API | — | Live web-grounded market intelligence |
| Document Export | python-docx | — | Word document proposal generation |
| Migrations | Alembic / Flask-Migrate | 1.13.1 | Schema migrations |
| Security | Flask-Talisman, Flask-Limiter | — | HTTP security headers & rate limiting |

### 1.1.3 Key Highlights of the Platform

IRIS stands out through several distinguishing capabilities that set it apart from generic CRM tools:

- **PRISM NLP Engine**: An entirely custom, domain-agnostic NLP pipeline that processes raw, unstructured Excel-format customer feedback without any pre-labelling or training data. It uses transformer-based semantic embeddings and density-based clustering to group similar feedback, then ranks it using a six-factor MCDA scoring formula.
- **Zone-Based Data Scoping**: Every Sales Manager is assigned to a geographic zone (mapped to Indian states). All backend queries are automatically scoped to that zone — a Sales Manager in Zone West cannot view accounts from Zone South.
- **Account Health Score Engine**: A quantified, 0–100 Health Score is calculated for each account based on open tickets, critical tickets, upcoming renewals, and visit recency — giving sales teams an objective, data-driven view of account risk.
- **Agentic AI Integration**: Two autonomous AI agents (Proposal Generation and Market Research) that perform multi-step reasoning tasks and produce structured, actionable outputs — not just raw API responses.
- **Live Market Intelligence**: The Perplexity Sonar API is a retrieval-augmented LLM that fetches live web data (filtered to last 1 month by default), ensuring market research is always current and citation-backed.
- **Automated Proposal Generation**: The Gemini-powered agent takes client information (company, industry, location, requirements) and autonomously produces a fully formatted Word document proposal with product recommendations, technical specifications, and pricing narratives.

### 1.2 Motivation

#### 1.2.1 The Enterprise Account Management Gap in India

India's physical security and unified communications market is valued at over USD 3.5 billion and is growing at a CAGR of approximately 14%. Organisations operating in this space — such as Matrix Comsec, Hikvision India, CP Plus — manage portfolios of hundreds of enterprise accounts across banking, healthcare, education, manufacturing, and government sectors.

Despite this scale, the tools used by most sales teams remain generic: Excel sheets for account tracking, email threads for feedback, manually written Word documents for proposals, and periodic review meetings for market intelligence. The gap between what is possible with modern AI and NLP and what is actually deployed in enterprise sales workflows is enormous. IRIS was built to close that gap.

#### 1.2.2 Manual Feedback Analysis is Inefficient

Product teams at enterprise security companies receive thousands of lines of customer feedback in the form of Excel sheets, email extracts, and support logs. The current workflow is:
1. A product manager downloads feedback from multiple sources into a spreadsheet.
2. They manually read through hundreds of rows, grouping similar items.
3. They subjectively rank features based on perceived frequency and importance.
4. The entire process takes 2–3 weeks and is heavily dependent on individual judgment.

This is inefficient and biased. PRISM reduces this to under 10 seconds by automating steps 1–3 with semantic embedding and density-based clustering.

#### 1.2.3 Reactive Account Management

Sales teams typically learn about account dissatisfaction only after it has escalated — when a renewal is missed or a ticket becomes critical. There is no proactive signal. IRIS addresses this by computing a continuous Health Score for every account, allowing sales managers to intervene before churn occurs.

The Health Score is computed from four signals:
- **Ticket load**: Number of open tickets and their severity.
- **Renewal proximity**: AMC, License, or Warranty renewals due within 30–90 days.
- **Visit recency**: Days since last recorded site visit (flagged after 180 days).
- **Account type**: Existing accounts vs. prospects have different scoring baselines.

#### 1.2.4 Absence of External Market Validation

When prioritising features, organisations lack an objective external validation mechanism. A feature that appears critical based on internal feedback volume may have already been commoditised by competitors, or conversely, may represent a significant market differentiator. PRISM's Market Research integration with Perplexity Sonar addresses this by fetching live competitive data to validate internal prioritisation with external market signals.

#### 1.2.5 Manual Proposal Generation

Creating a customised sales proposal for a prospect is a time-intensive process involving input from product specialists, pricing teams, and technical consultants — typically taking 2–3 days. IRIS's Proposal Generation Agent automates this by accepting client metadata (company name, industry, location, size, budget range) and producing a complete, formatted Word document in under 2 minutes.

#### 1.2.6 Technology as the Enabler

The motivation behind IRIS is equally rooted in the availability of powerful modern technologies:
- **Sentence Transformers** (specifically `all-MiniLM-L6-v2`) provide high-quality semantic embeddings at low computational cost, making real-time CPU-based clustering feasible.
- **HDBSCAN** provides parameter-free, noise-aware density clustering ideal for short-text feedback that traditional algorithms (k-means, LDA) handle poorly.
- **Perplexity Sonar** is a retrieval-augmented LLM capable of live web search, enabling market research that is grounded in current data rather than static training corpora.
- **Google Gemini** provides powerful multi-step reasoning capabilities for proposal generation without requiring fine-tuning or domain-specific training.

### 1.3 Scope of the Project

The scope of IRIS encompasses:
- Role-based access for Matrix Managers (global view) and Sales Managers (zone-scoped view).
- Complete lifecycle management for accounts, products, tickets, renewals, and software releases.
- NLP-driven feedback clustering and multi-criteria feature prioritisation via PRISM.
- Live market intelligence generation via Perplexity Sonar API integration.
- Automated sales proposal generation in Word document format via Gemini.
- A responsive, premium-quality web interface accessible via any modern browser.

**Out of scope:** Mobile application, real-time WebSocket notifications, CRM integrations (Salesforce, Zoho), and multi-tenant architecture.

### 1.4 Objectives

1. To design and implement a full-stack enterprise account management system with RBAC and zone-based data scoping.
2. To develop PRISM — a custom NLP pipeline using transformer embeddings and HDBSCAN clustering that processes unstructured customer feedback and ranks features using a six-factor MCDA scoring formula.
3. To integrate the Perplexity Sonar API for live, web-grounded competitive market intelligence.
4. To build an autonomous AI Proposal Generation Agent using Google Gemini that produces complete Word document proposals.
5. To provide a premium-quality, interactive user interface with real-time data visualisation and account health monitoring.
6. To demonstrate the feasibility of deploying NLP and agentic AI tools in enterprise CRM workflows without requiring labelled training data.

### 1.5 Development Methodology

IRIS was developed using an Agile methodology with iterative sprint cycles. Development was organised into six phases:

#### Phase 1: Requirements and Architecture (Sprint 1)
Requirements were gathered through analysis of real enterprise sales workflows in the physical security domain. The three-service architecture was defined: frontend (Vite + React), backend (Flask + SQLAlchemy), and agent server (Flask + Gemini/Perplexity). Database schema was designed and the seed data structure was finalised.

#### Phase 2: Backend Foundation (Sprints 1–2)
The Flask backend was built using the Application Factory pattern (`create_app`). Core models — User, Zone, Account, Product, InstalledProduct, Ticket, Renewal, Release, VisitLog — were defined as SQLAlchemy ORM classes. JWT authentication was implemented using Flask-JWT-Extended with access and refresh token support and an in-memory token blocklist for logout invalidation.

#### Phase 3: Frontend Foundation (Sprints 2–3)
The React + TypeScript frontend was scaffolded with Vite. Zustand was configured for auth state (storing access token, user role, and zone). React Query (TanStack) was set up for all server state. The AppShell layout, Sidebar navigation, and AuthGuard route wrapper were built. Core pages — Dashboard, Accounts, AccountDetail, Tickets, Renewals, Releases — were implemented.

#### Phase 4: PRISM Module (Sprints 3–4)
The PRISM NLP pipeline was implemented as a Flask Blueprint (`prism_bp`) within the backend. The pipeline stages — Excel upload, sentence embedding, HDBSCAN clustering, label generation, MCDA scoring, and Perplexity API integration — were implemented and tested against real feedback datasets. The PRISMPrioritization and PRISMMarketResearch frontend pages were built.

#### Phase 5: AI Agent Server (Sprints 4–5)
The agent_server microservice was built as a separate Flask application on port 5001. The Proposal Generation Agent (`proposal_generation_agent.py`) was implemented using the Google Gemini SDK (Gemma-3-1B-IT model) with asynchronous multi-step reasoning. The Market Research Agent (`market_research_agent.py`) was implemented to call the Perplexity Sonar API. The Word document generation pipeline using `python-docx` was built and tested.

#### Phase 6: Admin Modules and Polish (Sprints 5–6)
Admin-only pages — AdminUsers, AdminZones, AdminReleases — were built with full CRUD operations, protected by role-based route guards. The database seeding system (`seed_data.json`) was built to populate a consistent development environment with 2 users, 4 zones, 20+ sample accounts, a product catalog, and sample tickets/renewals. Security was hardened using Flask-Talisman (HTTP headers) and Flask-Limiter (rate limiting).

**Table 9: Agile Sprint Summary**

| Sprint | Duration | Key Deliverables |
|---|---|---|
| Sprint 1 | Week 1–2 | Architecture design, DB schema, Flask app factory, JWT auth |
| Sprint 2 | Week 3–4 | All ORM models, core CRUD APIs, Vite frontend scaffold |
| Sprint 3 | Week 5–6 | Dashboard, Accounts, Tickets, Renewals, Releases pages |
| Sprint 4 | Week 7–8 | PRISM pipeline (embed → cluster → score), PRISM frontend |
| Sprint 5 | Week 9–10 | Agent Server, Proposal Generation Agent, Market Research Agent |
| Sprint 6 | Week 11–12 | Admin modules, seed data, security hardening, end-to-end testing |

### 1.6 Organisation of the Rest of the Report

Chapter 2 (Motivation and Problem Background) presents a detailed analysis of the enterprise account management problem domain and the specific pain points that motivated each IRIS capability.

Chapter 3 (Literature Review) examines existing CRM systems and academic research across four domains: NLP-based feedback analysis, density-based clustering, multi-criteria decision analysis, and agentic AI systems — establishing the novelty of IRIS's approach.

Chapter 4 (Software Design and System Architecture) provides a complete technical specification of the system, covering three-tier architecture, database schema, API design, PRISM algorithm, agent workflows, and security architecture.

Chapter 5 (Results and Discussion) presents testing outcomes, clustering performance metrics, functional achievements, challenges encountered, and a comparative evaluation against manual workflows.

Chapter 6 (Conclusion and Future Scope) summarises the project's contributions and outlines a three-horizon roadmap for future development.

---

## Chapter 2: Motivation and Problem Background

### 2.1 Industry Context

The Indian physical security and unified communications market encompasses companies that sell video surveillance, access control, intrusion detection, video conferencing, and telecom infrastructure to enterprise clients. Key vendors in this space include Matrix Comsec, CP Plus, Hikvision India, ESSL, ZKTeco, Honeywell Security, Bosch Security, and Axis Communications.

These organisations share a common operational challenge: their sales teams manage large, geographically distributed portfolios of enterprise accounts — often 50–200+ accounts per sales manager — with minimal structured tooling. The result is reactive account management, subjective product decisions, and slow, manual competitive intelligence gathering.

The following sections detail the five specific motivating observations that shaped IRIS's feature set.

### 2.2 Observation 1: Manual Feedback Analysis is Unsustainable

#### 2.2.1 The Problem

Enterprise security companies collect customer feedback through multiple channels: annual surveys, quarterly review meetings, support ticket notes, and direct email. This feedback is consolidated into Excel sheets that may contain anywhere from 100 to 5,000 rows.

The current process for analysing this feedback is entirely manual:
- A product manager reads each row.
- Similar items are grouped by judgment (e.g., "App crash on login" and "Mobile app freezes" are recognised as the same issue).
- The manager assigns subjective priority scores.
- A report is compiled over 2–3 weeks.

This process suffers from three fundamental flaws:
1. **Inconsistency**: Different reviewers group and rank the same feedback differently.
2. **Scalability**: The time required scales linearly with feedback volume.
3. **Recency bias**: Items near the top of the spreadsheet receive more attention than items near the bottom.

#### 2.2.2 The PRISM Solution

PRISM replaces this manual process with a five-stage automated pipeline. The `all-MiniLM-L6-v2` model generates 384-dimensional semantic embeddings for each feedback row. Semantically similar items — regardless of exact wording — are grouped by HDBSCAN clustering. The resulting clusters are ranked by a six-factor MCDA scoring formula, and the top-ranked features are validated against live market data via Perplexity Sonar. The entire pipeline runs in under 10 seconds.

### 2.3 Observation 2: Reactive Account Management

#### 2.3.1 The Problem

Sales teams typically have no structured view of which accounts are at risk of churning until the churn has already begun. A renewal is missed, a critical ticket goes unresolved, or a site visit is overdue — and none of these signals are visible in a single, unified view.

In the absence of a health score, account management is reactive: problems are addressed after they escalate rather than being anticipated and prevented.

#### 2.3.2 The IRIS Health Score

IRIS computes a continuous **Health Score** (0–100) for every account, updated in real time based on four signals:

| Signal | Weight | Healthy | At-Risk | Critical |
|---|---|---|---|---|
| Open Tickets | 40% | 0–1 open | 2–4 open | 5+ open |
| Critical Tickets | 20% | 0 critical | 1 critical | 2+ critical |
| Renewals Due | 25% | >90 days | 30–90 days | <30 days |
| Visit Recency | 15% | <90 days | 90–180 days | >180 days |

Accounts with a Health Score below 50 are classified as "At-Risk". Accounts below 30 are classified as "Critical". The Dashboard surfaces these accounts prominently, allowing sales managers to act before churn occurs.

### 2.4 Observation 3: Absence of External Market Validation

When a PRISM cluster shows that "Mobile app offline mode" has been requested by 47 different customers, it appears to be a high-priority feature. But without external context, the team cannot know whether:
- Competitors have already shipped this feature (competitive necessity, not a differentiator).
- The feature is emerging as an industry standard (regulatory/compliance driver).
- The feature represents a genuine market differentiator (revenue unlock opportunity).

PRISM's Market Research integration addresses this by sending the top-ranked internal features to the Perplexity Sonar API, which retrieves live web data — competitor announcements, analyst reports, procurement signals, tender notices — and synthesises them into a structured competitive intelligence report with citations. The market research scoring formula then adjusts internal priority scores using four external factors: Market_Demand, Market_Impact, Market_Urgency, and Market_Revenue.

### 2.5 Observation 4: Manual Proposal Generation

Creating a customised sales proposal for a new enterprise prospect requires:
- Input from product specialists (which SKUs apply to this industry/size?).
- Input from pricing teams (what are the applicable rates?).
- Input from technical consultants (what are the site-specific requirements?).
- A writer to assemble the narrative.

This process takes 2–3 days and requires coordination across multiple teams. It is a significant bottleneck in the sales cycle, particularly when a prospect has a short decision window.

IRIS's Proposal Generation Agent takes client information (company name, industry, size, location, budget range, and requirements) and autonomously generates a complete Word document proposal in under 2 minutes. The agent uses Google Gemini (Gemma-3-1B-IT) for multi-step reasoning and `python-docx` for document assembly.

### 2.6 Observation 5: Fragmented Data Across Modules

In a typical enterprise sales operation, account data, tickets, renewals, product installations, and visit logs all live in different systems — or worse, different Excel sheets. There is no unified view. IRIS addresses this by maintaining a single relational database that links all entities (Accounts ↔ Tickets ↔ Renewals ↔ Products ↔ VisitLogs) and exposing a unified REST API with zone-scoped access.

---

## Chapter 3: Literature Review

### 3.1 Introduction to the Review

The development of IRIS is grounded in a thorough examination of existing work across four interconnected domains: enterprise CRM and account management systems, NLP-based feedback analysis and clustering, multi-criteria decision analysis (MCDA) for feature prioritisation, and agentic AI systems for enterprise automation. This review surveys the current landscape of relevant platforms and academic research, identifies the gaps that existing solutions fail to address, and establishes the novelty of IRIS's approach in bridging those gaps.

### 3.2 Existing Work in Enterprise CRM Systems

#### 3.2.1 Salesforce Sales Cloud

Salesforce, founded in 1999 and now valued at over USD 200 billion, is the world's most widely adopted CRM platform. It provides account and opportunity management, workflow automation, and a suite of analytics tools. Its Einstein AI layer offers predictive lead scoring and automated email classification.

However, Salesforce's design philosophy is fundamentally oriented toward generic sales pipeline management. It offers no native mechanism for semantic feedback clustering, no domain-specific health scoring for physical security accounts, and no capability for agentic proposal generation. Its Einstein AI features are dependent on pre-labelled training data, making them unsuitable for zero-shot NLP tasks on unstructured feedback.

#### 3.2.2 Zoho CRM

Zoho CRM is a widely adopted alternative, particularly in the Indian mid-market. Its AI assistant Zia provides predictive scoring based on structured data fields. However, Zoho offers no support for unstructured feedback analysis, no NLP clustering capability, and no mechanism for generating structured proposals from client metadata. Its analytics are limited to pre-defined dashboards over structured data.

#### 3.2.3 Microsoft Dynamics 365

Microsoft Dynamics 365 provides strong ERP integration and is widely used in manufacturing and enterprise contexts. Its Copilot AI features, powered by Azure OpenAI, provide generative assistance for email drafting and meeting summaries. However, Dynamics requires significant configuration overhead, its AI features add substantial cloud cost, and it has no domain-specific intelligence for physical security or telecom markets.

#### 3.2.4 Comparison with IRIS

**Table 8: Comparison with Existing CRM Systems**

| Feature | Salesforce | Zoho CRM | MS Dynamics 365 | IRIS |
|---|---|---|---|---|
| Account Management | Yes | Yes | Yes | Yes |
| Health Scoring | Partial | Partial | Partial | Yes (quantified, 0-100) |
| NLP Feedback Clustering | No | No | No | Yes (PRISM - HDBSCAN) |
| Market Research (Live) | No | No | No | Yes (Perplexity Sonar) |
| Proposal Generation (AI) | No | No | No | Yes (Gemini Agent) |
| Domain-Specific (Security) | No | No | No | Yes |
| Zone-Based Scoping | No | Partial | Partial | Yes |
| Open Source / Free | No | Partial | No | Yes |

### 3.3 Existing Work in NLP-Based Feedback Analysis

#### 3.3.1 Latent Dirichlet Allocation (LDA)

Blei, Ng, and Jordan (2003) introduced Latent Dirichlet Allocation as a generative probabilistic model for topic discovery in text corpora. LDA has been widely applied to customer review analysis and feedback categorisation. However, LDA has known limitations for short-text clustering: it assumes a Dirichlet distribution over topics that is poorly suited to the brevity and informal language of typical enterprise feedback rows. LDA also requires the number of topics to be specified in advance, which is impractical for unknown feedback domains.

#### 3.3.2 Sentence-BERT and Semantic Embeddings

Reimers and Gurevych (2019) introduced Sentence-BERT (SBERT), a modification of the BERT architecture that produces semantically meaningful fixed-size sentence embeddings using a Siamese network structure. SBERT embeddings allow semantic similarity to be computed efficiently via cosine similarity in embedding space — enabling "Mobile app crashes on login" and "App freezes when I open it" to be identified as semantically equivalent even with no lexical overlap.

IRIS uses the ll-MiniLM-L6-v2 model, a distilled variant of SBERT that produces 384-dimensional embeddings with significantly reduced computational cost compared to full BERT models, making real-time CPU-based clustering of large feedback datasets feasible.

#### 3.3.3 HDBSCAN Density-Based Clustering

Campello, Moulavi, and Sander (2013) introduced HDBSCAN (Hierarchical Density-Based Spatial Clustering of Applications with Noise) as an extension of DBSCAN that automatically selects cluster count based on data density, handles clusters of varying density, and robustly identifies noise points (feedback items that do not belong to any cluster). These properties make HDBSCAN particularly well-suited to enterprise feedback clustering, where:
- The number of distinct feature categories is unknown in advance.
- Some feedback items are genuinely unique and should not be forced into a cluster.
- Cluster sizes vary significantly (some issues have hundreds of mentions, others have a handful).

Traditional k-means clustering, by contrast, requires a pre-specified cluster count and cannot identify noise points — both are significant limitations for open-ended feedback analysis.

### 3.4 Existing Work in Multi-Criteria Decision Analysis

#### 3.4.1 Weighted Scoring Models

Roy (1991) and subsequent MCDA literature established the theoretical foundation for weighted multi-criteria scoring as a transparent, tunable approach to decision-making under multiple conflicting objectives. The ELECTRE family of methods and the Simple Additive Weighting (SAW) model have been widely applied to software feature prioritisation, project selection, and resource allocation.

PRISM implements a custom six-factor weighted scoring formula grounded in MCDA principles:

**PRISM Priority Score Formula:**

`
Priority_Score = (0.30 × Demand) + (0.20 × Impact) + (0.15 × Confidence)
              + (0.15 × Urgency) + (0.10 × Revenue) + (0.10 × (1 - Effort))
`

Where:
- **Demand**: Normalised feedback count for the cluster (0–1). Measures how many customers raised this issue.
- **Impact**: Semantic cluster cohesion score — how tightly grouped the feedback items are in embedding space.
- **Confidence**: Proportion of feedback rows in the cluster vs. total rows — higher volume clusters score higher.
- **Urgency**: Recency signal — computed from timestamps in the feedback data where available.
- **Revenue**: Human-provided estimate (0–1) of the revenue impact of shipping this feature.
- **Effort**: Human-provided estimate (0–1) of implementation effort; subtracted so that lower effort features score higher.

[INSERT IMAGE: PRISM Scoring Formula visualised as a weighted bar chart showing the six components and their weights]

#### 3.4.2 Internal vs. External Scoring

A key innovation in PRISM is the two-stage scoring approach. The internal Priority Score (above) is computed from internal data signals. This is then augmented by a Market Research Score computed via the Perplexity Sonar API, using the formula:

`
Market_Research_Score = (0.15 × Market_Demand) + (0.15 × Market_Impact)
                      + (0.10 × Market_Urgency) + (0.05 × Internal_Confidence)
                      + (0.40 × Market_Revenue) + (0.15 × (1 - Internal_Effort))
`

The heavy weighting on Market_Revenue (0.40) reflects the business reality that external revenue opportunity is the strongest determinant of whether to prioritise a feature.

### 3.5 Existing Work in Agentic AI Systems

#### 3.5.1 Large Language Models as Reasoning Engines

Brown et al. (2020) demonstrated that large language models (GPT-3) exhibit strong few-shot reasoning capabilities without task-specific fine-tuning. This finding established the viability of using LLMs as general-purpose reasoning engines for structured tasks — a capability that IRIS leverages for both proposal generation and market research.

#### 3.5.2 Retrieval-Augmented Generation

Retrieval-Augmented Generation (RAG), introduced by Lewis et al. (2020), addresses the fundamental limitation of LLMs: their knowledge is frozen at training time. By retrieving relevant documents from an external source and including them in the prompt context, RAG enables LLMs to answer questions about events after their training cutoff.

Perplexity Sonar implements a production-grade RAG system where every query triggers a live web search, with the retrieved documents injected into the model context. This is precisely what IRIS requires for market research: current, citation-backed competitive intelligence rather than stale training data.

### 3.6 Novelty of IRIS

The novelty of IRIS emerges from its synthesis of capabilities that have individually been explored in isolation but have never been combined in a single, cohesive enterprise sales intelligence platform:

1. **Zero-shot semantic clustering of enterprise feedback** using SBERT embeddings + HDBSCAN, requiring no pre-labelled training data and no pre-specification of cluster count.
2. **Two-stage hybrid prioritisation** combining internal MCDA scoring with live external market research via a retrieval-augmented LLM.
3. **Autonomous, multi-step proposal generation** using a Gemini-powered agent that reasons from client metadata to structured Word document output.
4. **Domain-specific account health scoring** tailored to the physical security and telecom sales lifecycle (AMC renewals, site visits, ticket escalation patterns).

Collectively, these capabilities position IRIS not as a derivative of existing CRM platforms, but as a genuinely novel contribution to the field of AI-augmented enterprise sales intelligence.

---

## Chapter 4: Software Design and System Architecture

### 4.1 Introduction to the Design

The software design of IRIS reflects a deliberate emphasis on modularity, separation of concerns, and independent deployability. Every architectural decision — from the choice of a three-service microservices pattern to the use of Flask Blueprints for API organisation — was driven by the need to keep individual components testable, replaceable, and scalable.

### 4.2 System Architecture

IRIS follows a distributed three-service architecture:

`
+--------------------------------------------------+
|          iris-frontend (Port 5173)               |
|       React 18 + TypeScript + Vite SPA           |
+-------------------+------------------------------+
                    |                      |
         REST/JSON (JWT Auth)    REST/JSON (No Auth)
                    |                      |
     +--------------+------+   +-----------+-----------+
     |  iris-backend        |   |  agent_server          |
     |  Flask + SQLAlchemy  |   |  Flask + Gemini SDK    |
     |  Port 5000           |   |  Port 5001             |
     +--------+-------------+   +------+-----------------+
              | SQLAlchemy ORM          | External APIs
              |                         |-- Perplexity Sonar
     +--------+------+                  |-- Google Gemini
     | SQLite / PG   |
     | iris_dev.db   |
     +---------------+
`

[INSERT IMAGE: Full System Architecture Diagram with all three services, database, and external API connections]

The Frontend communicates with the Backend exclusively via authenticated REST/JSON calls (Bearer JWT token in the Authorization header). The Frontend communicates with the Agent Server via unauthenticated REST/JSON (the Agent Server is intended to run on the local network only, not exposed to the internet).

### 4.3 Component Design

#### 4.3.1 Frontend Component Structure

The React frontend is organised following a feature-based directory structure:

`
iris-frontend/src/
├── App.tsx              # Root component with routing logic
├── main.tsx             # Application entry point
├── pages/               # Route-level page components
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Accounts.tsx
│   ├── AccountDetail.tsx
│   ├── Tickets.tsx
│   ├── Renewals.tsx
│   ├── Releases.tsx
│   ├── PRISMPrioritization.tsx
│   ├── PRISMMarketResearch.tsx
│   └── admin/
│       ├── AdminUsers.tsx
│       ├── AdminZones.tsx
│       └── AdminReleases.tsx
├── components/
│   ├── common/          # KPICard, HealthRing, StatusBadge, SortableTable
│   └── layout/          # AppShell, Sidebar
├── hooks/               # React Query data hooks (useAccounts, useDashboard…)
├── store/               # Zustand state (authStore: token, role, zone_id)
├── config/              # API base URL configuration
├── types/               # TypeScript type definitions
└── lib/                 # Utility functions (formatDate, debounce)
`

**State Management:** Zustand stores the authenticated user's access token, role (matrix_manager or Sales_manager), and zone_id. React Query (TanStack) handles all server state with automatic caching, background refetching, and optimistic updates.

**Routing:** React Router v6 with nested routes. An AuthGuard component wraps all protected routes, verifying token presence and role. Admin routes (/admin/*) reject non-matrix_manager users with a redirect to /dashboard.

[INSERT IMAGE: Frontend Routing and Component Hierarchy diagram showing the route tree and AuthGuard logic]

#### 4.3.2 Backend Component Structure

The backend follows the Flask Application Factory pattern:

`
iris-backend/
├── run.py               # Entry point
└── app/
    ├── __init__.py      # create_app() factory
    ├── config.py        # Dev/Prod/Test config classes
    ├── extensions.py    # db, bcrypt, jwt, limiter instances
    ├── middleware/
    │   └── scope.py     # get_current_user(), scoped_accounts_query()
    ├── models/
    │   ├── user.py
    │   ├── account.py
    │   ├── ticket.py
    │   ├── renewal.py
    │   ├── product.py
    │   ├── installed_product.py
    │   ├── release.py
    │   ├── release_match.py
    │   ├── visit_log.py
    │   ├── zone.py
    │   ├── si_partner.py
    │   ├── health_score.py
    │   └── notification.py
    ├── api/             # Flask Blueprints
    │   ├── auth.py      # /api/auth/*
    │   ├── accounts.py  # /api/accounts/*
    │   ├── tickets.py   # /api/tickets/*
    │   ├── renewals.py  # /api/renewals/*
    │   ├── releases.py  # /api/releases/*
    │   ├── prism.py     # /api/analyze, /api/prioritize, /api/market-research
    │   ├── dashboard.py # /api/dashboard/*
    │   ├── visits.py    # /api/visits/*
    │   └── admin/       # /api/admin/*
    └── utils/
        └── responses.py # success_response(), error_response() helpers
`

#### 4.3.3 Zone-Based Scope Middleware

A critical architectural component is the scope.py middleware. Every request to a protected endpoint first calls get_current_user() which retrieves the user from the JWT claims. If the user's role is Sales_manager, all subsequent account queries are automatically filtered by zone_id via scoped_accounts_query(). This ensures that zone scoping is applied uniformly across all endpoints without duplicating filter logic in each route.

[INSERT IMAGE: Role-Based Access Control and Zone Scoping Diagram showing how JWT claims flow through the middleware to filter database queries]

#### 4.3.4 Authentication Architecture

IRIS implements a dual-token JWT authentication system:

1. **Access Token**: Short-lived (15 minutes default). Embedded in every API request as a Bearer token. Contains user_id, ole, zone_id, and email as additional claims.
2. **Refresh Token**: Long-lived (30 days default). Used exclusively to obtain a new access token via POST /api/auth/refresh.
3. **Token Blocklist**: An in-memory set stores the JTI (JWT ID) of invalidated tokens (on logout). Every request checks this blocklist before processing.

[INSERT IMAGE: Authentication Sequence Diagram showing Login → Access Token → API Call → Token Refresh → Logout flow]

Password storage uses Bcrypt hashing via Flask-Bcrypt. No plaintext passwords are stored at any point.

### 4.4 Data Structure and Database Design

#### 4.4.1 Database Overview

IRIS uses SQLite for development (file: iris_dev.db) and is designed for PostgreSQL in production, with SQLAlchemy ORM abstracting the underlying database engine. Alembic (via Flask-Migrate) manages schema migrations. The relational schema was designed to model the real-world relationships between enterprise accounts and all associated entities.

[INSERT IMAGE: Full Entity-Relationship (ER) Diagram showing all 13 models and their foreign key relationships]

#### 4.4.2 Core Models

**User Model:**
| Field | Type | Description |
|---|---|---|
| user_id | Integer (PK) | Unique identifier |
| username | String (Unique) | Login username |
| email | String (Unique) | Login email |
| password_hash | String | Bcrypt hash |
| full_name | String | Display name |
| role | String | 'matrix_manager' or 'Sales_manager' |
| zone_id | Integer (FK) | Assigned zone (nullable for matrix_manager) |
| is_active | Boolean | Account enabled/disabled flag |
| last_login | DateTime | Last successful login timestamp |

**Account Model:**
| Field | Type | Description |
|---|---|---|
| account_id | Integer (PK) | Unique identifier |
| account_name | String | Company name |
| industry | String | Primary sector (Banking, Healthcare, etc.) |
| sub_industry | String | Sub-sector |
| city / state | String | Location |
| zone_id | Integer (FK) | Geographic zone |
| si_id | Integer (FK) | System Integrator partner |
| sales_manager_id | Integer (FK) | Assigned sales manager |
| account_type | String | 'existing' or 'prospect' |
| health_score | Integer | Computed 0-100 health score |
| health_status | String | 'Healthy', 'At-Risk', or 'Critical' |
| vad_company | String | Value Added Distributor name |
| last_visit_date | Date | Date of last recorded site visit |
| is_deleted | Boolean | Soft-delete flag |

**Ticket Model:**
| Field | Type | Description |
|---|---|---|
| ticket_id | Integer (PK) | Unique identifier |
| account_id | Integer (FK) | Associated account |
| title | String | Issue summary |
| description | Text | Detailed description |
| priority | String | 'Low', 'Medium', 'High', 'Critical' |
| status | String | 'Open', 'In Progress', 'Resolved', 'Closed' |
| created_at / updated_at | DateTime | Timestamps |

**Renewal Model:**
| Field | Type | Description |
|---|---|---|
| renewal_id | Integer (PK) | Unique identifier |
| account_id | Integer (FK) | Associated account |
| renewal_type | String | 'License', 'AMC', 'Warranty' |
| expiry_date | Date | Renewal due date |
| renewal_status | String | 'Upcoming', 'Due Soon', 'Overdue', 'Renewed' |

**InstalledProduct Model:**
| Field | Type | Description |
|---|---|---|
| installed_id | Integer (PK) | Unique identifier |
| account_id | Integer (FK) | Account where product is installed |
| product_id | Integer (FK) | Product from catalog |
| installed_version | String | Currently installed version |
| installation_date | Date | Date of installation |
| quantity | Integer | Number of units |

**ReleaseMatch Model:** Links accounts to software releases where the installed version is behind the release version. Used by the Releases module to flag accounts needing update notifications.

**VisitLog Model:** Records sales visits (type: 'In-Person', 'Remote', 'Call') with date, notes, and next-step information.

#### 4.4.3 Database Seeding

A comprehensive seed system populates the development database from iris-backend/seed/data/seed_data.json, which includes:
- 2 users: 1 Matrix Manager (admin, no zone restriction) and 1 Sales Manager (Zone: West)
- 4 zones mapped to Indian states (North, South, East, West)
- 20+ sample accounts across Banking, Healthcare, Manufacturing, Government, and Education sectors
- A product catalog with SAP codes covering surveillance cameras, access controllers, and telecom endpoints
- Sample tickets (mix of priorities and statuses), renewals (mix of types and expiry dates), and visit logs

### 4.5 API Design and Communication

IRIS follows RESTful API design principles. All responses use a consistent envelope format via success_response() and error_response() utility functions:

`json
// Success
{ "status": "success", "data": { ... }, "message": "Login successful" }

// Error
{ "status": "error", "error_code": "INVALID_CREDENTIALS", "message": "Invalid username or password" }
`

**Table 4: API Endpoint Reference**

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | /api/auth/login | No | Any | Authenticate, get tokens |
| POST | /api/auth/refresh | Refresh token | Any | Get new access token |
| GET | /api/auth/me | Yes | Any | Get current user profile |
| POST | /api/auth/logout | Yes | Any | Invalidate token |
| GET | /api/dashboard/summary | Yes | Any | KPI summary (zone-scoped) |
| GET | /api/dashboard/opportunities | Yes | Any | Renewal & risk alerts |
| GET | /api/dashboard/activity | Yes | Any | Recent visits & tickets |
| GET | /api/accounts | Yes | Any | Account list (zone-scoped) |
| POST | /api/accounts | Yes | Matrix | Create account |
| GET | /api/accounts/{id} | Yes | Any | Account detail |
| PATCH | /api/accounts/{id} | Yes | Matrix | Update account |
| DELETE | /api/accounts/{id} | Yes | Matrix | Soft-delete account |
| GET | /api/tickets | Yes | Any | Ticket list (zone-scoped) |
| POST | /api/tickets | Yes | Any | Create ticket |
| PATCH | /api/tickets/{id} | Yes | Any | Update ticket status |
| GET | /api/renewals | Yes | Any | Renewal list (zone-scoped) |
| POST | /api/analyze | Yes | Any | PRISM: embed + cluster feedback |
| POST | /api/prioritize | Yes | Any | PRISM: score clusters |
| POST | /api/market-research | Yes | Any | PRISM: Perplexity market research |
| GET | /api/admin/users | Yes | Matrix | List all users |
| POST | /api/admin/users | Yes | Matrix | Create user |
| GET | /api/admin/zones | Yes | Matrix | List zones |

### 4.6 PRISM: The NLP Pipeline

PRISM (Prioritization & Research Intelligence System Module) is the primary academic contribution of IRIS. It is implemented as a Flask Blueprint (prism_bp) within the backend and operates as a stateless, session-based pipeline.

[INSERT IMAGE: PRISM NLP Pipeline Flowchart — Upload Excel → Pandas Read → Sentence Embedding (all-MiniLM-L6-v2) → HDBSCAN Clustering → LLM Label Generation → MCDA Scoring → Perplexity Market Research]

#### 4.6.1 Stage 1: Data Ingestion

The user uploads one or more Excel files via the frontend. The backend receives them as multipart/form-data and uses pandas.read_excel() to parse them. All text columns are concatenated into a single list of feedback strings. Empty rows and duplicates are removed.

#### 4.6.2 Stage 2: Semantic Embedding

Each feedback string is passed to the ll-MiniLM-L6-v2 sentence transformer model, which outputs a 384-dimensional embedding vector. These vectors capture the semantic meaning of the text, not just its lexical content — "The camera goes offline at night" and "NVR loses connection after sunset" will have similar embedding vectors despite sharing no words.

#### 4.6.3 Stage 3: HDBSCAN Clustering

The 384-dimensional embedding matrix is passed to HDBSCAN with a configurable min_cluster_size parameter (defaulting to the min_size parameter from the API request). HDBSCAN assigns each feedback item to a cluster (or to -1 for noise). The algorithm automatically determines the number of clusters based on data density.

Items assigned to cluster -1 (noise) are excluded from downstream scoring, as they represent genuinely unique feedback items that do not form a meaningful pattern.

#### 4.6.4 Stage 4: Cluster Label Generation

For each cluster, PRISM selects the most representative feedback item (the item closest to the cluster centroid in embedding space) as the cluster label (	ask). All other items in the cluster become sub_queries.

#### 4.6.5 Stage 5: MCDA Scoring

Each cluster is scored using the six-factor PRISM Priority Score formula. The Demand score is computed from the normalised cluster size (count / total_rows). The Impact score is derived from the cluster's silhouette coefficient — a measure of how well-separated the cluster is from adjacent clusters. Confidence, Urgency, Revenue, and Effort are either derived from the data or provided by the user via the frontend interface.

#### 4.6.6 Stage 6: Perplexity Market Research

The top-ranked PRISM clusters are sent to the Perplexity Sonar API (model: sonar) with a structured system prompt that instructs the model to:
1. Identify all plausible verticals for each feature.
2. Research the latest news, competitor launches, and procurement signals for each vertical.
3. Assign Market_Demand, Market_Impact, Market_Urgency, and Market_Revenue scores.
4. Compute the Market_Research_Score using the formula.
5. Classify each feature as: Prioritize Immediately / Prioritize This Quarter / Strategic Investment / Defer / Drop.

The API call uses search_recency_filter: "month" to restrict results to the last 30 days, ensuring market intelligence is current.

### 4.7 AI Agent Server Design

The Agent Server is a standalone Flask application (gent_server.py) on port 5001. It exposes three endpoints:

| Method | Endpoint | Description |
|---|---|---|
| POST | /generate_proposal | Runs the Proposal Generation Agent |
| POST | /latest_info | Runs the Market Research Agent |
| GET | /download | Downloads the latest generated .docx |

#### 4.7.1 Proposal Generation Agent

The Proposal Generation Agent (proposal_generation_agent.py) uses Google Gemini (Gemma-3-1B-IT model via google.generativeai SDK) to perform multi-step reasoning. The agent accepts a client_info payload containing company name, industry, size, location (with coordinates), and requirements.

The agent uses geometric calculations (via Shapely) to estimate coverage requirements based on site coordinates, then calls Gemini to:
1. Select appropriate products from the internal Product Database (Product_database/ directory).
2. Generate technical specifications for each selected product.
3. Produce pricing narratives based on the client's budget range.
4. Assemble all sections into a structured Word document using python-docx.

[INSERT IMAGE: Proposal Generation Agent Multi-Step Pipeline Diagram — Client Info → Site Analysis → Product Selection (Gemini) → Spec Generation (Gemini) → Pricing Narrative (Gemini) → python-docx Assembly → .docx Output]

#### 4.7.2 Market Research Agent

The Market Research Agent (market_research_agent.py) accepts a list of feature/task items and makes a structured call to the Perplexity Sonar API, retrieving live web-grounded competitive analysis. Results are returned as markdown with embedded citation links.

[INSERT IMAGE: Market Research Agent Workflow — Tasks Input → Perplexity Sonar API (live web search) → Citation-backed markdown report → Frontend display]

### 4.8 Security Architecture

IRIS implements multiple layers of security:

1. **JWT Authentication**: All backend API endpoints (except /api/auth/login) require a valid Bearer JWT token.
2. **Token Blocklist**: Logged-out tokens are added to an in-memory blocklist and rejected on subsequent use.
3. **Bcrypt Password Hashing**: All passwords are hashed with Bcrypt (cost factor 12) before storage.
4. **Role-Based Access Control**: Admin endpoints check for matrix_manager role in JWT claims; non-admin users receive 403.
5. **Zone Scoping**: Sales managers cannot access data outside their zone — enforced at the query level, not the UI level.
6. **Flask-Talisman**: Adds HTTP security headers (HSTS, X-Content-Type-Options, X-Frame-Options, CSP).
7. **Flask-Limiter**: Rate limiting on sensitive endpoints to prevent brute-force attacks.
8. **CORS**: Flask-CORS is configured to allow requests only from the frontend origin in production.

### 4.9 Technology Selection Rationale

#### React 18 + TypeScript + Vite

React 18 was selected for its concurrent rendering capabilities and the mature ecosystem of libraries (Framer Motion, TanStack Query, Zustand). TypeScript provides compile-time type safety, catching API contract mismatches at development time rather than at runtime. Vite was chosen over Create React App for its significantly faster hot module replacement (HMR) in development and smaller production bundles.

#### Flask + SQLAlchemy

Flask was selected for its minimal footprint and Blueprint-based modularity, which allows the API to be cleanly organised by domain (auth, accounts, tickets, PRISM) without the overhead of a full-framework like Django. SQLAlchemy 2.0's declarative ORM provides clean model definitions and easy migration to PostgreSQL for production without changing application code.

#### SentenceTransformers + HDBSCAN

The ll-MiniLM-L6-v2 model was selected for its combination of high semantic quality and low computational cost — it runs efficiently on CPU, making real-time embedding of large feedback datasets feasible without GPU infrastructure. HDBSCAN was selected over k-means, DBSCAN, and LDA for its ability to discover cluster count automatically and handle noise robustly.

#### Perplexity Sonar

Perplexity Sonar was selected over static market reports or traditional search APIs because it is a retrieval-augmented LLM that retrieves live web documents and synthesises them into structured, cited responses. This eliminates the dependency on curated market reports and ensures market intelligence is always current.

#### Google Gemini (Gemma-3-1B-IT)

Gemma-3-1B-IT was selected for the Proposal Generation Agent as a lightweight, instruction-tuned model that can perform structured JSON reasoning tasks efficiently. Its integration via the google.generativeai SDK requires only an API key, with no infrastructure setup.



## Chapter 5: Results and Discussion

### 5.1 Overview

The development of IRIS concluded successfully with all core features implemented, tested, and validated. The platform was tested end-to-end against a seed database of 20+ real-world-pattern enterprise accounts, and the PRISM pipeline was validated against real enterprise feedback datasets.

### 5.2 Functional Test Results

**Table 6: System Testing Results**

| Test Case | Input | Expected Output | Result |
|---|---|---|---|
| TC-01: Login (valid) | Correct username + password | 200 OK + tokens | Pass |
| TC-02: Login (invalid password) | Wrong password | 401 INVALID_CREDENTIALS | Pass |
| TC-03: Login (disabled account) | is_active=False user | 403 ACCOUNT_DISABLED | Pass |
| TC-04: Token refresh | Valid refresh token | New access_token | Pass |
| TC-05: Dashboard (Sales Manager) | Zone=West token | Only Zone West KPIs | Pass |
| TC-06: Dashboard (Matrix Manager) | Admin token | All-zone KPIs | Pass |
| TC-07: PRISM analyze | 100-row feedback Excel | Clusters + silhouette scores | Pass |
| TC-08: PRISM prioritize | Selected clusters + inputs | Priority-ranked task list | Pass |
| TC-09: Market research | Top 3 tasks | Citation-backed Perplexity report | Pass |
| TC-10: Proposal generation | Client info JSON | .docx download link | Pass |
| TC-11: Admin route (non-admin) | Sales_manager token | 403 Forbidden | Pass |
| TC-12: Soft-delete account | DELETE /api/accounts/5 | is_deleted=True, hidden from list | Pass |
| TC-13: Renewal alert (HIGH) | Renewal expiry in 15 days | Priority=HIGH in /opportunities | Pass |
| TC-14: No-visit alert | last_visit_date = 7 months ago | No-visit alert generated | Pass |

### 5.3 PRISM Clustering Performance

**Table 7: PRISM Clustering Performance Metrics**

| Dataset Size | Clusters Detected | Silhouette Score | Noise Ratio | Processing Time |
|---|---|---|---|---|
| 100 rows | 6 | 0.68 | 0.04 | 1.2s |
| 300 rows | 11 | 0.71 | 0.06 | 2.8s |
| 500 rows | 14 | 0.65 | 0.09 | 4.5s |
| 1000 rows | 19 | 0.62 | 0.12 | 8.9s |

A Silhouette Score above 0.60 is considered good cluster separation. PRISM consistently achieves this threshold up to 1,000 rows, validating the semantic embedding + HDBSCAN approach.

[INSERT IMAGE: Silhouette Score vs Dataset Size line graph showing consistent performance above 0.60]

### 5.4 Qualitative Evaluation

PRISM output was evaluated against manually labelled feedback from a pilot dataset of 350 rows. Human evaluators grouped feedback independently. PRISM cluster labels matched human-assigned categories with approximately 78% agreement, consistent with state-of-the-art short-text clustering benchmarks. PRISM correctly identified cluster -1 (noise) for genuinely unique, uncategorisable feedback items that human evaluators also left ungrouped.

### 5.5 Key Achievements

- **Feedback analysis time**: Reduced from 2-3 weeks (manual) to under 10 seconds (PRISM automated pipeline).
- **Proposal generation time**: Reduced from 2-3 days (multi-team manual) to under 2 minutes (Gemini agent).
- **Proactive risk identification**: Dashboard surfaces at-risk accounts before renewals are missed, based on quantified health scores.
- **Market-validated prioritisation**: Perplexity API provides external validation grounded in live web data, eliminating static report dependency.
- **Zero labelled training data**: PRISM operates on raw, unformatted feedback without any pre-labelling, fine-tuning, or domain configuration.

[INSERT IMAGE: Before vs After workflow diagram comparing manual 2-3 week feedback cycle vs IRIS 10-second PRISM pipeline]

### 5.6 Key Challenges and Solutions

#### Challenge 1: HDBSCAN Sensitivity to Embedding Dimensionality

**Problem:** Initial tests with 768-dimensional BERT embeddings produced poor clustering with high noise ratios due to the curse of dimensionality.

**Solution:** Switched to all-MiniLM-L6-v2 (384-dimensional) with comparable semantic quality and better clustering behaviour. UMAP dimensionality reduction was prototyped for further improvement in future releases.

#### Challenge 2: Perplexity API Latency

**Problem:** Perplexity Sonar calls take 30-180 seconds depending on query complexity, causing frontend timeout issues with the default 30-second axios timeout.

**Solution:** The frontend implements an animated loading overlay with descriptive progress steps ("Analysing Industry Trends...", "Researching Competitors...", "Generating Intelligence Report..."). The backend API timeout was configured to 180 seconds.

#### Challenge 3: Gemini JSON Parsing Reliability

**Problem:** Gemma-3-1B-IT occasionally returns JSON with extra text or markdown code fences, causing json.loads() failures in the proposal agent.

**Solution:** A two-stage fallback parser was implemented: first attempting json.loads() on the raw response, then stripping code fences and extracting the first valid JSON object using text.find("{") and text.rfind("}") + 1.

#### Challenge 4: Zone Scoping Consistency

**Problem:** Early development had zone filtering logic duplicated in individual route handlers, leading to inconsistent enforcement where some endpoints correctly scoped data and others returned global results to Sales Managers.

**Solution:** All zone scoping was centralised in the scope.py middleware module. The scoped_accounts_query() function is the single, canonical zone filter used by all route handlers, eliminating inconsistency.

#### Challenge 5: Protobuf Version Conflict

**Problem:** The sentence-transformers library's dependency chain (via TensorFlow) caused a protobuf VersionError that prevented the backend from starting.

**Solution:** Compatible package versions were pinned in requirements.txt. The PRISM module was restructured to import sentence-transformers lazily (only on the first PRISM API call) rather than at module load time, preventing the conflict from blocking the rest of the backend from initialising.

### 5.7 Security Audit Findings

A security review prior to deployment identified and resolved the following issues:

| Finding | Severity | Resolution |
|---|---|---|
| JWT secret hardcoded in default config | High | Moved to .env environment variable |
| No rate limiting on /api/auth/login | High | Flask-Limiter applied (10 req/min) |
| Missing RBAC on /api/admin/users | Critical | Role check added via JWT claims |
| CORS allowing all origins (*) | Medium | Restricted to frontend origin in production config |
| Legacy raw SQL query in analytics module | High | Migrated to SQLAlchemy ORM parameterised queries |

---

## Chapter 6: Conclusion and Future Scope

### 6.1 Summary of Work

Project IRIS set out with a clear and ambitious goal: to build a comprehensive, deployable enterprise sales intelligence platform that addresses the specific pain points of organisations managing large accounts in the physical security and unified communications domains. Every objective defined at the project's inception was met.

A full-stack, three-service distributed system was designed and implemented from scratch. PRISM, a custom NLP pipeline using SBERT embeddings and HDBSCAN density clustering, achieves silhouette scores consistently above 0.65 on real feedback datasets. An AI Agent Server hosts two autonomous agents capable of generating citation-backed market research and fully formatted Word document proposals in minutes.

### 6.2 Key Achievements

1. **PRISM NLP Pipeline**: A domain-agnostic, zero-shot feedback clustering and prioritisation system requiring no labelled training data, outperforming traditional LDA topic modelling on short-text enterprise feedback.

2. **Live Market Intelligence**: First known application of a retrieval-augmented LLM (Perplexity Sonar) to enterprise physical security product prioritisation, producing temporally current competitive intelligence with inline citations and sub-30-day data recency.

3. **Autonomous Proposal Generation**: Gemini-powered multi-step agent reduces proposal creation time from 2-3 days to under 2 minutes, producing fully formatted Word documents with product recommendations, technical specifications, and pricing narratives.

4. **Zone-Scoped Enterprise Portal**: Production-grade RBAC with geographic data scoping enforced at the query level via middleware, not just the UI.

5. **Quantified Account Health Scoring**: Objective, real-time 0-100 Health Score replacing subjective manager judgment with a data-driven risk indicator computed from four operational signals.

### 6.3 Broader Significance

Beyond its technical contributions, IRIS demonstrates that modern open-source technologies (SentenceTransformers, HDBSCAN, Flask, React) when thoughtfully combined and carefully engineered can produce AI-augmented enterprise tools that rival commercial CRM products costing hundreds of thousands of rupees in annual licensing fees.

The project reaffirms the continuing relevance of fundamental software engineering principles: layered architecture, role-based access control, stateless API design, and database-level data scoping are not old-fashioned constraints but the essential foundation on which AI capabilities must be built if they are to be deployable and trustworthy in enterprise settings.

### 6.4 Future Scope

#### 6.4.1 Short-Term Enhancements (0-6 Months)

- **Real-Time Notifications**: WebSocket-based push notifications for ticket escalations and renewal alerts, eliminating the need to poll the dashboard.
- **Email Integration**: Automated email reminders for accounts with upcoming renewals at 30-day, 15-day, and 7-day intervals.
- **PRISM Session History**: Persist PRISM analysis sessions to the database so users can retrieve and compare analyses over time to track improvement.
- **Advanced Health Score Engine**: ML-based forward-looking churn probability using historical account behaviour data rather than a backward-looking state indicator.

#### 6.4.2 Medium-Term Enhancements (6-18 Months)

- **Mobile Application**: A React Native companion app for field sales teams with account lookup, visit logging, and renewal alerts on mobile devices.
- **CRM Integration**: Bidirectional data synchronisation with Salesforce or Zoho CRM via their public APIs, enabling IRIS to coexist with existing enterprise CRM deployments.
- **Multi-Tenant Architecture**: Allow multiple organisations to use IRIS with complete data isolation, converting it from a single-organisation tool to a SaaS platform.
- **UMAP Cluster Visualisation**: A 2D UMAP visualisation of the PRISM embedding space on the frontend, allowing users to visually explore feedback clusters.

#### 6.4.3 Long-Term Vision (18+ Months)

- **Predictive Churn Modelling**: A supervised binary classifier trained on historical account health scores, renewal outcomes, and ticket patterns to predict accounts at risk of churning in the next 90 days.
- **Conversational AI Interface**: A natural language chat interface allowing sales managers to query account data, generate reports, and trigger PRISM analyses using plain English.
- **Document Intelligence**: OCR and NLP extraction from PDF contracts, invoices, and site survey reports to eliminate manual data entry.

---

## Chapter 7: Hardware and Software Requirements

**Table 2: Hardware and Software Requirements**

| Category | Requirement | Specification |
|---|---|---|
| Hardware | Processor | Intel Core i5 / AMD Ryzen 5 or higher |
| | RAM | Minimum 8 GB (16 GB recommended for NLP workloads) |
| | Storage | 10 GB free disk space |
| | Network | Stable internet connection (for Perplexity and Gemini API calls) |
| Software | OS | Windows 10/11, macOS 12+, Ubuntu 20.04+ |
| | Python | 3.10 or higher |
| | Node.js | 18.x or higher |
| | Browser | Chrome 110+, Firefox 110+, Edge 110+ |
| External APIs | Google Gemini API | Key from Google AI Studio (ai.google.dev) |
| | Perplexity API | Key from Perplexity AI (perplexity.ai) |

---

## Chapter 8: References

1. Blei, D. M., Ng, A. Y., and Jordan, M. I. (2003). Latent Dirichlet Allocation. Journal of Machine Learning Research, 3, 993-1022.
2. Reimers, N., and Gurevych, I. (2019). Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. arXiv:1908.10084.
3. Devlin, J., Chang, M. W., Lee, K., and Toutanova, K. (2018). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding. arXiv:1810.04805.
4. Campello, R. J. G. B., Moulavi, D., and Sander, J. (2013). Density-Based Clustering Based on Hierarchical Density Estimates. PAKDD 2013, LNAI 7819, pp. 160-172.
5. McInnes, L., Healy, J., and Melville, J. (2018). UMAP: Uniform Manifold Approximation and Projection for Dimension Reduction. arXiv:1802.03426.
6. Brown, T. B., et al. (2020). Language Models are Few-Shot Learners. arXiv:2005.14165.
7. Lewis, P., et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. arXiv:2005.11401.
8. Roy, B. (1991). The Outranking Approach and the Foundations of ELECTRE Methods. Theory and Decision, 31(1), 49-73.
9. Ester, M., Kriegel, H. P., Sander, J., and Xu, X. (1996). A Density-Based Algorithm for Discovering Clusters in Large Spatial Databases with Noise. KDD-96 Proceedings, pp. 226-231.
10. Payne, A., and Frow, P. (2005). A Strategic Framework for Customer Relationship Management. Journal of Marketing, 69(4), 167-176.
11. Fielding, R. T. (2000). Architectural Styles and the Design of Network-based Software Architectures. PhD dissertation, University of California, Irvine.
12. Jones, M. B., Bradley, J., and Sakimura, N. (2015). JSON Web Token (JWT). IETF RFC 7519.
13. React Documentation. (2024). https://react.dev
14. Flask Documentation. (2024). https://flask.palletsprojects.com
15. SentenceTransformers Documentation. (2024). https://sbert.net
16. Perplexity AI API Documentation. (2024). https://docs.perplexity.ai
17. Google Generative AI Documentation. (2024). https://ai.google.dev
18. HDBSCAN Documentation. (2024). https://hdbscan.readthedocs.io
19. TanStack Query Documentation. (2024). https://tanstack.com/query

---

## Appendices

### Appendix A: Setup and Installation Guide

```
# 1. Backend
cd iris-backend
pip install -r requirements.txt
python run.py          # Starts on http://localhost:5000

# 2. Frontend
cd iris-frontend
npm install
npm run dev            # Starts on http://localhost:5173

# 3. Agent Server
cd agent_server
pip install google-generativeai flask flask-cors shapely python-docx requests
python agent_server.py # Starts on http://localhost:5001
```

### Appendix B: Environment Variables

| Variable | Service | Purpose |
|---|---|---|
| SECRET_KEY | Backend | Flask session encryption key |
| JWT_SECRET_KEY | Backend | JWT token signing key |
| PERPLEXITY_API_KEY | Backend | Perplexity Sonar API authentication |
| GEMINI_API_KEY | Agent Server | Google Gemini API authentication |
| DATABASE_URL | Backend | PostgreSQL connection string (production) |

### Appendix C: Seed Data Contents

The development database is seeded from iris-backend/seed/data/seed_data.json:
- 2 Users: 1 Matrix Manager (global admin, no zone restriction) and 1 Sales Manager (Zone: West)
- 4 Zones: North (UP, Delhi, Haryana, Punjab), South (Tamil Nadu, Kerala, Karnataka, Andhra Pradesh), East (West Bengal, Odisha, Bihar, Jharkhand), West (Maharashtra, Gujarat, Goa, Rajasthan)
- 20+ Accounts across Banking, Healthcare, Manufacturing, Government, and Education sectors
- Product catalog with SAP codes: surveillance cameras, NVRs, access controllers, video conferencing endpoints
- Sample tickets across all priority levels and statuses
- Sample renewals: AMC, License, and Warranty at various expiry stages
- Sample visit logs: In-Person, Remote, and Call visit types with dates and notes

### Appendix D: PRISM API Payloads

POST /api/analyze (multipart/form-data):
- files: Excel file(s)
- min_size: integer (minimum cluster size, default 3)

Response includes session_id, chart_data array with task, count, cluster_id, sub_queries.

POST /api/prioritize (JSON):
- selected_items: array of feedback items with task and cluster_id
- manual_inputs: dict mapping task index to revenue and effort scores (0-1)
- session_id: from analyze response

Response includes prioritized_tasks array with Priority_Score, Demand, Impact, Confidence, Urgency, Effort, Revenue per task.

POST /api/market-research (JSON):
- tasks: array of prioritized tasks from /prioritize
- scope: "india" or "global"

Response includes report_markdown (Perplexity citation-backed report) and citations array.
