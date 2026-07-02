/**
 * CityPulse AI — Notification Agent Stub
 *
 * Responsibility: Format and simulate-dispatch approved recommendations
 * to target audiences (schools, hospitals, transit, citizens).
 *
 * Real implementation in Phase 3.
 * See docs/03_TRD.md §2.8 for full specification.
 */

import type {
  DecisionOutput,
  NotificationEntry,
  TargetAudience,
} from "@/lib/types/agent-schemas";

/**
 * Format and dispatch notifications for an approved decision.
 * Phase 0: stub — not implemented.
 */
export async function notify(
  _decision: DecisionOutput,
  _approvedBy: string,
): Promise<NotificationEntry[]> {
  throw new Error(
    "Notification Agent is not implemented until Phase 3. " +
      "Use the API route stub (/api/notification) for mock data.",
  );
}

/**
 * Format a notification message for a specific target audience.
 * Phase 0: stub — not implemented.
 */
export function formatMessage(
  _decision: DecisionOutput,
  _target: TargetAudience,
): string {
  throw new Error("Notification Agent message formatting is not implemented until Phase 3.");
}
