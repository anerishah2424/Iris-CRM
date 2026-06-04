import io
import os
import re
import sys
import traceback
import json
import logging
import uuid
import pickle
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_talisman import Talisman
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from sentence_transformers import SentenceTransformer
from scipy.spatial.distance import cosine
from advanced_clustering import analyze_feedback_advanced, AdvancedTextPreprocessor

# Load .env file if it exists
from dotenv import load_dotenv
load_dotenv()

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("prism_api.log")
    ]
)
logger = logging.getLogger("PrismAPI")

# Perplexity AI (for chat and market research)
import requests

app = Flask(__name__)

# Security Headers (CSP, HSTS, etc.)
# Note: force_https=False for local dev. In prod, set to True.
talisman = Talisman(app, force_https=False)

# Rate Limiting: 100 requests per minute per IP
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["1000 per day", "100 per hour"],
    storage_uri="memory://",
)

# Enable CORS restricted to React dev server by default
# For production, this should be restricted to specific domains
CORS(app, resources={r"/api/*": {"origins": "*"}}) 

app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024  # 25MB

# ------------------------------------------------------------
# SESSION MANAGEMENT (Enterprise Pattern)
# Instead of true global variables, we use a simple store keyed by sessionId.
# In a real enterprise app, this would be Redis or a Database.
# ------------------------------------------------------------
class SessionManager:
    def __init__(self, storage_dir="sessions"):
        self.storage_dir = storage_dir
        if not os.path.exists(self.storage_dir):
            os.makedirs(self.storage_dir)

    def _get_path(self, session_id):
        # Ensure session_id is a safe filename
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
# WEIGHTED ALGORITHM - SCORING HELPERS
# ------------------------------------------------------------

# Keyword severity lexicon for impact scoring
SEVERITY_KEYWORDS = [
    # critical (5) - System failures, complete breakdowns
    (5, [
        r"\boffline\b", r"\bdown\b", r"\bnot\s+working\b", r"\bno\s+video\b", r"\bblack\s+screen\b",
        r"\bcrash\b", r"\bcrashed\b", r"\breboot\b", r"\brebooting\b", r"\bfail(ed|ure|ing)?\b", 
        r"\berror\b", r"\bdisconnect(ed|ion|ing)?\b", r"\bstream\s+drop\b", r"\bhang\b", r"\bfrozen\b",
        r"\bnot\s+responding\b", r"\bunresponsive\b", r"\bbroken\b", r"\bstopped\b", r"\bdead\b",
        r"\bunavailable\b", r"\boutage\b", r"\bcritical\b", r"\bsevere\b", r"\bemergency\b",
        r"\bcan'?t\s+(access|login|connect)\b", r"\bunable\s+to\b", r"\bno\s+connection\b",
        r"\btotal\s+failure\b", r"\bcompletely\s+broken\b", r"\bdata\s+loss\b", r"\bcorrupted\b"
    ]),
    # major (3) - Performance issues, partial failures
    (3, [
        r"\blag\b", r"\blagging\b", r"\blatency\b", r"\bslow\b", r"\bunstable\b", r"\bintermittent\b",
        r"\bpacket\s+loss\b", r"\bjitter\b", r"\bblurry\b", r"\bframe\s+drop\b", r"\bfreez(e|ing)\b",
        r"\bdelay(ed)?\b", r"\btimeout\b", r"\bbuffering\b", r"\bglitch(y|es)?\b", r"\bskip(ping)?\b",
        r"\bchoppy\b", r"\bstutter(ing)?\b", r"\bpoor\s+quality\b", r"\blow\s+quality\b",
        r"\bpixelated\b", r"\bdegraded\b", r"\binconsistent\b", r"\bunreliable\b",
        r"\bperformance\s+issue\b", r"\bnot\s+stable\b", r"\bkeeps\s+dropping\b",
        r"\boccasionally\s+fails\b", r"\bsometimes\s+crashes\b"
    ]),
    # minor / enhancement (1) - Feature requests, improvements
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
    """Auto impact score in [0,1] based on keyword matches in cluster texts."""
    if not texts:
        return 0.2  # Default baseline for empty texts

    hits = 0
    total = 0
    for t in texts:
        t = (t or "").lower()
        if not t:
            continue
        total += 1
        best = 0
        for sev, patterns in SEVERITY_KEYWORDS:
            for pat in patterns:
                if re.search(pat, t):
                    best = max(best, sev)
                    break
        hits += best  # 0,1,3,5
    if total == 0:
        return 0.2  # Default baseline

    # Normalize: max sev per row = 5
    raw = hits / (total * 5.0)
    
    # If no keywords matched, return baseline weight instead of 0
    if raw == 0.0:
        return 0.2  # Baseline weight for feedback with no severity keywords
    
    return float(np.clip(raw, 0.0, 1.0))

def urgency_score_from_last_seen(last_seen: pd.Timestamp, today: pd.Timestamp = None) -> float:
    """Auto urgency in [0,1] from last seen date (more recent = higher)."""
    if pd.isna(last_seen):
        return 0.4  # Baseline default when no date is available
    if today is None:
        today = pd.Timestamp.now()
    days = max(0.0, (today - last_seen).total_seconds() / 86400.0)

    # Exponential decay: 0 days -> 1.0, 30 days -> ~0.37, 90 days -> ~0.05
    score = float(np.exp(-days / 30.0))
    return float(np.clip(score, 0.0, 1.0))

def confidence_from_embeddings(embeddings: np.ndarray, labels: np.ndarray) -> dict[int, float]:
    """
    Cluster tightness confidence in [0,1].
    Uses mean cosine distance to centroid; tighter => higher confidence.
    """
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
        mean_dist = float(np.mean(dists))

        # Convert distance to confidence. Typical cosine dist range ~0.1..0.6
        # Clamp then invert.
        mean_dist = float(np.clip(mean_dist, 0.05, 0.80))
        conf_score = 1.0 - (mean_dist - 0.05) / (0.80 - 0.05)  # 0.05->1, 0.8->0
        conf[int(lab)] = float(np.clip(conf_score, 0.0, 1.0))
    return conf

def normalize_0_1(series: pd.Series) -> pd.Series:
    """Normalize a pandas Series to [0,1] range."""
    mx = float(series.max()) if len(series) else 0.0
    if mx <= 0:
        return pd.Series(np.zeros(len(series)), index=series.index, dtype=float)
    return (series.astype(float) / mx).clip(0, 1)

# Revenue-heavy weights (Effort is penalty)
W = dict(D=0.15, I=0.15, U=0.10, C=0.05, R=0.40, E=0.15)

def compute_priority_row(row) -> float:
    """Calculate weighted priority score for a task."""
    # Weights sum to 1.0 (0.15 + 0.15 + 0.10 + 0.05 + 0.40 + 0.15 = 1.0)
    # Using + (1 - Effort) keeps score in [0, 1] range while penalizing high effort
    return float(
        W["D"]*row["Demand"] +
        W["I"]*row["Impact"] +
        W["U"]*row["Urgency"] +
        W["C"]*row["Confidence"] +
        W["R"]*row["Revenue"] +
        W["E"]*(1.0 - row["Effort"])
    )

def find_column(df: pd.DataFrame, keywords: list[str]):
    cols = list(df.columns)
    cols_lower = [str(c).strip().lower() for c in cols]
    for kw in keywords:
        for idx, c in enumerate(cols_lower):
            if kw in c:
                return cols[idx]
    return None

def best_effort_date_col(df: pd.DataFrame):
    c = find_column(df, ["date", "created", "time", "timestamp", "datetime", "date_time"])
    if c is not None:
        return c
    for col in df.columns:
        try:
            parsed = pd.to_datetime(df[col], errors="coerce")
            if parsed.notna().mean() > 0.6:
                return col
        except Exception:
            continue
    return None

def best_effort_feedback_col(df: pd.DataFrame):
    # Potential keywords
    keywords = ["feedback", "comment", "message", "note", "description", "text", "issue", "summary"]
    
    candidates = []
    cols = list(df.columns)
    cols_lower = [str(c).strip().lower() for c in cols]
    
    # 1. Identify all candidate columns matching keywords
    for idx, c_lower in enumerate(cols_lower):
        for kw in keywords:
            if kw in c_lower:
                candidates.append(cols[idx])
                break
    
    # If no keyword matches, consider all object columns
    if not candidates:
        candidates = [c for c in df.columns if df[c].dtype == 'object']
        
    best_col = None
    max_score = -1
    
    # 2. Score candidates based on content (length and spaces)
    for col in candidates:
        try:
            # Sample first 50 non-null rows for efficiency
            sample = df[col].dropna().astype(str).head(50)
            if len(sample) == 0:
                continue
                
            # Score 1: Average length (IDs are short, feedback is long)
            avg_len = sample.str.len().mean()
            
            # Score 2: Space ratio (Sentences have more spaces than IDs)
            # Count spaces per row
            avg_spaces = sample.str.count(' ').mean()
            
            # Heuristic score: heavily weight spaces as IDs rarely have them
            score = (avg_spaces * 5) + (avg_len * 0.1)
            
            if score > max_score:
                max_score = score
                best_col = col
                
        except Exception:
            continue
            
    return best_col


@app.route("/api/health", methods=["GET"])
@limiter.exempt
def health_check():
    return jsonify({"status": "healthy", "version": "1.1.0-enterprise-poc"}), 200

@app.route("/api/analyze", methods=["POST"])
@limiter.limit("10 per minute")
def analyze():
    logger.info("New analysis request received")

    try:
        if 'files' not in request.files:
            sys.stderr.write("DEBUG: No files in request\n")
            return jsonify({"error": "No files uploaded"}), 400
        
        files = request.files.getlist("files")
        min_size = int(request.form.get("min_size", 3))  # Default 3
        # epsilon is now auto-tuned by default, or we can pass it if we disable auto-tune
        epsilon = float(request.form.get("epsilon", 0.35)) 
        start_date = request.form.get("start_date")
        end_date = request.form.get("end_date")

        all_rows = []
        warning_msgs = []

        for f in files:
            try:
                df = pd.read_excel(f)
                date_col = best_effort_date_col(df)
                feedback_col = best_effort_feedback_col(df)

                if feedback_col is None:
                    warning_msgs.append(f"{f.filename}: No feedback column found")
                    continue

                out = pd.DataFrame()
                out["source_file"] = [f.filename] * len(df)
                out["date"] = pd.to_datetime(df[date_col], errors="coerce") if date_col else pd.NaT
                out["feedback_raw"] = df[feedback_col].astype(str)
                all_rows.append(out)
            except Exception as e:
                warning_msgs.append(f"Error reading {f.filename}: {str(e)}")

        if not all_rows:
            return jsonify({"error": "No usable data found", "warnings": warning_msgs}), 400

        data = pd.concat(all_rows, ignore_index=True)
        
        if start_date:
            sd = pd.to_datetime(start_date)
            data = data[(data["date"].isna()) | (data["date"] >= sd)]
        if end_date:
            ed_ts = pd.to_datetime(end_date)
            data = data[(data["date"].isna()) | (data["date"] <= ed_ts)]

        # Use AdvancedTextPreprocessor
        preprocessor = AdvancedTextPreprocessor()
        data["feedback_clean"] = data["feedback_raw"].apply(preprocessor.clean)
        
        # Filter short feedback
        data = data[data["feedback_clean"].str.len() >= 3].copy()

        if len(data) < 1:
            return jsonify({"error": "Insufficient data after filtering", "rows": len(data)}), 400

        # CRITICAL FIX: Cluster only UNIQUE feedback texts
        unique_feedback = data["feedback_clean"].unique().tolist()
        print(f"DEBUG: Processing {len(unique_feedback)} unique feedback items (from {len(data)} total rows)")
        
        # Call Advanced Clustering
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
        
        # Create mapping from feedback_clean text to cluster_id
        text_to_cluster = {text: label for text, label in zip(unique_feedback, unique_labels)}
        
        # Map all rows to their cluster
        data["cluster_id"] = data["feedback_clean"].map(text_to_cluster)
        
        # Filter out rows that failed clustering
        data = data.dropna(subset=["cluster_id"])
        data["cluster_id"] = data["cluster_id"].astype(int)
        
        data["task"] = data["cluster_id"].apply(lambda i: names_map.get(int(i), "Unknown"))
        
        task_counts = (
            data.groupby(["task", "cluster_id"], as_index=False)
                .size()
                .rename(columns={"size":"count"})
                .sort_values("count", ascending=False)
        )

        # Generate a unique Session ID for this user/request
        request_session_id = str(uuid.uuid4())
        
        # Store results in SessionManager
        session_manager.save(
            request_session_id,
            embeddings=unique_embeddings,
            labels=unique_labels,
            data=data,
            csv_bytes=task_counts.to_csv(index=False).encode("utf-8")
        )

        logger.info(f"Analysis complete for session {request_session_id}")

        # task_counts already computed above

        # Prepare nested data
        chart_data = []
        for _, row in task_counts.iterrows():
            cluster_id = int(row['cluster_id'])
            
            # Filter rows for this specific cluster
            cluster_rows = data[data['cluster_id'] == cluster_id]
            
            # Get all unique raw queries in this cluster
            unique_queries = (
                cluster_rows.groupby("feedback_raw")
                .size()
                .reset_index(name="count")
                .sort_values("count", ascending=False)
            )
            
            LIMIT = 15
            top_queries = unique_queries.head(LIMIT)
            remaining_queries = unique_queries.iloc[LIMIT:]
            
            sub_queries = []
            for _, sq_row in top_queries.iterrows():
                sub_queries.append({
                    "feedback_raw": str(sq_row["feedback_raw"]),
                    "count": int(sq_row["count"])
                })
            
            # Add "Other" category if there are remaining items
            if not remaining_queries.empty:
                other_count = remaining_queries["count"].sum()
                sub_queries.append({
                    "feedback_raw": f"Other variations ({len(remaining_queries)} unique items)",
                    "count": int(other_count)
                })

            chart_data.append({
                "task": str(row['task']),
                "count": int(row['count']),
                "cluster_id": cluster_id,
                "sub_queries": sub_queries
            })
            
        return jsonify({
            "session_id": request_session_id,
            "summary": {
                "total_rows": int(len(data)),
                "clusters_detected": int(clustering_metrics.get('n_clusters', 0)),
                "clustering_quality": {
                    "silhouette_score": float(clustering_metrics.get('silhouette_score', 0)),
                    "noise_ratio": float(clustering_metrics.get('noise_ratio', 0)),
                    "optimal_epsilon": clustering_metrics.get('optimal_epsilon'),
                }
            },
            "chart_data": chart_data,
            "warnings": warning_msgs
        })
    except Exception as e:
        logger.error(f"Analysis Error: {str(e)}", exc_info=True)
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@app.route("/api/download/<session_id>", methods=["GET"])
def download(session_id):
    csv_bytes = session_manager.get(session_id, "csv_bytes")
    if not csv_bytes:
        return jsonify({"error": "Session expired or invalid"}), 404
    return send_file(
        io.BytesIO(csv_bytes),
        mimetype="text/csv",
        as_attachment=True,
        download_name=f"task_analysis_{session_id}.csv"
    )

@app.route("/api/prioritize", methods=["POST"])
def prioritize():
    """Apply weighted algorithm to selected to-do items."""
    try:
        data_json = request.get_json()
        selected_items = data_json.get("selected_items", [])
        manual_inputs = data_json.get("manual_inputs", {})
        session_id = data_json.get("session_id")
        
        if not session_id:
            return jsonify({"error": "Session ID required"}), 400
            
        embeddings = session_manager.get(session_id, "embeddings")
        labels = session_manager.get(session_id, "labels")
        latest_data = session_manager.get(session_id, "data")

        if embeddings is None or labels is None or latest_data is None:
            return jsonify({"error": "Session data expired or not found. Please re-run analysis."}), 404
        
        if not selected_items:
            return jsonify({"error": "No items to prioritize"}), 400
        
        task_metrics = []
        today_ts = pd.Timestamp.now()
        
        # Calculate confidence from embeddings
        conf_map = confidence_from_embeddings(embeddings, labels)
        
        for idx, item in enumerate(selected_items):
            cluster_id = int(item["cluster_id"])
            task_name = str(item["task"])
            feedback_raw = item["feedback_raw"]
            count = item.get("count", 1)
            
            # Get all feedback from this cluster
            cluster_data = latest_data[latest_data["cluster_id"] == cluster_id]
            
            # Last seen date
            last_seen = cluster_data["date"].max() if "date" in cluster_data.columns else pd.NaT
            
            # Auto scores
            texts = [feedback_raw]
            impact = impact_score_from_texts(texts)
            urgency = urgency_score_from_last_seen(last_seen, today=today_ts)
            confidence = float(conf_map.get(cluster_id, 0.4))
            
            # Manual inputs
            task_key = f"task_{idx}" 
            # Note: User might pass generic keys, but let's assume UI passes standard structure. 
            # If manual inputs are keyed by something else, we might need adjustment.
            # Assuming basic structure for now.
            revenue = manual_inputs.get(task_key, {}).get("revenue", 0.5)
            effort = manual_inputs.get(task_key, {}).get("effort", 0.5)
            
            task_metrics.append({
                "task": task_name,
                "feedback_raw": feedback_raw,
                "cluster_id": cluster_id,
                "count": count,
                "last_seen": str(last_seen) if not pd.isna(last_seen) else None,
                "Impact_raw": impact,
                "Urgency_raw": urgency,
                "Confidence_raw": confidence,
                "Revenue_raw": revenue,
                "Effort_raw": effort,
            })
        
        metrics_df = pd.DataFrame(task_metrics)
        
        # Normalize to 0..1 for scoring
        metrics_df["Demand"] = normalize_0_1(metrics_df["count"])
        metrics_df["Impact"] = metrics_df["Impact_raw"].clip(0, 1)
        metrics_df["Urgency"] = metrics_df["Urgency_raw"].clip(0, 1)
        metrics_df["Confidence"] = metrics_df["Confidence_raw"].clip(0, 1)
        metrics_df["Revenue"] = metrics_df["Revenue_raw"].clip(0, 1)
        metrics_df["Effort"] = metrics_df["Effort_raw"].clip(0, 1)
        
        # Priority score
        metrics_df["priority_score"] = metrics_df.apply(compute_priority_row, axis=1)
        
        # Sort
        metrics_df = metrics_df.sort_values("priority_score", ascending=False).reset_index(drop=True)
        
        prioritized_tasks = metrics_df[[
            "task", "feedback_raw", "cluster_id", "count", "priority_score",
            "Demand", "Impact", "Urgency", "Confidence", "Revenue", "Effort"
        ]].to_dict(orient="records")
        
        return jsonify({
            "prioritized_tasks": prioritized_tasks,
            "total_tasks": len(prioritized_tasks)
        })
        
    except Exception as e:
        traceback.print_exc(file=sys.stderr)
        return jsonify({"error": f"Prioritization Error: {str(e)}"}), 500

@app.route("/api/clustering-metrics", methods=["POST"])
def get_clustering_metrics():
    """
    New endpoint to get detailed clustering quality metrics
    """
    try:
        data = request.get_json() or {}
        session_id = data.get("session_id")
        
        if not session_id:
            return jsonify({"error": "Session ID required"}), 400
            
        embeddings = session_manager.get(session_id, "embeddings")
        labels = session_manager.get(session_id, "labels")
        
        if embeddings is None or labels is None:
            return jsonify({"error": "No clustering data available for this session"}), 404
        
        from advanced_clustering import AdaptiveClusterer
        
        clusterer = AdaptiveClusterer()
        metrics = clusterer.compute_cluster_metrics(embeddings, labels)
        
        return jsonify({
            "silhouette_score": metrics.silhouette,
            "davies_bouldin_score": metrics.davies_bouldin,
            "cluster_sizes": metrics.cluster_sizes,
            "noise_ratio": metrics.noise_ratio,
            "intra_cluster_distances": metrics.intra_cluster_distance,
            "inter_cluster_distance": metrics.inter_cluster_distance,
            "interpretation": {
                "silhouette": "Higher is better (range: -1 to 1). >0.5 is good.",
                "davies_bouldin": "Lower is better. <1.0 is good clustering.",
                "noise_ratio": "Lower is better. <0.2 is ideal."
            }
        })
    except Exception as e:
        logger.error(f"Metrics Error: {str(e)}")
        return jsonify({"error": str(e)}), 500



# ------------------------------------------------------------
# MARKET RESEARCH ENDPOINT
# ------------------------------------------------------------


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

@app.route("/api/market-research", methods=["POST"])
def market_research():
    """
    Simulate market research and re-prioritize tasks using Perplexity AI.
    """
    try:
        # Check for API key
        api_key = os.environ.get("PERPLEXITY_API_KEY", "").strip()
        if not api_key:
            return jsonify({
                "error": "Perplexity API key not configured."
            }), 400

        data = request.get_json()
        prioritized_tasks = data.get("tasks", [])
        scope = data.get("scope", "global")

        if not prioritized_tasks:
            return jsonify({"error": "No prioritized tasks provided"}), 400

        # Format the input list for the prompt
        scope_instruction = "MARKET RESEARCH SCOPE: GLOBAL (Analyze worldwide trends and links)."
        if scope.lower() == 'india':
            scope_instruction = "MARKET RESEARCH SCOPE: PAN-INDIA (Analyze trends, competitors, and links ONLY within the Indian market)."

        task_list_str = f"{scope_instruction}\n\nINTERNAL PRIORITIZED LIST:\n"
        for t in prioritized_tasks:
            f_text = t.get('feedback_raw', 'N/A')
            # Extract Internal Confidence and Effort (default to 0.5 if missing)
            conf = t.get('Confidence', 0.5)
            eff = t.get('Effort', 0.5)
            
            task_list_str += (
                f"- Task: {t['task']}\n"
                f"  Feedback: {f_text}\n"
                f"  Internal_Confidence: {conf:.2f}\n"
                f"  Internal_Effort: {eff:.2f}\n"
            )

        # Prepare web search options
        search_options = {
            "search_context_size": "medium"
        }
        
        # Apply location scoping if India is selected
        if scope.lower() == 'india':
            search_options["user_location"] = {
                "country": "IN"
            }

        # Call Perplexity API
        payload = {
            "model": "sonar",
            "messages": [
                {"role": "system", "content": MARKET_RESEARCH_SYSTEM_PROMPT},
                {"role": "user", "content": task_list_str}
            ],
            "temperature": 0.2,
            "top_p": 0.9,
            "return_images": False,
            "return_related_questions": False,
            "search_recency_filter": "month",
            "web_search_options": search_options,
            "stream": False,
            "presence_penalty": 0,
            "frequency_penalty": 1
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        response = requests.post(
            "https://api.perplexity.ai/chat/completions",
            json=payload,
            headers=headers,
            timeout=180
        )
        
        if response.status_code != 200:
            return jsonify({
                "error": f"Perplexity API Error ({response.status_code}): {response.text}"
            }), 500
            
        result = response.json()
        report_markdown = result["choices"][0]["message"]["content"]
        citations = result.get("citations", [])
        
        # Post-process: Replace [1], [2] with actual markdown links
        if citations:
            # Replace from highest to lowest index to avoid partial matches
            for i in range(len(citations), 0, -1):
                placeholder = f"[{i}]"
                url = citations[i-1]
                # Use a safe separator ' ; ' that doesn't break markdown table pipes
                replacement = f"[LINK]({url}) ; "
                report_markdown = report_markdown.replace(placeholder, replacement)
            
            logger.info(f"Replaced {len(citations)} citations with unique separator links")
        
        return jsonify({
            "report_markdown": report_markdown,
            "citations": citations
        })

    except Exception as e:
        traceback.print_exc(file=sys.stderr)
        return jsonify({"error": f"Market Research Error: {str(e)}"}), 500


if __name__ == "__main__":
    # Disable reloader to prevent unexpected restarts during AI processing
    # Re-enabled reloader for better dev flow
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=True, threaded=True)

