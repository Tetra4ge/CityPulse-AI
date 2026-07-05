import { CityPulseState } from "./state";
import { ingestWithRetry } from "../agents/ingestion-agent";
import { triage } from "../agents/triage-agent";
import { forecast } from "../agents/forecast-agent";
import { decide } from "../agents/decision-agent";
import { reflect } from "../agents/reflection-agent";
import { resource } from "../agents/resource-agent";
import { explain } from "../agents/explainability-agent";
import { insertDecision } from "../db/bigquery-client";
import { db } from "../db";
import { decisions } from "../db/schema";
import { eq } from "drizzle-orm";
import { DecisionOutput } from "@/lib/types/agent-schemas";
import { insertTimelineEntry } from "../db/bigquery-client";
import crypto from "crypto";

/**
 * Node: Ingestion
 * Fetches live environmental data and logs to history.
 */
export async function ingestNode(state: CityPulseState): Promise<Partial<CityPulseState>> {
  console.log(`[LangGraph] Running Ingest Node for zone: ${state.zone}`);
  
  // We trigger AQI ingestion as the primary data point.
  const aqiResult = await ingestWithRetry("aqi", state.zone, state.lat, state.lng);
  
  return {
    ingestionResult: aqiResult
  };
}

/**
 * Node: Triage
 * Analyzes citizen complaints and identifies severity and spatial hotspots.
 */
export async function triageNode(state: CityPulseState): Promise<Partial<CityPulseState>> {
  console.log(`[LangGraph] Running Triage Node for zone: ${state.zone}`);
  const triageResult = await triage(state.zone);
  
  return {
    triageResult
  };
}

/**
 * Node: Forecast
 * Predicts the AQI trajectory.
 */
export async function forecastNode(state: CityPulseState): Promise<Partial<CityPulseState>> {
  console.log(`[LangGraph] Running Forecast Node for zone: ${state.zone}`);
  const forecastResult = await forecast(state.zone);
  
  return {
    forecastResult
  };
}

/**
 * Node: Resource
 * Checks hospital and transit capacity against forecast constraints.
 */
export async function resourceNode(state: CityPulseState): Promise<Partial<CityPulseState>> {
  console.log(`[LangGraph] Running Resource Node for zone: ${state.zone}`);
  
  if (!state.forecastResult) {
    throw new Error("Missing forecast result for Resource Node");
  }

  const resourceResult = await resource(state.forecastResult, state.zone);
  
  return {
    resourceResult
  };
}

/**
 * Node: Decision
 * Synthesizes triage and forecast data into an actionable risk assessment.
 */
export async function decisionNode(state: CityPulseState): Promise<Partial<CityPulseState>> {
  console.log(`[LangGraph] Running Decision Node for zone: ${state.zone}`);
  
  if (!state.forecastResult || !state.triageResult || !state.resourceResult) {
    throw new Error("Missing required state (forecast, triage, or resource) for Decision Node");
  }

  const decisionResult = await decide(state.forecastResult, state.triageResult, state.resourceResult, state.zone);
  
  // Save to the database so the Approval Queue can pick it up.
  // We pass in state.decisionId to ensure the database ID perfectly matches the LangGraph thread_id
  const dbId = await insertDecision(decisionResult, state.decisionId);
  
  // Attach the ID so the reflection node can link its review to this record
  const resultWithId = { ...decisionResult, id: dbId };

  return {
    decisionResult: resultWithId as DecisionOutput
  };
}

/**
 * Node: Reflection
 * Reviews the decision for safety and conflict resolution.
 */
export async function reflectionNode(state: CityPulseState): Promise<Partial<CityPulseState>> {
  console.log(`[LangGraph] Running Reflection Node for zone: ${state.zone}`);
  
  if (!state.decisionResult || !state.forecastResult || !state.triageResult) {
    throw new Error("Missing required state for Reflection Node");
  }

  const decisionId = (state.decisionResult as any).id;
  if (!decisionId) {
    throw new Error("Decision ID is missing from state");
  }

  // The reflection agent automatically persists its result to the `reflections` table
  const reflectionResult = await reflect(
    state.decisionResult,
    state.forecastResult,
    state.triageResult,
    decisionId
  );

  return {
    reflectionResult
  };
}

/**
 * Node: Explainability
 * Generates a human-readable trace of the decision math.
 */
export async function explainabilityNode(state: CityPulseState): Promise<Partial<CityPulseState>> {
  console.log(`[LangGraph] Running Explainability Node for zone: ${state.zone}`);
  
  if (!state.decisionResult || !state.forecastResult || !state.triageResult || !state.resourceResult || !state.reflectionResult) {
    throw new Error("Missing required state for Explainability Node");
  }

  const decisionId = (state.decisionResult as any).id;
  if (!decisionId) {
    throw new Error("Decision ID is missing from state");
  }

  const explainabilityResult = await explain(
    state.forecastResult,
    state.triageResult,
    state.resourceResult,
    state.decisionResult,
    state.reflectionResult,
    state.zone
  );

  // Save the trace report to the decision record in the database
  await db.update(decisions)
    .set({ traceReport: explainabilityResult.trace_report })
    .where(eq(decisions.id, decisionId));

  await insertTimelineEntry({
    id: crypto.randomUUID(),
    agent_name: "reflection", // We'll log as reflection or create "explainability" if valid (Wait, AgentName type might not have it)
    zone: state.zone,
    timestamp: new Date().toISOString(),
    action: `Generated Trace Report: ${explainabilityResult.trace_report.substring(0, 50)}...`,
    input_ref: decisionId,
    output_json: explainabilityResult as any,
    conflict_flag: false,
    escalation_flag: false,
    confidence: 1.0,
  });

  return {
    explainabilityResult
  };
}
