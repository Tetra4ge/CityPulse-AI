import { CityPulseState } from "./state";
import { ingestWithRetry } from "../agents/ingestion-agent";
import { triage } from "../agents/triage-agent";
import { forecast } from "../agents/forecast-agent";
import { decide } from "../agents/decision-agent";
import { reflect } from "../agents/reflection-agent";
import { insertDecision } from "../db/bigquery-client";
import { DecisionOutput } from "@/lib/types/agent-schemas";

/**
 * Node: Ingestion
 * Fetches live environmental data and logs to history.
 */
export async function ingestNode(state: CityPulseState): Promise<Partial<CityPulseState>> {
  console.log(`[LangGraph] Running Ingest Node for zone: ${state.zone}`);
  
  // We trigger AQI ingestion as the primary data point.
  const aqiResult = await ingestWithRetry("aqi", state.zone);
  
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
 * Node: Decision
 * Synthesizes triage and forecast data into an actionable risk assessment.
 */
export async function decisionNode(state: CityPulseState): Promise<Partial<CityPulseState>> {
  console.log(`[LangGraph] Running Decision Node for zone: ${state.zone}`);
  
  if (!state.forecastResult || !state.triageResult) {
    throw new Error("Missing required state (forecast or triage) for Decision Node");
  }

  const decisionResult = await decide(state.forecastResult, state.triageResult, state.zone);
  
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
