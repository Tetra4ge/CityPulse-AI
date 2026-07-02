/**
 * CityPulse AI — Decision Agent Stub
 *
 * Responsibility: Synthesize Forecast + Triage + Shared Memory into a recommendation.
 * Detect and resolve conflicts between predictive and ground-truth signals.
 *
 * Real implementation in Phase 3.
 * See docs/03_TRD.md §2.5 for full specification.
 */

import type {
  ForecastOutput,
  TriageOutput,
  DecisionOutput,
} from "@/lib/types/agent-schemas";

/**
 * Synthesize a recommendation from forecast and triage outputs.
 * Phase 0: stub — not implemented.
 */
export async function decide(
  _forecastOutput: ForecastOutput,
  _triageOutput: TriageOutput,
  _zone: string,
): Promise<DecisionOutput> {
  throw new Error(
    "Decision Agent is not implemented until Phase 3. " +
      "Use the API route stub (/api/decision) for mock data.",
  );
}

/**
 * Detect conflict between forecast risk and triage severity signal.
 * Conflict = divergence of more than one risk tier.
 * Phase 0: stub — not implemented.
 */
export async function detectConflict(
  _forecastOutput: ForecastOutput,
  _triageOutput: TriageOutput,
): Promise<boolean> {
  throw new Error("Decision Agent conflict detection is not implemented until Phase 3.");
}

/**
 * Request supplementary data and re-evaluate on conflict.
 * Phase 0: stub — not implemented.
 */
export async function resolveConflict(
  _zone: string,
  _conflictId: string,
): Promise<DecisionOutput> {
  throw new Error("Decision Agent conflict resolution is not implemented until Phase 3.");
}
