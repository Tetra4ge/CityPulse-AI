# CityPulse AI — Project Overview

## Hackathon track
Gen AI Academy APAC Edition — Challenge Track 2: Autonomous Multi-Agent System (sponsored by NVIDIA)

## One-line pitch
CityPulse AI is an autonomous multi-agent decision intelligence platform that turns raw air quality, weather, and citizen complaint signals into a single, human-approved municipal action — not just a number on a dashboard.

## The theme

Most air quality tools answer the question "what is the AQI today?" CityPulse AI answers a different, harder question:

> "What should the city actually do today, who does it affect, and how confident are we?"

That reframing is the entire design philosophy of the project. Instead of one pipeline that ends in a chart, CityPulse AI is a small society of cooperating agents — each with a narrow job, each able to act semi-independently, each able to disagree with the others — that negotiate their way to a recommendation, check their own reasoning, and only then hand the decision to a human for sign-off.

## Why this problem

Air quality is a daily, high-stakes, low-visibility decision problem for city officials, school administrators, hospitals, and transit authorities:

- A district health officer needs to decide by early morning whether to issue a heat-and-pollution advisory.
- A school administrator needs to know whether to cancel outdoor sports in a specific zone.
- A hospital respiratory ward needs early warning to staff up before patient load spikes.
- Citizens with asthma or other respiratory conditions need a clear, not just numeric, signal.

Today this decision is made manually: pulling AQI dashboards, checking weather, guessing at on-the-ground severity from incomplete reports, and acting hours later than the data would allow. CityPulse AI compresses that into a single reviewed recommendation, with full visibility into how the system arrived at it.

## Why multi-agent, not a single pipeline

A single script that ingests data, runs a model, and calls an LLM once is not an autonomous system — it is a pipeline with a chatbot bolted on. CityPulse AI is deliberately built as multiple narrow agents that:

- own a distinct responsibility (ingestion, forecasting, triage, decision, reflection, notification)
- read and write to **shared memory** so decisions are made with historical context, not just today's snapshot
- can **disagree** with each other (forecast says medium risk, ground-truth complaints say very high) and trigger a negotiation rather than silently averaging the conflict away
- can **recover** from upstream failure (a stale or failed AQI feed does not crash the system, it degrades gracefully with a lowered confidence score)
- pass through a **reflection step** that asks whether the recommendation is reasonable, whether evidence is missing, and whether a human needs to look at it
- require **human approval** before any notification is dispatched, directly satisfying the human-oversight expectation in the challenge brief

## Why acceleration matters here (not just as a checkbox)

The citizen-report clustering and AQI feature-engineering steps are the parts of the pipeline most sensitive to data volume, because every new complaint or sensor reading reshapes the feature space agents reason over. Running these steps on NVIDIA RAPIDS (`cudf.pandas`, `cuML`) rather than vanilla pandas is what makes the **what-if simulation** feel instantaneous rather than batch-like. That responsiveness is the actual product benefit: a city official can drag a "traffic +20%" slider and watch the Forecast and Decision agents re-converge on a new recommendation in close to real time, instead of waiting on a multi-second recompute. Acceleration here is in service of a better decision experience, not a vanity benchmark.

## Data honesty statement

AQI and weather data are pulled from live public sources (OpenAQ and a public weather API). Citizen complaint reports are **simulated** to emulate a real municipal complaint stream, because live public complaint feeds do not exist for most cities and real emergency-response data is typically private. This is standard practice for hackathon demonstrations of architecture, and is stated here transparently rather than implied.

## What a judge should walk away believing

1. There is a specific, named user and a specific decision this system shortens or improves.
2. The system is genuinely multi-agent — agents disagree, escalate, recover from failure, and reflect, not just pass data downstream in a straight line.
3. A human is meaningfully in the loop before any action is dispatched.
4. NVIDIA acceleration is demonstrably responsible for a faster, more interactive decision experience, with a real before/after benchmark.
5. The system uses a coherent combination of Google Cloud and NVIDIA tooling, not a token integration of either.

## Companion documents

- `02_PRD.md` — Product Requirements Document
- `03_TRD.md` — Technical Requirements Document
- `04_ARCHITECTURE.md` — System and agent architecture
- `05_TECH_STACK.md` — Google Cloud and NVIDIA tool usage in detail
