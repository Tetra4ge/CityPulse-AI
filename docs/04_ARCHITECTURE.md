# CityPulse AI — System Architecture

## 1. Architecture diagram (textual)

```
                                  User (city official)
                                          │
                                          ▼
                                   Orchestrator
                                          │
                ┌─────────────────────────┼─────────────────────────┐
                ▼                         ▼                         ▼
        Ingestion Agent           Forecast Agent              Triage Agent
   (AQI, weather, retry/         (time-series AQI,        (citizen complaint
    recovery on failure)          confidence score)         clustering, cuDF/cuML)
                │                         │                         │
                └─────────────────────────┼─────────────────────────┘
                                          ▼
                                  Shared Memory
                              (BigQuery: today vs.
                               historical trend)
                                          ▼
                                  Decision Agent  ◄──────────┐
                              (risk score, conflict          │ supplementary
                               detection, recommendations)   │ data request
                                  │         ▲                │
                                  │         └────────────────┘
                                  ▼
                              Reflection Agent
                          (confidence check, gap
                           check, conflict check)
                                  │
                                  ▼
                              Human Approval
                          (approve / reject, logged)
                                  │
                                  ▼
                              Notification Agent
                       (simulated dispatch to schools,
                        hospitals, transit, citizens)
                                  │
                                  ▼
                              Looker Dashboard
                       (risk map, agent activity timeline,
                        what-if simulation control)
```

A rendered version of this diagram (with color-coded agent categories) accompanies this document in the project's visual assets.

## 2. Architectural principles

1. **Agents are narrow and independently testable.** Each agent has one job, a strict input/output schema, and no hidden dependency on another agent's internals. This is what makes the system genuinely composable rather than a monolithic script.
2. **State is shared, not re-derived.** Every agent reads from and writes to the same BigQuery-backed memory layer, so "today vs. yesterday" context is always available without each agent re-fetching or re-computing history independently.
3. **Disagreement is surfaced, not averaged away.** The Decision Agent explicitly detects when the Forecast Agent and Triage Agent diverge by more than one risk tier, and treats this as a first-class event requiring a supplementary data round-trip — not a number that gets silently blended.
4. **Failure degrades gracefully, it does not propagate as silence.** If the Ingestion Agent cannot reach a live source, it does not simply omit data — it notifies the Decision Agent directly and the system proceeds with a reduced confidence score, which is visible all the way through to the human approver.
5. **A human is structurally required, not optionally consulted.** There is no code path from a Decision Agent output to a dispatched notification that does not pass through the Human Approval step. This is enforced architecturally, not by convention.
6. **Acceleration sits where data volume actually matters.** GPU acceleration (`cudf.pandas`, `cuML`) is applied specifically at the citizen-report feature engineering and clustering step, and the historical-window feature preparation in the Forecast Agent — the two places where growing data volume would otherwise make the what-if simulation feel sluggish.

## 3. Data flow (happy path)

1. Orchestrator triggers Ingestion Agent on a schedule (or on-demand for a what-if run).
2. Ingestion Agent pulls AQI + weather from live APIs, generates/pulls simulated citizen reports, writes raw data to Cloud Storage and normalized records to BigQuery.
3. Forecast Agent and Triage Agent run in parallel, each reading current + historical data from BigQuery (accelerated via `cudf.pandas`/`cuML` in the Triage Agent's clustering step).
4. Both outputs, plus the relevant shared-memory trend, feed into the Decision Agent.
5. Decision Agent computes a risk level and recommendation set, checking for conflict between Forecast and Triage signals.
6. Reflection Agent reviews the Decision Agent's output for confidence, completeness, and unresolved conflict.
7. If flagged for review (which is the default expectation for any non-trivial recommendation), a human approves or rejects via the approval interface.
8. On approval, Notification Agent formats and (simulated) dispatches role-specific messages, and the Looker dashboard updates with the new state and an appended entry in the agent activity timeline.

## 4. Data flow (conflict / escalation path)

1. Triage Agent detects a citizen-complaint spike that crosses threshold significantly ahead of the scheduled cycle. It escalates directly to the Decision Agent rather than waiting for the next orchestrated round.
2. Decision Agent compares this against the most recent Forecast Agent output and finds a conflict (e.g. Forecast = Medium, Triage = Very High).
3. Decision Agent requests supplementary data from the Ingestion Agent (e.g. a nearby sensor zone's current reading) rather than guessing.
4. Ingestion Agent fetches and returns the supplementary data.
5. Decision Agent re-evaluates with the additional evidence and produces an updated, conflict-resolved recommendation, with the conflict and resolution path visible in the rationale and the agent activity timeline.

## 5. Data flow (degraded / recovery path)

1. Ingestion Agent attempts to pull the AQI feed; the API call fails.
2. Retries with backoff; still fails after max attempts.
3. Ingestion Agent falls back to the most recent valid cached value, marks `status: "stale"`, and notifies the Decision Agent directly.
4. Decision Agent proceeds with the recommendation but applies a confidence penalty, and the Reflection Agent flags `stale_weather_data` (or equivalent) so the human approver sees explicitly that part of the input was degraded.

## 6. Deployment view

- **Compute:** NVIDIA GPU-backed VM (or GKE node pool with GPU node selector) hosts the Forecast and Triage agent processing where `cudf.pandas`/`cuML` are used; lighter agents (Ingestion, Decision, Reflection, Notification) can run as standard containerized services.
- **Orchestration:** containerized services coordinated by a lightweight orchestrator process; GKE is the natural home if the team wants to demonstrate the Kubernetes Engine line item explicitly, though a single-VM deployment is sufficient for a hackathon demo.
- **Storage:** Cloud Storage for raw ingested payloads; BigQuery for structured historical and decision-log data.
- **Presentation:** Looker dashboard reading from BigQuery, embedding (or linking to) the agent activity timeline and the what-if simulation control.

## 7. Why this satisfies "autonomous multi-agent system" specifically

- **Coordination:** orchestrator fans out to three parallel agents and merges their output through shared memory into a single decision point.
- **Task execution:** each agent executes a distinct, well-defined task with its own model/tooling (forecasting model, clustering model, LLM summarization, rule-based risk synthesis).
- **Information retrieval:** Ingestion Agent retrieves live external data; Decision Agent retrieves supplementary data mid-reasoning when evidence conflicts.
- **Decision support across a complex operational environment:** the system spans multiple stakeholder types (schools, hospitals, transit, citizens) with role-specific outputs derived from the same underlying risk assessment, with a human as the final checkpoint.
