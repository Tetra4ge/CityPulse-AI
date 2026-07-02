# CityPulse AI — Product Requirements Document (PRD)

## 1. Problem statement

City officials, school administrators, hospital staff, and transit authorities currently make air-quality-related operational decisions using raw AQI numbers pulled manually from multiple dashboards, with no historical trend context, no ground-truth validation against what citizens are actually reporting, and no structured escalation path when signals disagree. This results in slow, inconsistent, and under-informed decisions — often made hours after conditions have already changed.

## 2. Target users

| User | Decision they need to make | Current pain |
|---|---|---|
| District health / disaster management officer | Issue or withhold a pollution advisory | Manual data pull across 3+ sources, ~1-2 hours |
| School administrator (per zone) | Cancel or allow outdoor activity | No zone-specific signal, relies on city-wide AQI only |
| Hospital respiratory ward lead | Pre-staff for predicted patient load | No early warning, reacts after admissions rise |
| Transit authority | Issue public air-quality warning | No automated trigger, manual judgment call |
| Citizens with respiratory conditions | Avoid outdoor exposure | Raw AQI number, no personalized guidance |

## 3. Goals

- Reduce time-to-decision from hours to minutes for the primary user (district health officer).
- Replace a single raw number with a specific, actionable, zone-level recommendation.
- Surface disagreement between predictive signals (forecast) and ground-truth signals (citizen reports) rather than silently resolving it.
- Keep a human as the final approver of any action that gets dispatched.
- Demonstrate that GPU acceleration materially improves the responsiveness of the decision loop, especially under the what-if simulation.

## 4. Non-goals (explicitly out of scope for this submission)

- Production-grade integration with real municipal complaint systems (simulated data is used instead, and disclosed as such).
- Mobile app or citizen-facing notification channel (the demo dispatches simulated notifications to schools/hospitals/transit).
- Full identity/auth system for the human-approval step (a lightweight approve/reject UI is sufficient for the demo).
- Multi-city or multi-country support (single city, multi-zone is sufficient).

## 5. User stories

1. As a district health officer, I want a single dashboard view that tells me which zones need action today, so I don't have to manually cross-reference AQI, weather, and complaint data.
2. As a district health officer, I want to see *why* the system is recommending an action (confidence score, supporting evidence, conflicting evidence) so I can trust or override it.
3. As a district health officer, I want to approve or reject a recommendation before it is sent to schools/hospitals/transit, so the system never acts autonomously on something I haven't reviewed.
4. As a school administrator, I want a zone-specific advisory (not a city-wide one) so I'm not over- or under-reacting relative to my actual location.
5. As a hospital respiratory ward lead, I want an early load-impact estimate (e.g. "+18% expected respiratory admissions") so I can staff proactively.
6. As any user, I want to see what would happen if conditions changed (e.g. traffic +20%) so I can plan contingencies before they're needed.
7. As a judge/evaluator, I want to see the system's internal agent reasoning and handoffs, not just a final answer, so I can verify this is a genuine multi-agent system.

## 6. Functional requirements

### 6.1 Data ingestion
- FR-1: System shall ingest live AQI data from a public API (OpenAQ or equivalent) on a configurable interval.
- FR-2: System shall ingest live weather data (temperature, humidity, wind) from a public weather API.
- FR-3: System shall ingest simulated citizen complaint reports (text), tagged with zone and timestamp.
- FR-4: If a live data source fails or returns stale data, the system shall retry, and on repeated failure shall fall back to the most recent valid data with a reduced confidence flag, rather than failing the pipeline.

### 6.2 Analysis and modeling
- FR-5: System shall detect AQI trend direction per zone using current vs. historical (prior-day) values stored in shared memory.
- FR-6: System shall cluster citizen complaints by zone and symptom/topic to detect anomaly spikes.
- FR-7: System shall forecast next-period AQI per zone with an associated confidence score.
- FR-8: System shall compute a risk classification (e.g. Low / Medium / High / Severe) per zone, combining forecasted AQI and complaint signal.

### 6.3 Decision logic
- FR-9: System shall detect disagreement between the forecast signal and the citizen-report signal (e.g. forecast = Medium, complaints = Very High) and explicitly flag it as a conflict rather than averaging it silently.
- FR-10: On conflict detection, the system shall be able to request supplementary data (e.g. nearby sensor readings) from the ingestion layer before finalizing a recommendation.
- FR-11: System shall generate specific, role-targeted recommendations (e.g. "Zone B schools: postpone outdoor sports," "Hospital respiratory ward: prepare for ~18% higher load," "Transit authority: issue air-quality warning").
- FR-12: System shall produce a confidence score and a natural-language rationale for every recommendation.

### 6.4 Oversight and transparency
- FR-13: Every recommendation shall pass through a reflection step that evaluates: is the evidence sufficient, is there unresolved conflict, is missing data degrading confidence, does this require human review.
- FR-14: No recommendation shall be dispatched to the notification layer without explicit human approval.
- FR-15: The system shall expose a human-readable agent activity timeline showing each agent's action, timestamp, and handoff, for full auditability.

### 6.5 Output and interaction
- FR-16: System shall provide a dashboard (Looker) showing current risk by zone, the agent activity timeline, and historical trend.
- FR-17: System shall provide a "what-if" control (e.g. traffic +X%) that re-runs the forecast and decision agents and reflects the updated recommendation live.
- FR-18: System shall simulate dispatch of approved recommendations to relevant stakeholder channels (school, hospital, transit) — simulated for this submission, with an architecture that supports real dispatch later.

## 7. Success metrics (for the hackathon demo)

| Metric | Target |
|---|---|
| Time from data ingestion to recommendation | < 90 seconds end-to-end |
| What-if slider response time (with GPU acceleration) | < 2 seconds |
| Conflict detection rate in seeded test scenarios | 100% of seeded conflicts caught |
| Human-approval step present before every dispatch | 100% (no bypass path) |
| Demonstrated speedup, pandas vs. cudf.pandas on clustering/feature prep | ≥ 5x |

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Citizen complaint data isn't real | Explicitly disclosed as simulated; simulation designed to be statistically plausible (spikes correlated with AQI spikes) |
| Live API rate limits / outages during demo | Local cache of a known-good data snapshot as fallback, plus the FR-4 graceful degradation path doubles as a demo moment |
| GPU acceleration benefit looks small on toy data | Use a sufficiently large synthetic complaint volume (tens of thousands of records) for the benchmark step specifically, clearly labeled as a stress-test dataset distinct from the live demo dataset |
| Multi-agent system reads as "fake" / just sequential calls | Architecture enforces visible conflict detection, reflection, and human-approval as first-class steps with their own log entries, not just internal function calls |
