# CityPulse AI — Technical Requirements Document (TRD)

## 1. System overview

CityPulse AI is implemented as a set of independently invokable agent functions/services, coordinated by a lightweight orchestrator, sharing state through a memory store (BigQuery), and surfaced through a Looker dashboard. Acceleration is applied at the data-processing layer using NVIDIA RAPIDS (`cudf.pandas`, `cuML`).

## 2. Agent specifications

Each agent is defined by a strict input/output contract so the orchestrator can route between them predictably while still allowing conditional, non-linear handoffs (escalation, conflict resolution, retry).

### 2.1 Ingestion Agent

**Responsibility:** Pull and normalize external data; handle failure gracefully.

- Input: schedule trigger or on-demand call
- Calls: OpenAQ API, weather API, simulated citizen-report generator
- Output schema:
```json
{
  "source": "aqi | weather | citizen_reports",
  "zone": "string",
  "timestamp": "ISO8601",
  "payload": {},
  "status": "ok | stale | failed",
  "confidence_penalty": 0.0
}
```
- Failure handling: on API failure, retry with exponential backoff (max 3 attempts). On continued failure, emit `status: "stale"` using last-known-good cached value, set `confidence_penalty`, and notify Decision Agent directly (bypassing the normal flow) so downstream confidence is correctly reduced rather than silently stale.
- Writes raw payloads to Cloud Storage; writes normalized records to BigQuery.

### 2.2 Forecast Agent

**Responsibility:** Predict next-period AQI per zone.

- Input: historical + current AQI/weather records (from BigQuery, accelerated read/transform via `cudf.pandas`)
- Model: lightweight time-series model (e.g. gradient-boosted regressor or Prophet-style seasonal model) — kept intentionally simple for a hackathon timeline, swappable later
- Output schema:
```json
{
  "zone": "string",
  "predicted_aqi": 0,
  "horizon_hours": 24,
  "confidence": 0.0,
  "reasoning": "string"
}
```
- Re-invoked on demand by the what-if simulation with adjusted input features (e.g. traffic multiplier).

### 2.3 Triage Agent

**Responsibility:** Make sense of unstructured citizen reports.

- Input: raw citizen report text records
- Processing:
  - Gemini call for summarization/classification of complaint text (symptom category, severity language)
  - `cuML` clustering (DBSCAN or KMeans) over geo + time + category features to detect spatial/temporal hotspots
  - `cudf.pandas` for the feature engineering step feeding the clustering
- Output schema:
```json
{
  "zone": "string",
  "complaint_count": 0,
  "trend_vs_yesterday": "up | down | flat",
  "severity_signal": "low | medium | high | very_high",
  "hotspot_detected": true,
  "summary": "string"
}
```
- Can independently call the orchestrator to escalate directly to the Decision Agent if `complaint_count` spikes beyond a threshold ahead of the next scheduled cycle.

### 2.4 Shared Memory

**Responsibility:** Give every agent access to historical context, not just current-cycle data.

- Implementation: BigQuery tables, one per signal type (`aqi_history`, `weather_history`, `complaints_history`, `agent_decisions_log`), partitioned by date and zone.
- Read pattern: each agent queries "today vs. same-zone N-day trailing window" before producing output.
- Write pattern: every agent output is appended to its corresponding history table and to `agent_decisions_log` for auditability.

### 2.5 Decision Agent

**Responsibility:** Synthesize Forecast + Triage + Shared Memory into a recommendation; detect and resolve conflicts.

- Input: Forecast Agent output, Triage Agent output, relevant shared-memory trend
- Conflict detection logic: if Forecast risk classification and Triage severity signal diverge by more than one risk tier, mark `conflict: true`
- On conflict: call back to Ingestion Agent requesting supplementary data (e.g. nearby sensor zone) before finalizing; this is a real second round-trip, not a static branch
- Output schema:
```json
{
  "zone": "string",
  "risk_level": "low | medium | high | severe",
  "overall_confidence": 0.0,
  "conflict_detected": false,
  "recommendations": [
    {"target": "schools", "action": "string"},
    {"target": "hospital", "action": "string"},
    {"target": "transit", "action": "string"},
    {"target": "citizens", "action": "string"}
  ],
  "rationale": "string"
}
```
- Reasoning generation (the natural-language rationale) is produced via a Gemini call grounded in the structured inputs above — Gemini explains a decision that was computed, it does not compute the decision itself.

### 2.6 Reflection Agent

**Responsibility:** Quality-check the Decision Agent's output before it reaches a human.

- Input: Decision Agent output + the upstream agent outputs it was built from
- Checks performed:
  - Is `overall_confidence` below a minimum threshold?
  - Is there unresolved conflict after the Decision Agent's supplementary-data round-trip?
  - Is any upstream signal `status: "stale"`?
  - Does the recommendation logically follow from the stated rationale?
- Output schema:
```json
{
  "validated": true,
  "requires_human_review": true,
  "flags": ["low_confidence", "stale_weather_data"],
  "notes": "string"
}
```

### 2.7 Human Approval

**Responsibility:** Final checkpoint before any dispatch.

- Implementation: a simple approve/reject UI surface (can be a lightweight web view or even a Looker-embedded action) showing the Decision Agent's recommendation plus the Reflection Agent's flags
- No code path exists from Decision Agent output to Notification Agent that does not pass through this step
- Approval/rejection is logged to `agent_decisions_log` with a human identifier and timestamp

### 2.8 Notification Agent

**Responsibility:** Format and simulate-dispatch the approved recommendation.

- Input: approved Decision Agent output
- Output: formatted messages per target audience (school, hospital, transit, citizen-facing summary), written to a `notifications_log` table and reflected on the Looker dashboard
- Real dispatch (email/SMS/webhook) is architecturally supported but simulated for this submission

## 3. Orchestrator

- A lightweight coordinator (FastAPI service or a simple state machine, e.g. LangGraph-style) that:
  - triggers the Ingestion → Forecast/Triage fan-out on schedule
  - routes Forecast + Triage output into Shared Memory then Decision Agent
  - handles the conditional edges: Triage-initiated escalation, Decision-initiated supplementary data requests, Reflection-initiated human-review routing
  - logs every agent invocation and handoff with timestamp for the Agent Activity Timeline
- Each agent is a discrete, independently testable function/service — the orchestrator does not contain business logic itself, only routing.

## 4. Data model (BigQuery, simplified)

```
aqi_history(zone, timestamp, aqi_value, source_status, confidence_penalty)
weather_history(zone, timestamp, temp, humidity, wind, source_status)
complaints_history(zone, timestamp, raw_text, category, severity, cluster_id)
agent_decisions_log(agent_name, timestamp, input_ref, output_json, conflict_flag, escalation_flag)
notifications_log(zone, timestamp, target_audience, message, approved_by)
```

## 5. Acceleration implementation detail

- `cudf.pandas` is enabled as a drop-in accelerator (`%load_ext cudf.pandas` / `import cudf.pandas; cudf.pandas.install()`) for:
  - Triage Agent's feature engineering over citizen report volume
  - Forecast Agent's historical-window feature preparation
- `cuML` is used for the clustering step in the Triage Agent (DBSCAN or KMeans over geo/time/category feature space)
- Runtime: NVIDIA GPU instance on Google Cloud (e.g. an L4-backed VM or GKE node pool)
- Benchmark methodology: identical pipeline code run twice — once with standard `pandas`/`scikit-learn`, once with `cudf.pandas`/`cuML` — on a synthetic stress-test dataset (tens of thousands of citizen report records) to produce a credible, honest speedup figure independent of the smaller live-demo dataset.

## 6. Non-functional requirements

- NFR-1: What-if simulation round-trip (Forecast + Decision re-run) should complete in under 2 seconds on GPU-accelerated path.
- NFR-2: System must not silently fail on any single upstream data source outage — must degrade with explicit confidence reduction (see Ingestion Agent failure handling).
- NFR-3: Every agent decision must be logged with enough detail to reconstruct the reasoning chain after the fact (auditability).
- NFR-4: No automated dispatch path may bypass human approval.

## 7. Out of scope for this implementation (deferred)

- Authentication/authorization for the human-approval UI
- Real SMS/email/webhook integration for Notification Agent (architecture supports it, not built for the demo)
- Multi-city support
- Production-grade model retraining pipeline for the Forecast Agent
