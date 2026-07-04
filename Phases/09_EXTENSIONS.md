# Hackathon Extensions — Future Roadmap

This document outlines the remaining Tier 2 and Tier 3 extensions requested during the Phase 4.5 Hackathon Polish session. These are documented here as a "Future Roadmap" to demonstrate vision and scalability to the judges without risking the stability of the core pipeline during the competition.

*(Note: Tier 1 and Tier 2.2 features like Crisis Replay, Confidence Visuals, Conflict View, and Escalation Timers were successfully implemented directly into the Phase 4 dashboard codebase.)*

## Tier 2 — Moderate Effort, Core Architecture Extensions

### 2.1 Multi-Hazard Generalization
**Concept:** Generalize the risk-tier and conflict logic so it isn't hardcoded to just "AQI vs. complaints" but can handle a second hazard type (e.g., heat-index reading, or industrial chemical sensors) through the exact same Decision Agent pipeline.
**Value:** Expands the target market from "Air Quality software" to a genuine "Municipal Crisis-Response Platform".

### 2.3 Backtesting & "Time Saved" Quantification
**Concept:** Run the Decision Agent's logic against a synthetic "yesterday" dataset and compare its time-to-recommendation against a simulated manual bureaucratic process.
**Value:** Provides a concrete, defensible, and quantified "time saved" metric for the hackathon pitch (e.g., "In our simulations, decision-to-draft time dropped from multi-hour to under a minute").

### 2.4 Natural-Language Query over the Audit Trail (RAG)
**Concept:** Allow users to type questions like *"Why did Zone B go to severe risk yesterday?"* and use Google Gemini to retrieve and summarize the relevant `agent_decisions_log` entries.
**Value:** Demonstrates enterprise-grade observability by turning a static audit trail into an interactive, grounded knowledge base.

### 2.5 Multi-Provider Ingestion Redundancy
**Concept:** Pull AQI/weather from two independent API providers and mathematically reconcile them (average or flag disagreements) before writing to shared memory.
**Value:** Dramatically strengthens the degraded-path resilience story. Instead of relying on a single API, the system cross-validates live sources.

---

## Tier 3 — High Effort, Meaningfully Extends Scope

### 3.1 Real 311 / Open-Data Integration
**Concept:** Swap the simulated `complaint-simulator.ts` for a real municipal 311 service-request dataset feed (even if historical).
**Value:** Adds immense credibility to the "ground-truth" data fusion claim, proving the architecture works with real municipal structures.

### 3.2 Human Feedback Loop & Grading Signal
**Concept:** After a decision is approved or rejected, allow the human official to rate whether the AI's recommendation was appropriate.
**Value:** Demonstrates long-term AI calibration tracking to the judges, answering the "does this get better over time" question without needing to build real-time retraining pipelines.

### 3.3 GIS-Based Real Geographic Mapping
**Concept:** Replace abstract "Location" names with a real React-Leaflet map using actual geographic boundaries (e.g., GeoJSON polygons) for a target city.
**Value:** Provides massive visual polish and realism for the final UI demo.
