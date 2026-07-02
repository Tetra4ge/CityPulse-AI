# CityPulse AI — Tech Stack

This document maps every required tool category from the challenge brief to its concrete role in CityPulse AI. The brief requires at least two tools from each layer (Google Cloud, NVIDIA); this stack uses three to four from each, with a clear rationale for each one rather than a token integration.

## 1. Google Cloud data and application layer

| Tool | Used? | Role in CityPulse AI |
|---|---|---|
| **BigQuery** | Yes | Shared memory store. Holds `aqi_history`, `weather_history`, `complaints_history`, and `agent_decisions_log` tables. Every agent reads historical trend from here and writes its output back here, which is what gives the Decision Agent "today vs. yesterday" context instead of stateless snapshots. |
| **Cloud Storage** | Yes | Landing zone for raw ingested payloads (raw AQI API responses, raw weather API responses, raw citizen report batches) before normalization. Keeps the raw/processed boundary clean and gives the Ingestion Agent a durable retry/replay source. |
| **Gemini (via Vertex AI / Gemini Enterprise Agent Platform)** | Yes | Two distinct roles: (1) Triage Agent uses Gemini to summarize and classify unstructured citizen complaint text into symptom category and severity language; (2) Decision Agent uses Gemini to generate the natural-language rationale for a recommendation that was computed from structured inputs — Gemini explains the decision, it does not compute the risk score itself. |
| **Looker** | Yes | Presentation layer: zone-level risk map, the agent activity timeline (showing each agent's action and handoff in sequence), historical trend charts, and the what-if simulation control. |
| Managed Service for Apache Spark | Not used | Data volume in this hackathon scope does not require distributed Spark processing; `cudf.pandas`/`cuML` on a single GPU instance is the more appropriate scale-fit tool (see NVIDIA section). Noted here for completeness/transparency rather than silently omitted. |
| Google Kubernetes Engine | Optional / stretch | Architecturally supported as the deployment target for containerized agent services (see `04_ARCHITECTURE.md`, deployment view); a single GPU-backed VM is sufficient for the hackathon demo, GKE would be the natural next step for production. |

**Why this satisfies "two or more":** BigQuery, Cloud Storage, Gemini, and Looker are all load-bearing, not decorative — removing any one of them breaks a specific requirement (shared memory, raw data durability, complaint understanding, or the dashboard output).

## 2. NVIDIA acceleration layer

| Tool | Used? | Role in CityPulse AI |
|---|---|---|
| **cuDF / cudf.pandas** | Yes | Drop-in GPU acceleration for the Triage Agent's feature engineering over citizen report volume, and the Forecast Agent's historical-window feature preparation. Enabled via `cudf.pandas.install()` with no rewrite of existing pandas code — this is also a good talking point for judges, since it demonstrates near-zero-friction acceleration. |
| **NVIDIA RAPIDS (cuML)** | Yes | GPU-accelerated clustering (DBSCAN or KMeans) in the Triage Agent, used to detect pollution hotspots and complaint clusters by zone/time/category. This is the step that benefits most from acceleration since clustering cost scales non-linearly with data volume. |
| **NVIDIA GPUs on Google Cloud** | Yes | Runtime substrate for the above — an L4 (or equivalent) GPU-backed Compute Engine VM or GKE node pool hosts the Forecast and Triage agent processing. |
| RAPIDS Accelerator for Apache Spark | Not used | Not applicable since Spark itself is not used in this architecture (see Google Cloud section above); would become relevant if the project scaled to a Spark-based ingestion layer in a future iteration. |

**Why this satisfies "two or more":** `cudf.pandas` and `cuML` are both used for genuinely different purposes (feature engineering acceleration vs. clustering acceleration), running on real NVIDIA GPU infrastructure on Google Cloud, with a measured before/after benchmark — not just an import statement that's never exercised.

## 3. Supporting / glue technologies (not part of the required tool list, included for completeness)

| Tool | Role |
|---|---|
| Python (FastAPI or equivalent) | Orchestrator and agent service implementation |
| Pandas / scikit-learn | CPU baseline used specifically to produce the honest before/after acceleration benchmark against `cudf.pandas`/`cuML` |
| OpenAQ API | Live AQI data source |
| Public weather API (e.g. OpenWeatherMap or equivalent) | Live weather data source |
| Simulated citizen-report generator | Statistically plausible synthetic complaint stream, correlated with AQI spikes, clearly disclosed as simulated |

## 4. Acceleration benchmark methodology (the evidence judges will look for)

To make the "evidence that acceleration improves the experience" requirement concrete rather than asserted:

1. Generate a synthetic stress-test dataset of citizen reports (tens of thousands of records) — large enough to make the CPU/GPU gap meaningful, clearly separate from the smaller live-demo dataset.
2. Run the identical Triage Agent feature-engineering + clustering pipeline twice: once with standard `pandas` + `scikit-learn`, once with `cudf.pandas` + `cuML`, with no other code changes.
3. Record wall-clock time for both runs and present as a simple before/after table and chart.
4. Tie the result directly back to product experience: this is the reason the what-if simulation slider can re-run the pipeline in near real time during a live demo instead of requiring a multi-second wait, which is the actual decision-quality benefit (a city official can explore "what if traffic increases" interactively rather than submitting a batch job and waiting).

## 5. Mapping back to the challenge brief checklist

- Clear real-world user and problem → district health officer, school administrator, hospital, transit authority (see `02_PRD.md`)
- Specific decision/bottleneck/workflow → daily advisory decision, currently manual and slow (see `02_PRD.md` §1-2)
- Pipeline that ingests, cleans, analyzes, models, visualizes → Ingestion → Shared Memory → Forecast/Triage → Decision → Looker (see `04_ARCHITECTURE.md`)
- Useful output → risk score, ranked recommendations per stakeholder, dashboard, agent activity timeline
- Evidence acceleration improves the experience → pandas vs. cudf.pandas/cuML benchmark, tied to what-if simulation responsiveness (see §4 above)
- Two or more Google Cloud tools → BigQuery, Cloud Storage, Gemini, Looker
- Two or more NVIDIA tools → cudf.pandas, cuML, on NVIDIA GPUs on Google Cloud
