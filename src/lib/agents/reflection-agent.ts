/**
 * CityPulse AI — Reflection Agent Stub
 *
 * Responsibility: Quality-check the Decision Agent's output before it reaches a human.
 * Checks confidence thresholds, unresolved conflicts, stale data, and logical consistency.
 *
 * Real implementation in Phase 3.
 * See docs/03_TRD.md §2.6 for full specification.
 */

import type { DecisionOutput, ReflectionOutput } from "@/lib/types/agent-schemas";

/**
 * Review a decision for quality, completeness, and confidence.
 * Phase 0: stub — not implemented.
 */
export async function reflect(_decision: DecisionOutput): Promise<ReflectionOutput> {
  throw new Error(
    "Reflection Agent is not implemented until Phase 3. " +
      "Use the API route stub (/api/reflection) for mock data.",
  );
}
