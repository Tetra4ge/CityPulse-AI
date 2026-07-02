# GPU Service — cuDF/cuML Python Service

This directory contains the Python service for GPU-accelerated data processing
using NVIDIA RAPIDS (`cudf.pandas` and `cuML`).

## Why a separate service?

`cudf.pandas` and `cuML` are Python libraries requiring an NVIDIA GPU runtime,
which does not belong inside a Next.js app. This service runs independently
and is called by the Next.js API routes (`/api/triage` and `/api/forecast`)
via internal HTTP request.

## When is this built?

**Phase 2** — not implemented yet. This directory is scaffolded in Phase 0
so the project structure is correct from day one.

## What it will contain

- FastAPI service with endpoints for:
  - Citizen report feature engineering + DBSCAN clustering (Triage Agent)
  - Historical-window feature preparation (Forecast Agent)
  - Benchmark runner (pandas vs. cudf.pandas comparison)
- `requirements.txt` with pinned RAPIDS, cuDF, cuML, FastAPI versions
- Dockerfile for GPU-enabled deployment

## Architecture reference

See `docs/03_TRD.md` §5 and `docs/05_TECH_STACK.md` §2 for details on
how GPU acceleration fits into the system.
