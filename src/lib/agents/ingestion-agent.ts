/**
 * CityPulse AI — Ingestion Agent Stub
 *
 * Responsibility: Pull and normalize external data (AQI, weather, citizen reports).
 * Handle failures gracefully with retry and confidence degradation.
 *
 * Real implementation in Phase 1-2.
 * See docs/03_TRD.md §2.1 for full specification.
 */

import type { IngestionOutput, IngestionSource } from "@/lib/types/agent-schemas";

/**
 * Pull data from an external source and normalize it.
 * Phase 0: stub — returns a typed placeholder.
 */
export async function ingest(_source: IngestionSource, _zone?: string): Promise<IngestionOutput> {
  throw new Error(
    "Ingestion Agent is not implemented until Phase 1. " +
      "Use the API route stubs (/api/ingestion/*) for mock data.",
  );
}

/**
 * Retry with exponential backoff on API failure.
 * Phase 0: stub — not implemented.
 */
export async function ingestWithRetry(
  _source: IngestionSource,
  _zone?: string,
  _maxRetries?: number,
): Promise<IngestionOutput> {
  throw new Error("Ingestion Agent retry logic is not implemented until Phase 1.");
}
