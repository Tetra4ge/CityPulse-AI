# Phase 4 — Reflection Agent, Human Approval, Notification Agent

**Window:** Hours 24–32 · **Team:** 3 people
**Source:** `03_TRD.md` §2.6, §2.7, §2.8, NFR-4; `02_PRD.md` FR-13 to FR-15; `04_ARCHITECTURE.md` §2 principle 5, §3 steps 6–8

## Objective
Complete the human-oversight spine of the system. `04_ARCHITECTURE.md` principle 5 states this is *"structurally required, not optionally consulted"* — this phase is where that principle becomes actual enforced code, not a UI convention.

## Part A — Reflection Agent (`03_TRD.md` §2.6)

**Step 1.** Input: Decision Agent output + the upstream Forecast/Triage outputs it was built from.

**Step 2.** Implement exactly the four checks named in your TRD:
1. Is `overall_confidence` below a minimum threshold? (you'll need to pick a numeric threshold — not specified in your docs, so this is a team decision; document it clearly since a judge may ask)
2. Is there unresolved conflict remaining after the Phase 3 supplementary-data round-trip?
3. Is any upstream signal `status: "stale"` (from Phase 1's degraded-path flag)?
4. Does the recommendation logically follow from the stated rationale? — this is the vaguest of the four checks in your source doc; a reasonable hackathon-scope implementation is a second, smaller Gemini call asking it to sanity-check consistency between `risk_level`/`recommendations` and `rationale`, flagging a mismatch. **[PLAN — implementation approach not specified in source docs]**

**Step 3.** Output schema exactly per TRD:
```json
{
  "validated": true,
  "requires_human_review": true,
  "flags": ["low_confidence", "stale_weather_data"],
  "notes": "string"
}
```
Persist to `reflections`, linked via `decision_id`.

**Step 4.** Wire `GET /api/reflection?decision_id=` to return this.

## Part B — Human Approval (`03_TRD.md` §2.7, NFR-4)

**Step 1.** Build a lightweight approve/reject UI surface showing: the Decision Agent's recommendation + the Reflection Agent's flags together (per `ENDPOINT_OVERVIEW.md`, `GET /api/approval/pending` returns paired `{ decision, reflection }` objects — build the UI around this pairing, not the decision alone).

**Step 2.** This is the most important architectural rule in this phase, stated verbatim in your TRD: *"No code path exists from Decision Agent output to Notification Agent that does not pass through this step."* And NFR-4: *"No automated dispatch path may bypass human approval."*

Implementation approach: the Notification Agent's dispatch function/endpoint should **check `decisions.approval_status === 'approved'` as a hard precondition** before doing anything else — not trust that the caller already checked. This makes the constraint structural (enforced in code that would fail closed) rather than conventional (relying on the frontend to only call dispatch after approval, which a bug or a future API consumer could bypass).

**Step 3.** Wire `POST /api/approval` to accept `{ decision_id, approved, reviewer_id, notes? }`, update `decisions.approval_status`, `reviewer_id`, `reviewed_at`, and log the action to `agent_decisions_log` with `agent_name: 'human'` — per TRD: "Approval/rejection is logged to `agent_decisions_log` with a human identifier and timestamp."

**Step 4.** No auth system needed — PRD §4 explicitly lists "full identity/auth system for the human-approval step" as a non-goal for this submission; a lightweight `reviewer_id` text field is sufficient.

## Part C — Notification Agent (`03_TRD.md` §2.8)

**Step 1.** Input: an approved Decision Agent output only (enforced per Part B, Step 2 above).

**Step 2.** Format role-specific messages per target audience — school, hospital, transit, citizen-facing summary — reusing the `recommendations[]` array already produced by the Decision Agent in Phase 3.

**Step 3.** Write to `notifications_log`, `dispatch_status: 'simulated'` (the schema default). Real SMS/email/webhook dispatch is explicitly out of scope per TRD §7 and PRD §4 — do not spend time on this, simulation is sufficient and expected.

**Step 4.** Wire `POST /api/notification/dispatch` accepting `{ decision_id }`, returning an array of dispatched message objects, one per target audience, per `ENDPOINT_OVERVIEW.md`.

**Step 5.** Wire `GET /api/notification/log` for the dashboard to display dispatched history.

## Team split suggestion
- 1 person: Reflection Agent
- 1–2 people: Approval UI + the hard-precondition enforcement logic
- 1 person: Notification Agent

## Deliverables checklist
- [x] Reflection Agent runs all four checks, writes to `reflections`
- [x] Approval UI shows decision + reflection flags paired together
- [x] Notification dispatch is structurally blocked (fails, not just declines) if `approval_status !== 'approved'`
- [x] Approval/rejection logged to `agent_decisions_log` with reviewer ID + timestamp
- [x] Notification Agent formats correct per-audience messages, writes to `notifications_log`
- [x] All Part A/B/C endpoints wired and returning real (non-mock) data

## Milestone check (hour 32)
Full happy-path loop works end to end with real (not mocked) agents: ingest → forecast/triage → decision → reflection → human approves → notification dispatches and appears in the log. This matches `04_ARCHITECTURE.md` §3 steps 1–8 exactly — walk through each step manually and confirm it against that list.

**Also test the negative case:** attempt to call the notification dispatch endpoint directly on a `pending` decision (bypassing the approval UI) and confirm it fails. If it succeeds, your human-in-the-loop requirement is not actually architecturally enforced — this is graded explicitly per NFR-4 and PRD success metric "100% (no bypass path)."

## Common pitfalls
- Building approval as a frontend-only gate (button hidden until reviewed) without a backend precondition check — this technically satisfies the UI demo but fails the "no bypass path" requirement if anyone (including a judge poking at your API) calls the dispatch endpoint directly.
- Skipping the reflection→approval pairing in the UI and showing only the raw decision — judges are specifically told to expect transparency into *why* the system flagged something (PRD user story 2), not just the final recommendation.
