/**
 * CityPulse AI — Triage Agent Stub
 *
 * Responsibility: Process unstructured citizen reports using Gemini (summarization)
 * and cuML (clustering) to detect spatial/temporal hotspots.
 *
 * Real implementation in Phase 2 (requires GPU service for cuDF/cuML).
 * See docs/03_TRD.md §2.3 for full specification.
 */

import type { TriageOutput } from "@/lib/types/agent-schemas";

/**
 * Analyze citizen reports for a zone — classify, cluster, and assess severity.
 * Phase 0: stub — not implemented.
 */
export async function triage(_zone: string): Promise<TriageOutput> {
  throw new Error(
    "Triage Agent is not implemented until Phase 2. " +
      "Use the API route stub (/api/triage) for mock data.",
  );
}

/**
 * Check if complaint volume exceeds threshold for immediate escalation.
 * Phase 0: stub — not implemented.
 */
export async function checkEscalationThreshold(
  _zone: string,
  _complaintCount: number,
): Promise<boolean> {
  throw new Error("Triage Agent escalation logic is not implemented until Phase 2.");
}
