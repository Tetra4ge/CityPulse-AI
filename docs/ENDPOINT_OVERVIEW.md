# CityPulse AI — API Endpoint Overview

This is the contract every API route must satisfy, even as a Phase 0 stub returning mock data. Building this now means later phases swap mock logic for real logic without changing the route shape, request/response types, or anything consuming them.

All endpoints live under `/api` in the Next.js app. Request/response bodies use the exact schemas defined in `03_TRD.md` Section 2 — do not redefine new shapes here, this document just maps schemas to routes and HTTP methods.

## Conventions

- All responses are JSON, `Content-Type: application/json`
- All timestamps are ISO 8601 strings
- All endpoints that mutate state return the created/updated resource, not just a status code
- Errors follow a consistent shape: `{ "error": { "code": "string", "message": "string" } }` with an appropriate HTTP status (400, 404, 409, 500)
- Phase 0 stubs return realistic mock data matching the schema exactly, with a `"_mock": true` field so it's obvious during later-phase debugging which responses are still stubbed

## Endpoints

### Ingestion

| Method | Path | Purpose | Request | Response schema |
|---|---|---|---|---|
| `GET` | `/api/ingestion/aqi` | Fetch current AQI reading(s), optionally filtered by zone | Query: `?zone=string` (optional) | Array of Ingestion Agent output objects, `source: "aqi"` (see `03_TRD.md` §2.1) |
| `GET` | `/api/ingestion/weather` | Fetch current weather reading(s) | Query: `?zone=string` (optional) | Array of Ingestion Agent output objects, `source: "weather"` |
| `GET` | `/api/ingestion/citizen-reports` | Fetch recent citizen reports (simulated) | Query: `?zone=string&since=ISO8601` (optional) | Array of Ingestion Agent output objects, `source: "citizen_reports"` |
| `POST` | `/api/ingestion/citizen-reports` | Submit a new simulated citizen report (used by the report simulator in Phase 1) | Body: `{ zone, text, timestamp }` | Created Ingestion Agent output object |

### Forecast

| Method | Path | Purpose | Request | Response schema |
|---|---|---|---|---|
| `GET` | `/api/forecast` | Get current Forecast Agent output for all zones | Query: `?zone=string` (optional) | Array of Forecast Agent output objects (`03_TRD.md` §2.2) |
| `POST` | `/api/forecast` | Trigger a forecast re-run with adjusted parameters (used by the what-if simulation in Phase 5) | Body: `{ zone, traffic_multiplier?, override_features? }` | Forecast Agent output object |

### Triage

| Method | Path | Purpose | Request | Response schema |
|---|---|---|---|---|
| `GET` | `/api/triage` | Get current Triage Agent output (clustering/severity) for all zones | Query: `?zone=string` (optional) | Array of Triage Agent output objects (`03_TRD.md` §2.3) |

### Decision

| Method | Path | Purpose | Request | Response schema |
|---|---|---|---|---|
| `GET` | `/api/decision` | Get current Decision Agent recommendations for all zones | Query: `?zone=string` (optional) | Array of Decision Agent output objects (`03_TRD.md` §2.5) |
| `POST` | `/api/decision/resolve-conflict` | Trigger the Decision Agent's supplementary-data round-trip when a conflict is flagged | Body: `{ zone, conflict_id }` | Updated Decision Agent output object with `conflict_detected: false` (if resolved) |

### Reflection

| Method | Path | Purpose | Request | Response schema |
|---|---|---|---|---|
| `GET` | `/api/reflection` | Get the Reflection Agent's review for a given decision | Query: `?decision_id=string` | Reflection Agent output object (`03_TRD.md` §2.6) |

### Human approval

| Method | Path | Purpose | Request | Response schema |
|---|---|---|---|---|
| `GET` | `/api/approval/pending` | List recommendations awaiting human approval | none | Array of `{ decision, reflection }` paired objects |
| `POST` | `/api/approval` | Approve or reject a recommendation | Body: `{ decision_id, approved: boolean, reviewer_id, notes? }` | Updated approval record, logged to `agent_decisions_log` |

### Notification

| Method | Path | Purpose | Request | Response schema |
|---|---|---|---|---|
| `GET` | `/api/notification/log` | List dispatched notifications | Query: `?zone=string&since=ISO8601` (optional) | Array of notification log entries |
| `POST` | `/api/notification/dispatch` | Trigger (simulated) dispatch for an approved decision | Body: `{ decision_id }` | Array of dispatched message objects, one per target audience |

### What-if simulation

| Method | Path | Purpose | Request | Response schema |
|---|---|---|---|---|
| `POST` | `/api/whatif` | Run the full Forecast → Decision re-computation with adjusted parameters, without persisting as a real decision | Body: `{ zone, traffic_multiplier, other_overrides? }` | `{ forecast: ForecastOutput, decision: DecisionOutput, compute_time_ms: number }` |

### Agent activity timeline

| Method | Path | Purpose | Request | Response schema |
|---|---|---|---|---|
| `GET` | `/api/timeline` | Get the chronological agent activity log for the dashboard timeline UI | Query: `?zone=string&limit=number` (optional) | Array of `agent_decisions_log` entries, newest first |

### Acceleration benchmark (Phase 6, stubbed now for shape consistency)

| Method | Path | Purpose | Request | Response schema |
|---|---|---|---|---|
| `GET` | `/api/benchmark` | Return the pandas vs cudf.pandas benchmark results | none | `{ pandas_ms: number, cudf_ms: number, speedup: number, dataset_size: number, last_run: ISO8601 }` |

## Why `/api` lives in Next.js rather than a separate backend (for Phase 0-1)

For everything except the GPU-bound agent work (Triage clustering, Forecast feature prep), Next.js API routes are sufficient and keep the stack simple for a hackathon timeline. The `gpu-service/` Python service (introduced in Phase 2) is called *by* these Next.js routes via internal HTTP request, not exposed directly to the frontend — `/api/triage` and `/api/forecast` proxy to `gpu-service` once that exists, but the contract above does not change.
