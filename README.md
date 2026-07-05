# CityPulse AI

**Multi-agent decision intelligence platform for urban health risk.** CityPulse AI turns raw air quality, weather, and citizen complaint signals into a single, human-approved municipal action — not just a number on a dashboard. It is built as a society of cooperating agents (Ingestion, Forecast, Triage, Decision, Reflection, Notification) that negotiate, disagree, and converge on recommendations, with a human always in the loop before any action is dispatched.

Built for the Gen AI Academy APAC Edition — Challenge Track 2: Autonomous Multi-Agent System (sponsored by NVIDIA).

## Current Status

**Fully Operational (Phases 1-5 Completed).** The system is now a working end-to-end multi-agent pipeline. 
- The React "Mission Control" dashboard is live and wired to all backend API routes, with dynamically resizing columns for better visibility of Agent Activity and Human Approval.
- The Python GPU service is complete (with cuDF/cuML and a CPU fallback).
- The full LangGraph workflow (Ingestion → Forecast/Triage → Decision → Reflection → Human Approval → Notification) is successfully implemented and tested.
- **Robust AI Integration:** Gemini is now lazy-loaded dynamically in all agents, perfectly integrating with Next.js App Router and preventing caching bugs.

## Documentation

All project reference documents are in [`/docs`](./docs):

- [`01_OVERVIEW.md`](./docs/01_OVERVIEW.md) — Project theme and rationale
- [`02_PRD.md`](./docs/02_PRD.md) — Product requirements
- [`03_TRD.md`](./docs/03_TRD.md) — Technical requirements and agent schemas
- [`04_ARCHITECTURE.md`](./docs/04_ARCHITECTURE.md) — System architecture and data flow
- [`05_TECH_STACK.md`](./docs/05_TECH_STACK.md) — Google Cloud + NVIDIA tool mapping
- [`skills.md`](./docs/skills.md) — UI design system and behavioral guardrails

## Mentor Guidelines & Sprint Plan

Based on the mentor's guidelines, this project follows a strict **5-Day Sprint Plan** combined with a robust **"Mission Control"** UI philosophy:
*   **Sprint Plan:** Development is broken down into a structured 5-day sprint mapping to 7 core phases, fully detailed in [`/Phases/00_INDEX.md`](./Phases/00_INDEX.md).
*   **UI/UX Aesthetic:** The frontend avoids playful designs in favor of a "Mission Control" vibe (dark mode, strict 4-color risk scale, mono font for data) to present a serious, data-dense decision interface. (Detailed in Phase 5 documentation).

## Setup

### Prerequisites

- Node.js 18+ and npm
- No cloud credentials needed for Phase 0 (everything is stubbed/mocked)

### Install and run

```bash
# Clone the repository
git clone <repo-url>
cd CityPulse-AI

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

No env vars are required for Phase 0. Each variable in `.env.example` is annotated with the phase it becomes required.

### Available scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript compiler check |

## Project Structure

```
citypulse-ai/
├── docs/              # All project reference documents
├── src/
│   ├── app/           # Next.js App Router pages and API routes
│   │   ├── api/       # 13 API route stubs (mock data)
│   │   ├── dashboard/ # Dashboard page (Phase 4-5)
│   │   └── ...        # Root layout and landing page
│   ├── components/    # React components (ui/, agents/, dashboard/)
│   ├── lib/
│   │   ├── agents/    # Agent function stubs (6 agents)
│   │   ├── db/        # BigQuery client stub + SQL DDL schema files
│   │   ├── types/     # TypeScript type definitions
│   │   └── orchestrator.ts
│   └── styles/        # Additional stylesheets
├── gpu-service/       # Python cuDF/cuML service (Phase 2)
└── ...                # Config files (tailwind, tsconfig, eslint, etc.)
```

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes (Phase 0-1), FastAPI GPU service (Phase 2+)
- **Database:** BigQuery (production), local SQLite (development)
- **AI/ML:** Gemini (via Vertex AI), cudf.pandas, cuML (NVIDIA RAPIDS)
- **Cloud:** Google Cloud (BigQuery, Cloud Storage, Vertex AI, Looker)

## License

See [LICENSE](./LICENSE) for details.
