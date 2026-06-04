# Phase 2: Weighted Prioritization Algorithm - Implementation Summary

## Overview
Phase 2 adds a sophisticated weighted prioritization algorithm to the Prism Analyzer. This allows users to:
1. Select tasks from the analysis results and add them to a to-do list
2. Apply a weighted algorithm to prioritize tasks based on multiple factors
3. Manually input Revenue and Effort estimates
4. Automatically calculate Demand, Impact, Urgency, and Confidence scores
5. View prioritized tasks ranked by a comprehensive priority score

## Key Features

### 1. Automatic Metrics Calculation
The system automatically calculates 4 out of 6 metrics:

- **Demand (D)**: Normalized count of feedback items in the cluster
- **Impact (I)**: Keyword-based severity analysis (0-1 scale)
  - Critical keywords: offline, crash, error, disconnect (weight: 5)
  - Major keywords: lag, latency, slow, unstable (weight: 3)
  - Minor keywords: feature request, enhancement (weight: 1)
- **Urgency (U)**: Time-based decay from last seen date
  - Recent feedback = higher urgency
  - Exponential decay: 0 days → 1.0, 30 days → 0.37, 90 days → 0.05
- **Confidence (C)**: Cluster tightness using cosine distance from embeddings
  - Tighter clusters = higher confidence in the grouping

### 2. Manual Input Metrics
Users provide estimates for 2 metrics:

- **Revenue (R)**: Business impact / revenue potential (0-1 scale)
- **Effort (E)**: Implementation effort / complexity (0-1 scale)

### 3. Weighted Scoring Formula

```
Priority Score = 
  0.15 × Demand +
  0.15 × Impact +
  0.10 × Urgency +
  0.05 × Confidence +
  0.40 × Revenue -
  0.15 × Effort
```

**Revenue-heavy weighting**: The algorithm prioritizes high-revenue, low-effort tasks while considering demand, impact, urgency, and confidence.

## Technical Implementation

### Backend Changes (`app.py`)

1. **New Imports**:
   ```python
   import json
   from datetime import datetime, timezone
   from scipy.spatial.distance import cosine
   ```

2. **Global Variables**:
   - `LATEST_EMBEDDINGS`: Stores embeddings from clustering
   - `LATEST_LABELS`: Stores cluster labels
   - `LATEST_DATA`: Stores processed data

3. **New Functions**:
   - `impact_score_from_texts()`: Keyword-based severity scoring
   - `urgency_score_from_last_seen()`: Time-decay urgency calculation
   - `confidence_from_embeddings()`: Cluster tightness confidence
   - `normalize_0_1()`: Normalize series to [0,1] range
   - `compute_priority_row()`: Calculate weighted priority score

4. **Modified Functions**:
   - `cluster_feedback()`: Now returns embeddings in addition to labels and names

5. **New Endpoint**:
   - `POST /api/prioritize`: Accepts selected items and manual inputs, returns prioritized list

### Frontend Changes (`App.jsx`)

1. **New State Variables**:
   ```javascript
   const [showPriorityModal, setShowPriorityModal] = useState(false);
   const [manualInputs, setManualInputs] = useState({});
   const [prioritizedTasks, setPrioritizedTasks] = useState(null);
   const [prioritizing, setPrioritizing] = useState(false);
   ```

2. **New Functions**:
   - `handleApplyAlgorithm()`: Opens modal with default values
   - `handlePrioritize()`: Calls backend API to calculate priorities
   - `updateManualInput()`: Updates Revenue/Effort values

3. **New UI Components**:
   - **"Apply Algorithm" button**: In to-do list panel
   - **Priority Modal**: Two-stage modal
     - Stage 1: Configure Revenue and Effort with sliders
     - Stage 2: View prioritized results in table format

## User Workflow

1. **Upload and Analyze**: User uploads Excel files and runs clustering analysis
2. **Select Tasks**: User expands clusters and selects specific feedback items to add to to-do list
3. **Apply Algorithm**: User clicks "Apply Algorithm" button
4. **Configure Inputs**: Modal opens showing each unique cluster with sliders for:
   - 💰 Revenue Impact (0.0 - 1.0)
   - ⚡ Implementation Effort (0.0 - 1.0)
5. **Calculate**: User clicks "Calculate Priority" 
6. **View Results**: Prioritized task table displays:
   - Rank (#)
   - Task name
   - Priority score
   - All 6 metric values (Demand, Impact, Urgency, Confidence, Revenue, Effort)
7. **Review**: Tasks are sorted by priority score (highest first)

## Example Priority Calculation

For a task with:
- Demand: 0.85 (many feedback items)
- Impact: 0.90 (critical keywords found)
- Urgency: 0.75 (recent feedback)
- Confidence: 0.65 (tight cluster)
- Revenue: 0.80 (high revenue potential)
- Effort: 0.30 (low implementation effort)

**Priority Score** = 0.15(0.85) + 0.15(0.90) + 0.10(0.75) + 0.05(0.65) + 0.40(0.80) - 0.15(0.30)
= 0.1275 + 0.135 + 0.075 + 0.0325 + 0.32 - 0.045
= **0.645**

## Customization Options

### Adjust Weights
Modify weights in `app.py`:
```python
W = dict(D=0.15, I=0.15, U=0.10, C=0.05, R=0.40, E=0.15)
```

### Adjust Impact Keywords
Modify `SEVERITY_KEYWORDS` in `app.py` to match your domain:
```python
SEVERITY_KEYWORDS = [
    (5, [r"\boffline\b", r"\bcrash\b", ...]),  # critical
    (3, [r"\blag\b", r"\bslow\b", ...]),       # major
    (1, [r"\bfeature\s+request\b", ...]),      # minor
]
```

### Adjust Urgency Decay
Modify the decay rate in `urgency_score_from_last_seen()`:
```python
score = float(np.exp(-days / 30.0))  # Change 30.0 to adjust decay rate
```

## API Reference

### POST `/api/prioritize`

**Request**:
```json
{
  "selected_items": [
    {
      "task": "Fix Camera Issues",
      "cluster_id": 3,
      "feedback_raw": "Camera not working",
      "count": 15
    }
  ],
  "manual_inputs": {
    "cluster_id_3": {
      "revenue": 0.8,
      "effort": 0.3
    }
  }
}
```

**Response**:
```json
{
  "prioritized_tasks": [
    {
      "task": "Fix Camera Issues",
      "cluster_id": 3,
      "count": 15,
      "priority_score": 0.645,
      "Demand": 0.85,
      "Impact": 0.90,
      "Urgency": 0.75,
      "Confidence": 0.65,
      "Revenue": 0.80,
      "Effort": 0.30
    }
  ],
  "total_tasks": 1
}
```

## Testing the Implementation

1. Start the backend:
   ```bash
   cd d:\Aneri\Prism
   python app.py
   ```

2. Start the frontend:
   ```bash
   cd d:\Aneri\Prism\frontend
   npm run dev
   ```

3. Test workflow:
   - Upload Excel files with feedback data
   - Run analysis
   - Select some feedback items from different clusters
   - Click "Apply Algorithm" in the to-do list panel
   - Adjust Revenue and Effort sliders
   - Click "Calculate Priority"
   - Review the prioritized results

## Files Modified

- `d:\Aneri\Prism\app.py`: Backend implementation
- `d:\Aneri\Prism\frontend\src\App.jsx`: Frontend UI and logic

## Dependencies
All dependencies were already present. No new packages required.

## Notes

- The algorithm only applies to tasks added to the to-do list (as requested)
- All 6 metrics are normalized to [0,1] range before scoring
- Priority scores can be negative if Effort is very high relative to other factors
- The modal provides visual feedback with color-coded sliders and badges
- Results are sortable by priority score (automatically sorted highest first)
