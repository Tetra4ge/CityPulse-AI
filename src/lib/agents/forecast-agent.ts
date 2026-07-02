/**
 * CityPulse AI — Forecast Agent Stub
 *
 * Responsibility: Predict next-period AQI per zone using historical + current data.
 * Re-invoked on demand by the what-if simulation with adjusted input features.
 *
 * Real implementation in Phase 2.
 * See docs/03_TRD.md §2.2 for full specification.
 */

import type { ForecastOutput } from "@/lib/types/agent-schemas";

/**
 * Generate AQI forecast for a zone.
 * Phase 0: stub — not implemented.
 */
export async function forecast(_zone: string): Promise<ForecastOutput> {
  throw new Error(
    "Forecast Agent is not implemented until Phase 2. " +
      "Use the API route stub (/api/forecast) for mock data.",
  );
}

/**
 * Re-run forecast with adjusted features for what-if simulation.
 * Phase 0: stub — not implemented.
 */
export async function forecastWhatIf(
  _zone: string,
  _trafficMultiplier: number,
  _overrideFeatures?: Record<string, number>,
): Promise<ForecastOutput> {
  throw new Error("Forecast Agent what-if logic is not implemented until Phase 2.");
}
