"""PRISM Prioritization and Market Research blueprint."""
import io
import os
import re
import sys
import uuid
import pickle
import logging
import traceback
import numpy as np
import pandas as pd
import requests
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from scipy.spatial.distance import cosine
from sentence_transformers import SentenceTransformer

from app.utils.advanced_clustering import analyze_feedback_advanced, AdvancedTextPreprocessor, AdaptiveClusterer
from app.utils.responses import success_response, error_response

prism_bp = Blueprint('prism', __name__)
logger = logging.getLogger("PrismAPI")

# ------------------------------------------------------------
# SESSION MANAGEMENT (Simplified for Iris integration)
# ------------------------------------------------------------
class SessionManager:
    def __init__(self, storage_dir="sessions"):
        # Put sessions in the instance folder or a temporary directory
        self.storage_dir = os.path.join(os.getcwd(), "instance", storage_dir)
        if not os.path.exists(self.storage_dir):
            os.makedirs(self.storage_dir)

    def _get_path(self, session_id):
        safe_id = re.sub(r'[^a-zA-Z0-9-]', '', str(session_id))
        return os.path.join(self.storage_dir, f"{safe_id}.pkl")

    def save(self, session_id, **kwargs):
        path = self._get_path(session_id)
        data = {}
        if os.path.exists(path):
            try:
                with open(path, "rb") as f:
                    data = pickle.load(f)
            except Exception:
                data = {}
        data.update(kwargs)
        with open(path, "wb") as f:
            pickle.dump(data, f)

    def get(self, session_id, key):
        path = self._get_path(session_id)
        if os.path.exists(path):
            try:
                with open(path, "rb") as f:
                    data = pickle.load(f)
                    return data.get(key)
            except Exception:
                return None
        return None

session_manager = SessionManager()

# ------------------------------------------------------------
# HELPERS FROM PRISM
# ------------------------------------------------------------

SEVERITY_KEYWORDS = [
    (5, [
        r"\boffline\b", r"\bdown\b", r"\bnot\s+working\b", r"\bno\s+video\b", r"\bblack\s+screen\b",
        r"\bcrash\b", r"\bcrashed\b", r"\breboot\b", r"\brebooting\b", r"\bfail(ed|ure|ing)?\b", 
        r"\berror\b", r"\bdisconnect(ed|ion|ing)?\b", r"\bstream\s+drop\b", r"\bhang\b", r"\bfrozen\b",
        r"\bnot\s+responding\b", r"\bunresponsive\b", r"\bbroken\b", r"\bstopped\b", r"\bdead\b",
        r"\bunavailable\b", r"\boutage\b", r"\bcritical\b", r"\bsevere\b", r"\bemergency\b",
        r"\bcan'?t\s+(access|login|connect)\b", r"\bunable\s+to\b", r"\bno\s+connection\b",
        r"\btotal\s+failure\b", r"\bcompletely\s+broken\b", r"\bdata\s+loss\b", r"\bcorrupted\b"
    ]),
    (3, [
        r"\blag\b", r"\blagging\b", r"\blatency\b", r"\bslow\b", r"\bunstable\b", r"\bintermittent\b",
        r"\bpacket\s+loss\b", r"\bjitter\b", r"\bblurry\b", r"\bframe\s+drop\b", r"\bfreez(e|ing)\b",
        r"\bdelay(ed)?\b", r"\btimeout\b", r"\bbuffering\b", r"\bglitch(y|es)?\b", r"\bskip(ping)?\b",
        r"\bchoppy\b", r"\bstutter(ing)?\b", r"\bpoor\s+quality\b", r"\blow\s+quality\b",
        r"\bpixelated\b", r"\bdegraded\b", r"\binconsistent\b", r"\bunreliable\b",
        r"\bperformance\s+issue\b", r"\bnot\s+stable\b", r"\bkeeps\s+dropping\b",
        r"\boccasionally\s+fails\b", r"\bsometimes\s+crashes\b"
    ]),
    (1, [
        r"\bfeature\s+request\b", r"\benhancement\b", r"\bwould\s+like\b", r"\badd\b", r"\bsupport\b",
        r"\bimprove\b", r"\benable\b", r"\bupgrade\b", r"\bupdate\b", r"\bneed\s+to\b",
        r"\bwish\b", r"\bsuggestion\b", r"\brecommend\b", r"\bproposal\b", r"\bconsider\b",
        r"\bnice\s+to\s+have\b", r"\boptional\b", r"\badditional\b", r"\bextra\b",
        r"\bcan\s+you\s+add\b", r"\bplease\s+add\b", r"\bwant\b", r"\brequire\b",
        r"\bcustomization\b", r"\bconfigure\b", r"\bflexibility\b"
    ]),
]

def impact_score_from_texts(texts: list[str]) -> float:
    if not texts: return 0.2
    hits, total = 0, 0
    for t in texts:
        t = (t or "").lower()
        if not t: continue
        total += 1
        best = 0
        for sev, patterns in SEVERITY_KEYWORDS:
            for pat in patterns:
                if re.search(pat, t):
                    best = max(best, sev)
                    break
        hits += best
    if total == 0: return 0.2
    raw = hits / (total * 5.0)
    return float(np.clip(raw if raw > 0 else 0.2, 0.0, 1.0))

def urgency_score_from_last_seen(last_seen: pd.Timestamp, today: pd.Timestamp = None) -> float:
    if pd.isna(last_seen): return 0.4
    if today is None: today = pd.Timestamp.now()
    days = max(0.0, (today - last_seen).total_seconds() / 86400.0)
    return float(np.clip(np.exp(-days / 30.0), 0.0, 1.0))

def confidence_from_embeddings(embeddings: np.ndarray, labels: np.ndarray) -> dict[int, float]:
    conf = {}
    unique = sorted(set(labels.tolist()))
    for lab in unique:
        if lab == -1:
            conf[int(lab)] = 0.2
            continue
        idx = np.where(labels == lab)[0]
        if len(idx) < 2:
            conf[int(lab)] = 0.4
            continue
        vecs = embeddings[idx]
        centroid = vecs.mean(axis=0)
        dists = [cosine(centroid, v) for v in vecs]
        mean_dist = float(np.clip(np.mean(dists), 0.05, 0.80))
        conf[int(lab)] = float(np.clip(1.0 - (mean_dist - 0.05) / (0.80 - 0.05), 0.0, 1.0))
    return conf

def normalize_0_1(series: pd.Series) -> pd.Series:
    mx = float(series.max()) if len(series) else 0.0
    if mx <= 0: return pd.Series(np.zeros(len(series)), index=series.index, dtype=float)
    return (series.astype(float) / mx).clip(0, 1)

W = dict(D=0.15, I=0.15, U=0.10, C=0.05, R=0.40, E=0.15)

def compute_priority_row(row) -> float:
    return float(
        W["D"]*row["Demand"] +
        W["I"]*row["Impact"] +
        W["U"]*row["Urgency"] +
        W["C"]*row["Confidence"] +
        W["R"]*row["Revenue"] +
        W["E"]*(1.0 - row["Effort"])
    )

def find_column(df, keywords):
    cols = [str(c).strip().lower() for c in df.columns]
    for kw in keywords:
        for idx, c in enumerate(cols):
            if kw in c: return df.columns[idx]
    return None

def best_effort_date_col(df):
    c = find_column(df, ["date", "created", "time", "timestamp", "datetime", "date_time"])
    if c: return c
    for col in df.columns:
        try:
            if pd.to_datetime(df[col], errors="coerce").notna().mean() > 0.6: return col
        except: continue
    return None

def best_effort_feedback_col(df):
    keywords = ["feedback", "comment", "message", "note", "description", "text", "issue", "summary"]
    candidates = [c for c in df.columns if df[c].dtype == 'object']
    if not candidates: return None
    best_col, max_score = None, -1
    for col in candidates:
        try:
            sample = df[col].dropna().astype(str).head(50)
            if not len(sample): continue
            score = (sample.str.count(' ').mean() * 5) + (sample.str.len().mean() * 0.1)
            if score > max_score: max_score, best_col = score, col
        except: continue
    return best_col

# ------------------------------------------------------------
# ROUTES
# ------------------------------------------------------------

@prism_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "version": "1.1.0-iris-integrated"}), 200

@prism_bp.route("/analyze", methods=["POST"])
@jwt_required()
def analyze():
    try:
        if 'files' not in request.files:
            return jsonify({"error": "No files uploaded"}), 400
        files = request.files.getlist("files")
        min_size = int(request.form.get("min_size", 3))
        start_date = request.form.get("start_date")
        end_date = request.form.get("end_date")
        all_rows = []
        for f in files:
            try:
                df = pd.read_excel(f)
                date_col = best_effort_date_col(df)
                feedback_col = best_effort_feedback_col(df)
                if not feedback_col: continue
                out = pd.DataFrame()
                out["source_file"] = [f.filename] * len(df)
                out["date"] = pd.to_datetime(df[date_col], errors="coerce") if date_col else pd.NaT
                out["feedback_raw"] = df[feedback_col].astype(str)
                all_rows.append(out)
            except Exception as e:
                logger.warning(f"Error reading {f.filename}: {e}")
        if not all_rows:
            return jsonify({"error": "No usable data found"}), 400
        data = pd.concat(all_rows, ignore_index=True)
        if start_date:
            sd = pd.to_datetime(start_date)
            data = data[(data["date"].isna()) | (data["date"] >= sd)]
        if end_date:
            ed = pd.to_datetime(end_date)
            data = data[(data["date"].isna()) | (data["date"] <= ed)]
        preprocessor = AdvancedTextPreprocessor()
        data["feedback_clean"] = data["feedback_raw"].apply(preprocessor.clean)
        data = data[data["feedback_clean"].str.len() >= 3].copy()
        if len(data) < 1:
            return jsonify({"error": "Insufficient data after filtering"}), 400
        unique_feedback = data["feedback_clean"].unique().tolist()
        cluster_results = analyze_feedback_advanced(
            texts=unique_feedback,
            min_cluster_size=min_size,
            auto_tune=True,
            use_multimodal=True
        )
        unique_labels = cluster_results['labels']
        names_map = cluster_results['cluster_names']
        unique_embeddings = cluster_results['embeddings']
        clustering_metrics = cluster_results['metrics']
        text_to_cluster = {text: label for text, label in zip(unique_feedback, unique_labels)}
        data["cluster_id"] = data["feedback_clean"].map(text_to_cluster)
        data = data.dropna(subset=["cluster_id"])
        data["cluster_id"] = data["cluster_id"].astype(int)
        data["task"] = data["cluster_id"].apply(lambda i: names_map.get(int(i), "Unknown"))
        task_counts = data.groupby(["task", "cluster_id"], as_index=False).size().rename(columns={"size":"count"}).sort_values("count", ascending=False)
        request_session_id = str(uuid.uuid4())
        session_manager.save(
            request_session_id,
            embeddings=unique_embeddings,
            labels=unique_labels,
            data=data,
            csv_bytes=task_counts.to_csv(index=False).encode("utf-8")
        )
        chart_data = []
        for _, row in task_counts.iterrows():
            cluster_id = int(row['cluster_id'])
            cluster_rows = data[data['cluster_id'] == cluster_id]
            unique_queries = cluster_rows.groupby("feedback_raw").size().reset_index(name="count").sort_values("count", ascending=False)
            LIMIT = 15
            sub_queries = [{"feedback_raw": str(r["feedback_raw"]), "count": int(r["count"])} for _, r in unique_queries.head(LIMIT).iterrows()]
            if len(unique_queries) > LIMIT:
                sub_queries.append({"feedback_raw": f"Other variations ({len(unique_queries)-LIMIT} items)", "count": int(unique_queries.iloc[LIMIT:]["count"].sum())})
            chart_data.append({"task": str(row['task']), "count": int(row['count']), "cluster_id": cluster_id, "sub_queries": sub_queries})
        return jsonify({
            "session_id": request_session_id,
            "summary": {
                "total_rows": int(len(data)),
                "clusters_detected": int(clustering_metrics.get('n_clusters', 0)),
                "clustering_quality": {
                    "silhouette_score": float(clustering_metrics.get('silhouette_score', 0)),
                    "noise_ratio": float(clustering_metrics.get('noise_ratio', 0)),
                }
            },
            "chart_data": chart_data
        })
    except Exception as e:
        logger.error(f"Analysis Error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@prism_bp.route("/download/<session_id>", methods=["GET"])
def download(session_id):
    csv_bytes = session_manager.get(session_id, "csv_bytes")
    if not csv_bytes: return jsonify({"error": "Session expired or invalid"}), 404
    return send_file(io.BytesIO(csv_bytes), mimetype="text/csv", as_attachment=True, download_name=f"task_analysis_{session_id}.csv")

@prism_bp.route("/prioritize", methods=["POST"])
@jwt_required()
def prioritize():
    try:
        data_json = request.get_json()
        selected_items = data_json.get("selected_items", [])
        manual_inputs = data_json.get("manual_inputs", {})
        session_id = data_json.get("session_id")
        if not session_id: return jsonify({"error": "Session ID required"}), 400
        embeddings = session_manager.get(session_id, "embeddings")
        labels = session_manager.get(session_id, "labels")
        latest_data = session_manager.get(session_id, "data")
        if embeddings is None or labels is None or latest_data is None:
            return jsonify({"error": "Session data expired. Please re-run analysis."}), 404
        if not selected_items: return jsonify({"error": "No items to prioritize"}), 400
        task_metrics, today_ts = [], pd.Timestamp.now()
        conf_map = confidence_from_embeddings(embeddings, labels)
        for idx, item in enumerate(selected_items):
            cluster_id, task_name, feedback_raw = int(item["cluster_id"]), str(item["task"]), item["feedback_raw"]
            cluster_data = latest_data[latest_data["cluster_id"] == cluster_id]
            last_seen = cluster_data["date"].max() if "date" in cluster_data.columns else pd.NaT
            task_key = f"task_{idx}"
            revenue = manual_inputs.get(task_key, {}).get("revenue", 0.5)
            effort = manual_inputs.get(task_key, {}).get("effort", 0.5)
            task_metrics.append({
                "task": task_name, "feedback_raw": feedback_raw, "cluster_id": cluster_id,
                "count": item.get("count", 1), "last_seen": str(last_seen) if not pd.isna(last_seen) else None,
                "Impact_raw": impact_score_from_texts([feedback_raw]),
                "Urgency_raw": urgency_score_from_last_seen(last_seen, today=today_ts),
                "Confidence_raw": float(conf_map.get(cluster_id, 0.4)),
                "Revenue_raw": revenue, "Effort_raw": effort,
            })
        metrics_df = pd.DataFrame(task_metrics)
        metrics_df["Demand"] = normalize_0_1(metrics_df["count"])
        metrics_df["Impact"] = metrics_df["Impact_raw"].clip(0, 1)
        metrics_df["Urgency"] = metrics_df["Urgency_raw"].clip(0, 1)
        metrics_df["Confidence"] = metrics_df["Confidence_raw"].clip(0, 1)
        metrics_df["Revenue"] = metrics_df["Revenue_raw"].clip(0, 1)
        metrics_df["Effort"] = metrics_df["Effort_raw"].clip(0, 1)
        metrics_df["priority_score"] = metrics_df.apply(compute_priority_row, axis=1)
        metrics_df = metrics_df.sort_values("priority_score", ascending=False).reset_index(drop=True)
        return jsonify({
            "prioritized_tasks": metrics_df[["task", "feedback_raw", "cluster_id", "count", "priority_score", "Demand", "Impact", "Urgency", "Confidence", "Revenue", "Effort"]].to_dict(orient="records"),
            "total_tasks": len(metrics_df)
        })
    except Exception as e:
        logger.error(f"Prioritization Error: {e}")
        return jsonify({"error": str(e)}), 500

MARKET_RESEARCH_SYSTEM_PROMPT = """You are a senior market intelligence analyst conducting rigorous external validation using real-world data.

This is NOT a generic assessment.

You must perform deep, multi-vertical, feature-isolated, evidence-based market research for EACH feature/task independently using current  external market signals.

Your analysis must resemble investment committee-level validation — not high-level industry commentary.

------------------------------------------------------------
TASK INTERPRETATION & DOMAIN ISOLATION (CRITICAL)
------------------------------------------------------------
The input list can contain tasks/features from ANY domain

For EACH feature/task, you must FIRST do domain discovery and isolation:

1) DOMAIN DISCOVERY:
- Infer the primary domain and sub-domain from the feature + feedback 
- Do NOT assume the domain from prior rows. Each row is independent.

2) DOMAIN ISOLATION:
- Research MUST remain within the inferred domain/sub-domain.
- Do NOT use umbrella reports from unrelated categories.
  

------------------------------------------------------------
COMPETITOR BENCHMARKING & URL ENFORCEMENT (CRITICAL)
------------------------------------------------------------
For EACH feature/task researched, you MUST include at least ONE competitor URL relevant to the identified domain/sub-domain.

- you MUST check this predefined competitor list:
  ESSL, ZKTeco, Hikvision, Suprema, IDEMIA, MANTRA, AXIS, GENTEC, Dahua, HID, Honeywell, Bosch, Anviz, Spectra, Spintly,
  Uniview, Hanwha Vision, Sony (Security Division), Panasonic i-Pro, FLIR/Teledyne FLIR, Vivotek, Avigilon (Motorola Solutions),
  CP Plus, Ezviz, TP-Link (Tapo/Omna), Pelco, GEOVISION, Mobotix, D-Link, Logitech (Circle), 3dEYE, Arecont Vision, IDIS,
  Infinova and use at least one URL from one of them.

Hard rule:
If no direct competitor launch exists for the exact feature/fix, link to the closest competitor “professional/enterprise/standard” equivalent page that demonstrates the market standard being matched.

------------------------------------------------------------
RECENCY, TRENDS, NEWS & TENDERS (MANDATORY)
------------------------------------------------------------
For each feature AND for each vertical explored, you must actively search and prioritize the most recent external signals:

Priority order:
1) Latest news/articles/trend coverage (prefer last 6–12 months; max 24 months)
2) Competitor launches/updates (≤24 months)
3) Tenders / RFPs / procurement signals (government or enterprise)
4) Regulatory/compliance updates (if relevant)
5) Analyst commentary specific to the feature sub-segment
6) Only then: sub-segment market reports (NOT broad umbrella reports)

------------------------------------------------------------
CRITICAL RESEARCH RULES
------------------------------------------------------------
SEGMENT BREADTH RULE:
For each feature, identify ALL plausible deployment verticals/use cases.
You must explore at least 2–3 distinct verticals per feature before assigning scores.
Each feature must be treated as a completely separate market investigation.
Do NOT reuse the same sources across multiple features 

SOURCE DIVERSITY RULE:
A single URL may appear in a maximum of 2 features total.
If already used twice, you MUST find a new source.

------------------------------------------------------------
STEP 1: FEATURE-ISOLATED, MULTI-VERTICAL MARKET RESEARCH
------------------------------------------------------------
For each feature/task:

A. Identify ALL plausible verticals or deployment contexts.

B. For EACH vertical:
- Search latest news + trends + tenders for the feature + vertical (last 24 months; prioritize last 6–12 months)
- Identify competitor products/launches targeting that vertical (domain-relevant competitor URLs required)
- Identify procurement signals (government or enterprise)
- Note regulatory/compliance drivers
- Determine whether adoption is Enterprise, SMB, or Government-led

C. Synthesize across verticals:
- Which verticals show strongest demand signals?
- Is demand expanding, stable, regulatory-driven, commodity, or declining?
- What is the aggregated addressable opportunity across verticals?

D. You must identify at least:
- One recent news/announcement source (≤24 months)
- One competitor-specific source (domain-relevant URL required)
- One market/analyst reference specific to a sub-segment
- One tender/procurement signal OR explicitly state: [No tender signal found]

E. Classify the feature as one of:
Competitive Necessity / Differentiator / Revenue Unlock / Defensive Parity Move / Low-Demand Niche Capability

------------------------------------------------------------
STEP 2: SCORING
------------------------------------------------------------
Assign scores strictly based on external evidence across all verticals researched.
Use 0.0–1.0 scale:

Market_Demand
Market_Impact
Market_Urgency
Market_Revenue

------------------------------------------------------------
STEP 3: FORMULA CALCULATION
------------------------------------------------------------
Calculate Market_Research_Score using EXACT formula:

Market_Research_Score =
(0.15 × Market_Demand)
+ (0.15 × Market_Impact)
+ (0.10 × Market_Urgency)
+ (0.05 × Internal_Confidence)
+ (0.40 × Market_Revenue)
+ (0.15 × (1 - Internal_Effort))

Show Market_Research_Score to 3 decimal places.

------------------------------------------------------------
STEP 4: FINAL RE-PRIORITIZATION
------------------------------------------------------------
Sort all features by Market_Research_Score (Highest to Lowest).

------------------------------------------------------------
STEP 5: OUTPUT FORMAT (STRICT)
------------------------------------------------------------
Your output MUST consist of TWO sections:

SECTION 1: STRUCTURED DATA TABLE
| Rank | Feature/Task | Verticals_Explored | Market_Research_Score | Market_Demand | Market_Impact | Market_Urgency | Market_Revenue | Internal_Confidence | Internal_Effort | Sources | Final_Recommendation |

Rules:
- Verticals_Explored comma-separated list.
- At least one Sources placeholder must correspond to a competitor URL relevant to that feature’s domain.
- Do NOT repeat identical source lists across features.

SECTION 2: EXECUTIVE MARKET SUMMARY
A concise 2-paragraph "Market Intelligence Brief":
- Paragraph 1: Key competitive shifts and domain-specific revenue opportunities.
- Paragraph 2: Strategic timing recommendation (When to execute and Why).

Final_Recommendation thresholds unchanged:
Prioritize Immediately (>=0.80)
Prioritize This Quarter (0.60-0.79)
Strategic Investment (0.40-0.59)
Defer (0.20-0.39)
Drop (<0.20)"""


@prism_bp.route("/market-research", methods=["POST"])
@jwt_required()
def market_research():
    try:
        api_key = os.environ.get("PERPLEXITY_API_KEY", "").strip()
        if not api_key: return jsonify({"error": "Perplexity API key not configured."}), 400
        data = request.get_json()
        prioritized_tasks = data.get("tasks", [])
        scope = data.get("scope", "global")
        if not prioritized_tasks: return jsonify({"error": "No prioritized tasks provided"}), 400
        scope_instruction = f"MARKET RESEARCH SCOPE: {'PAN-INDIA' if scope.lower() == 'india' else 'GLOBAL'}"
        task_list_str = f"{scope_instruction}\n\nINTERNAL PRIORITIZED LIST:\n"
        for t in prioritized_tasks:
            task_list_str += f"- Task: {t['task']}\n  Feedback: {t.get('feedback_raw', 'N/A')}\n  Internal_Confidence: {t.get('Confidence', 0.5):.2f}\n  Internal_Effort: {t.get('Effort', 0.5):.2f}\n"
        
        payload = {
            "model": "sonar",
            "messages": [
                {"role": "system", "content": MARKET_RESEARCH_SYSTEM_PROMPT},
                {"role": "user", "content": task_list_str}
            ],
            "temperature": 0.2, "top_p": 0.9, "search_recency_filter": "month",
            "web_search_options": {"user_location": {"country": "IN"}} if scope.lower() == 'india' else {}
        }
        response = requests.post("https://api.perplexity.ai/chat/completions", json=payload, headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}, timeout=180)
        if response.status_code != 200: return jsonify({"error": f"Perplexity API Error: {response.text}"}), 500
        result = response.json()
        report_markdown = result["choices"][0]["message"]["content"]
        citations = result.get("citations", [])
        for i, url in enumerate(citations, 1):
            report_markdown = report_markdown.replace(f"[{i}]", f"[LINK]({url}) ; ")
        return jsonify({"report_markdown": report_markdown, "citations": citations})
    except Exception as e:
        logger.error(f"Market Research Error: {e}")
        return jsonify({"error": str(e)}), 500
