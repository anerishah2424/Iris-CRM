"""
Agentic AI Local Network Server
================================
Hosts an agentic AI assistant accessible to any device on your local network.
Uses the Anthropic API with tool-use (web search) for agentic capabilities.

Requirements:
    pip install anthropic flask flask-cors requests

Usage:
    python agentic_ai_server.py
    Then open http://<your-local-ip>:5000 on any device on the same network.
"""

import os
import json
import socket
import sys

# Ensure UTF-8 encoding for stdout to handle currency symbols in logs on Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from proposal_generation_agent import run_proposal_agent
from market_research_agent import run_market_research


# ── Configuration ─────────────────────────────────────────────────────────────

HOST = "0.0.0.0"   # Listen on all interfaces → reachable across LAN
PORT = 5001


# ── Flask app ─────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app)                           # Allow requests from any device on the LAN


# ── Helper: get local IP ───────────────────────────────────────────────────────

def get_local_ip() -> str:
    """Return the machine's LAN IP address."""
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        try:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
        except Exception:
            return "127.0.0.1"


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def index():
    """Simple status page."""
    local_ip = get_local_ip()
    return jsonify({
        "status": "running",
        "message": "Agentic AI Server is live",
        "local_url": f"http://{local_ip}:{PORT}",
        "endpoints": {
            "generate proposal": f"GET /generate_proposal     — send prospect data, generates document",
            "lateset info": f"GET /latest_info     — send prospect data, generates document",
            "download": f"GET  /download — fetch the generated proposal .docx",
            "health": f"GET  /health   — server health check",
        },
    })


@app.route("/generate_proposal", methods=["POST"])
def handle_generate_proposal():
    data = request.get_json(silent=True)
    print(f"Proposal request: {data}")
    if not data or "client_info" not in data:
        return jsonify({"error": "Request body must include 'client_info'"}), 400

    try:
        result = run_proposal_agent(data)
        return jsonify({
            "status": "success",
            "data": result
        })
    except Exception as exc:
        print(f"Error in proposal: {exc}")
        return jsonify({"error": f"Internal error: {exc}"}), 500


@app.route("/latest_info", methods=["POST"])
def handle_latest_info():
    data = request.get_json(silent=True)
    print(f"Market analysis request: {data}")
    if not data:
        return jsonify({"error": "Request body is empty"}), 400

    try:
        result = run_market_research(data)
        return jsonify({
            "status": "success",
            "data": result
        })
    except Exception as exc:
        print(f"Error in research: {exc}")
        return jsonify({"error": f"Internal error: {exc}"}), 500


# ── Download the latest generated proposal ────────────────────────────────────

GENERATED_DOC_PATH = os.path.join(os.path.dirname(__file__), "proposal_techcorp.docx")

@app.route("/download", methods=["GET"])
def download():
    """
    Serves the most recently generated proposal .docx file.
    The frontend calls this after a successful POST /chat to fetch the document.
    """
    if not os.path.exists(GENERATED_DOC_PATH):
        return jsonify({"error": "No document has been generated yet."}), 404

    from flask import send_file
    return send_file(
        GENERATED_DOC_PATH,
        mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        as_attachment=False,          # False → browser can try to preview it inline
        download_name="proposal_techcorp.docx",
    )


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    local_ip = get_local_ip()

    print("=" * 60)
    print("  Agentic AI Local Network Server")
    print("=" * 60)
    print(f"  Local URL  : http://localhost:{PORT}")
    print(f"  Network URL: http://{local_ip}:{PORT}")
    print("  Press Ctrl+C to stop.")
    print("=" * 60)

    # debug=False + threaded=True for stable multi-device usage
    app.run(host=HOST, port=PORT, debug=False, threaded=True)
