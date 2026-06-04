# 📊 Prism Analyzer - Priority Algorithm: Complete Mathematics & Flow

## Overview
This document provides a comprehensive explanation of how the Prism Analyzer calculates priority scores for feedback tasks using a weighted scoring algorithm.

---

## 🔄 Complete System Flow

```
1. UPLOAD EXCEL FILES
   ↓
2. EXTRACT & CLEAN FEEDBACK
   ↓
3. AI CLUSTERING (Group similar feedback)
   ↓
4. DISPLAY RESULTS (Topics + Feedback patterns)
   ↓
5. USER SELECTS TASKS → To-Do List
   ↓
6. USER ADJUSTS REVENUE & EFFORT SLIDERS
   ↓
7. CLICK "CALCULATE PRIORITY"
   ↓
8. BACKEND CALCULATES 6 METRICS
   ↓
9. COMPUTE WEIGHTED PRIORITY SCORE
   ↓
10. SORT & DISPLAY PRIORITIZED TASKS
```

---

## 📐 The 6 Core Metrics (All Normalized to 0-1)

### 1️⃣ **DEMAND (D)** - Automatic
**What it measures**: How many people reported this issue

**Calculation**:
```
count = number of times this feedback appears in data
Demand = count / max(all_counts)
```

**Example**:
- Task A: 50 occurrences
- Task B: 25 occurrences  
- Task C: 10 occurrences
- Max count = 50

```
Demand_A = 50/50 = 1.0  ✅ Highest demand
Demand_B = 25/50 = 0.5  🟡 Medium demand
Demand_C = 10/50 = 0.2  🔴 Low demand
```

---

### 2️⃣ **IMPACT (I)** - Automatic (Keyword-Based)
**What it measures**: Severity/criticality of the issue

**Calculation Method**:
1. Scan feedback text for severity keywords
2. Assign severity score based on matched keywords
3. Normalize to 0-1 scale

**Severity Levels**:
| Level | Score | Keywords (Examples) |
|-------|-------|-------------------|
| **Critical** | 5 | offline, down, crash, error, broken, unavailable, data loss, corrupted |
| **Major** | 3 | lag, slow, unstable, timeout, buffering, glitchy, unreliable |
| **Minor** | 1 | feature request, enhancement, add, improve, suggestion |
| **No Match** | 0.2 | *Baseline weight* |

**Formula**:
```python
For each feedback text:
    best_severity = max(matched_keyword_scores)
    
total_severity = sum(best_severity for all texts)
max_possible = len(texts) × 5

if total_severity == 0:
    Impact = 0.2  # Baseline for non-critical feedback
else:
    Impact = total_severity / max_possible
```

**Examples**:

**Example 1**: "Camera is offline and not working"
```
Matches: "offline" (5), "not working" (5)
Best = 5
Impact = 5/5 = 1.0 ✅ CRITICAL
```

**Example 2**: "Video is slow and buffering"
```
Matches: "slow" (3), "buffering" (3)
Best = 3
Impact = 3/5 = 0.6 🟡 MAJOR
```

**Example 3**: "Would like to add dark mode"
```
Matches: "add" (1)
Best = 1
Impact = 1/5 = 0.2 🔵 MINOR
```

**Example 4**: "User interface feedback"
```
No severity keywords matched
Impact = 0.2 (baseline) 🔵 LOW
```

---

### 3️⃣ **URGENCY (U)** - Automatic (Time-Based)
**What it measures**: How recent is the feedback (newer = more urgent)

**Formula**: Exponential time decay
```python
if no_date:
    Urgency = 0.4  # Baseline default
else:
    days_old = (today - last_seen_date).days
    Urgency = e^(-days_old / 30)
```

**Where**:
- `e` = Euler's number (2.71828...)
- `days_old` = number of days since feedback was last seen
- `30` = decay constant (half-life of ~21 days)

**Urgency Over Time**:

| Days Old | Calculation | Urgency Score | Interpretation |
|----------|-------------|---------------|----------------|
| 0 (Today) | e^(-0/30) = e^0 | **1.00** | 🔴 CRITICAL - Act immediately |
| 7 days | e^(-7/30) = e^(-0.233) | **0.79** | 🟠 HIGH - Address soon |
| 15 days | e^(-15/30) = e^(-0.5) | **0.61** | 🟡 MEDIUM - Schedule work |
| 30 days | e^(-30/30) = e^(-1) | **0.37** | 🟢 MODERATE - Monitor |
| 60 days | e^(-60/30) = e^(-2) | **0.14** | 🔵 LOW - Backlog |
| 90 days | e^(-90/30) = e^(-3) | **0.05** | ⚪ VERY LOW - Deprioritize |
| No date | N/A | **0.40** | 🟡 DEFAULT - Baseline |

**Graph Visualization**:
```
Urgency
  1.0 |●
      |  ●
  0.8 |    ●
      |      ●
  0.6 |        ●
      |          ●●
  0.4 |            ●●●
      |               ●●●●
  0.2 |                   ●●●●●
      |                        ●●●●●●●
  0.0 |________________________________
      0  15  30  45  60  75  90  Days
```

---

### 4️⃣ **CONFIDENCE (C)** - Automatic (Cluster Quality)
**What it measures**: How well-grouped/similar the feedback items are

**Calculation**:
```python
1. Get all embeddings (AI vector representations) in the cluster
2. Calculate centroid = mean of all vectors
3. Calculate cosine distance from each point to centroid
4. mean_distance = average of all distances

Confidence = 1 - (normalized_distance)
```

**Formula**:
```
mean_dist = clipped to [0.05, 0.80]
Confidence = 1 - (mean_dist - 0.05) / (0.80 - 0.05)
```

**What it means**:
- **High (0.8-1.0)**: Feedback is very similar, cluster is tight → trustworthy grouping
- **Medium (0.4-0.7)**: Moderate similarity → acceptable grouping
- **Low (0-0.3)**: Feedback is scattered → uncertain grouping

---

### 5️⃣ **REVENUE (R)** - Manual (User Input)
**What it measures**: Potential revenue impact if implemented

**User sets via slider**: 0.0 (no revenue) to 1.0 (high revenue)

**Guidelines**:
- **0.0-0.3**: Low revenue impact (internal improvements, minor features)
- **0.4-0.6**: Moderate revenue impact (customer retention, upsells)
- **0.7-1.0**: High revenue impact (new sales, major features, competitive advantage)

---

### 6️⃣ **EFFORT (E)** - Manual (User Input)  
**What it measures**: Implementation difficulty/cost

**User sets via slider**: 0.0 (easy) to 1.0 (hard)

**Guidelines**:
- **0.0-0.3**: Easy/Quick (hours to few days, minimal resources)
- **0.4-0.6**: Moderate (weeks, standard team effort)
- **0.7-1.0**: Hard (months, large team, complex architecture)

---

## 🎯 Priority Score Calculation

### Weighted Formula (Revenue-Heavy)
```
Priority = (D × 0.15) + (I × 0.15) + (U × 0.10) + (C × 0.05) + (R × 0.40) - (E × 0.15)
```

### Weight Distribution
| Metric | Weight | Type | Rationale |
|--------|--------|------|-----------|
| **Revenue (R)** | **40%** | Positive | Biggest driver - direct business impact |
| **Demand (D)** | 15% | Positive | Customer volume matters |
| **Impact (I)** | 15% | Positive | Severity/criticality important |
| **Effort (E)** | 15% | **Negative** | Penalties for high effort (ROI optimization) |
| **Urgency (U)** | 10% | Positive | Time-sensitivity factor |
| **Confidence (C)** | 5% | Positive | Data quality assurance |
| **TOTAL** | **100%** | | |

### Why This Weighting?
- **Revenue-heavy (40%)**: Prioritizes business value
- **Effort penalty (-15%)**: Favors quick wins (high ROI)
- **Demand (15%)**: Addresses many customers
- **Impact (15%)**: Fixes critical issues
- **Urgency (10%)**: Prevents old feedback from dominating
- **Confidence (5%)**: Minimal weight, just a quality check

---

## 📊 Complete Example Walkthrough

### Scenario: 3 Tasks

#### **Task A: "Camera offline error"**
- Demand: 50 occurrences → **D = 1.0** (highest count)
- Impact: "offline" + "error" keywords → **I = 1.0** (critical)
- Urgency: Reported yesterday → **U = 0.98**
- Confidence: Tight cluster → **C = 0.85**
- Revenue: User sets → **R = 0.8** (loses customers)
- Effort: User sets → **E = 0.3** (quick fix)

**Calculation**:
```
Priority_A = (1.0 × 0.15) + (1.0 × 0.15) + (0.98 × 0.10) + (0.85 × 0.05) + (0.8 × 0.40) - (0.3 × 0.15)
           = 0.15 + 0.15 + 0.098 + 0.0425 + 0.32 - 0.045
           = 0.7155
```
**Priority Score: 0.72** ✅

---

#### **Task B: "Add dark mode feature"**
- Demand: 30 occurrences → **D = 0.6**
- Impact: "add" keyword → **I = 0.2** (minor/feature)
- Urgency: Reported 20 days ago → **U = 0.51**
- Confidence: Moderate cluster → **C = 0.60**
- Revenue: User sets → **R = 0.9** (competitive advantage)
- Effort: User sets → **E = 0.6** (moderate work)

**Calculation**:
```
Priority_B = (0.6 × 0.15) + (0.2 × 0.15) + (0.51 × 0.10) + (0.60 × 0.05) + (0.9 × 0.40) - (0.6 × 0.15)
           = 0.09 + 0.03 + 0.051 + 0.03 + 0.36 - 0.09
           = 0.471
```
**Priority Score: 0.47** 🟡

---

#### **Task C: "Improve UI aesthetics"**
- Demand: 10 occurrences → **D = 0.2**
- Impact: "improve" keyword → **I = 0.2** (minor)
- Urgency: Reported 60 days ago → **U = 0.14**
- Confidence: Weak cluster → **C = 0.40**
- Revenue: User sets → **R = 0.3** (nice-to-have)
- Effort: User sets → **E = 0.8** (redesign work)

**Calculation**:
```
Priority_C = (0.2 × 0.15) + (0.2 × 0.15) + (0.14 × 0.10) + (0.40 × 0.05) + (0.3 × 0.40) - (0.8 × 0.15)
           = 0.03 + 0.03 + 0.014 + 0.02 + 0.12 - 0.12
           = 0.094
```
**Priority Score: 0.09** 🔴

---

### Final Ranking
| Rank | Task | Priority Score | Action |
|------|------|----------------|--------|
| **1** | Camera offline error | **0.72** | 🔥 Do immediately |
| **2** | Add dark mode | **0.47** | 📋 Schedule soon |
| **3** | UI aesthetics | **0.09** | 💤 Backlog |

---

## 🔍 Key Insights

### High Priority Tasks Typically Have:
✅ **High Revenue** (0.7-1.0)  
✅ **Low Effort** (0.0-0.3)  
✅ **High Demand** (many occurrences)  
✅ **Critical Impact** (severity keywords)  
✅ **Recent** (reported within last week)

### Low Priority Tasks Typically Have:
❌ **Low Revenue** (0.0-0.3)  
❌ **High Effort** (0.7-1.0)  
❌ **Low Demand** (few occurrences)  
❌ **Minor Impact** (feature requests)  
❌ **Old** (reported months ago)

---

## 🎓 Mathematical Properties

### Range
```
Minimum: (0 × 0.15) + (0.2 × 0.15) + (0 × 0.10) + (0 × 0.05) + (0 × 0.40) - (1 × 0.15)
       = 0 + 0.03 + 0 + 0 + 0 - 0.15
       = -0.12

Maximum: (1 × 0.15) + (1 × 0.15) + (1 × 0.10) + (1 × 0.05) + (1 × 0.40) - (0 × 0.15)
       = 0.15 + 0.15 + 0.10 + 0.05 + 0.40 - 0
       = 0.85
```

**Priority Score Range**: Approximately **-0.12 to 0.85**

### Quick Wins (Best ROI)
Tasks with **high revenue + low effort** score higher:
```
Quick Win Example:
R = 0.9, E = 0.2
Contribution = (0.9 × 0.40) - (0.2 × 0.15) = 0.36 - 0.03 = 0.33 ✅

Complex Project Example:
R = 0.9, E = 0.9
Contribution = (0.9 × 0.40) - (0.9 × 0.15) = 0.36 - 0.135 = 0.225 ❌ Lower!
```

---

## 🔧 Customization Options

You can adjust the algorithm by modifying:

### 1. **Weights** (line 121 in app.py)
```python
W = dict(D=0.15, I=0.15, U=0.10, C=0.05, R=0.40, E=0.15)
```

### 2. **Impact Baseline** (line 58, 66, 72 in app.py)
```python
return 0.2  # Change this value (0.0 - 1.0)
```

### 3. **Urgency Baseline** (line 101 in app.py)
```python
return 0.4  # Change this value (0.0 - 1.0)
```

### 4. **Urgency Decay Rate** (line 107 in app.py)
```python
score = float(np.exp(-days / 30.0))  # Change 30 to adjust decay speed
```

### 5. **Severity Keywords** (lines 35-59 in app.py)
Add more keywords to each severity level as needed.

---

## 🎯 Summary

The Prism Priority Algorithm is a **weighted, multi-criteria decision-making system** that:

1. **Automatically** analyzes 4 objective metrics (Demand, Impact, Urgency, Confidence)
2. **Combines** them with 2 subjective user inputs (Revenue, Effort)
3. **Weights** revenue impact heavily (40%) while penalizing high effort
4. **Produces** a single priority score for ranking tasks
5. **Favors** quick wins with high business value

This enables data-driven prioritization that balances:
- 💰 **Business value** (Revenue)
- 👥 **Customer needs** (Demand)
- 🚨 **Severity** (Impact)
- ⏰ **Timeliness** (Urgency)
- ⚡ **ROI** (Revenue vs Effort)
- ✅ **Data quality** (Confidence)

**Result**: A ranked list of tasks optimized for maximum business impact with minimal effort! 🚀
