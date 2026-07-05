/**
 * CityPulse AI — Reflection Agent
 *
 * Responsibility: Provide human oversight checks on the Decision Agent's output.
 * Checks confidence, conflict, data staleness, and uses an LLM to sanity-check logic.
 */

import { generateContent, isLLMAvailable } from "../ai-client";
import { insertReflection, insertTimelineEntry } from "../db/bigquery-client";
import {
  DecisionOutput,
  ForecastOutput,
  TriageOutput,
  ReflectionOutput,
} from "@/lib/types/agent-schemas";
import { CONFIDENCE_CUTOFF } from "../config/thresholds";
import crypto from "crypto";

// Gemini will be lazily initialized in the functions to ensure process.env is fully loaded

// Confidence threshold is now centralized in config/thresholds.ts

/**
 * Perform a fast LLM sanity check to ensure recommendations align with the rationale.
 */
async function checkConsistencyWithLLM(decision: DecisionOutput): Promise<boolean> {
  if (!isLLMAvailable()) {
    // If no AI configured, assume consistent (true)
    return true;
  }
  const prompt = `
    You are a validation agent. Your job is to read a policy decision and verify if the 'recommendations' logically follow the stated 'rationale'.
    
    Rationale: "${decision.rationale}"
    Recommendations: ${JSON.stringify(decision.recommendations)}
    
    Return EXACTLY the word "true" if they are logically consistent.
    Return EXACTLY the word "false" if there is a glaring contradiction (e.g., rationale says air is clean, but recommendation says cancel all activities).
  `;

  try {
    const result = await generateContent(prompt);
    const text = result.text.toLowerCase();
    return text === "true";
  } catch (err: any) {
    console.error("LLM failed consistency check:", err);
    return true; // fail open for the consistency check to avoid blocking on API errors
  }
}

/**
 * Execute all 4 Reflection checks.
 */
export async function reflect(
  decision: DecisionOutput,
  forecastOutput: ForecastOutput,
  triageOutput: TriageOutput,
  decisionId: string
): Promise<ReflectionOutput> {
  const timestamp = new Date().toISOString();
  const flags: string[] = [];

  // Check 1: Confidence Threshold
  if (decision.overall_confidence < CONFIDENCE_CUTOFF) {
    flags.push("low_confidence");
  }

  // Check 2: Unresolved Conflict
  if (decision.conflict_detected) {
    flags.push("unresolved_conflict");
  }

  // Check 3: Staleness (Degraded Upstream Path)
  // Our system flags stale inputs via fallback heuristics or confidence penalties
  if (forecastOutput.confidence < 0.6 || triageOutput.complaint_count === 0) {
    // For the hackathon, we assume these are proxies for stale/missing data if we don't have explicit 'status: stale'
    // Alternatively, Ingestion Agent explicitly sets a confidence_penalty if stale. We can infer it.
    flags.push("stale_upstream_data");
  }

  // Check 4: Consistency Check (LLM)
  const isConsistent = await checkConsistencyWithLLM(decision);
  if (!isConsistent) {
    flags.push("illogical_rationale");
  }

  const requiresReview = flags.length > 0;
  const validated = !requiresReview; // If it needs review, it's not fully auto-validated
  const notes = requiresReview
    ? `Flagged for human review due to: ${flags.join(", ")}.`
    : `Decision passed all structural checks.`;

  const reflection: ReflectionOutput = {
    validated,
    requires_human_review: requiresReview,
    flags,
    notes,
  };

  // Log to Timeline
  await insertTimelineEntry({
    id: crypto.randomUUID(),
    agent_name: "reflection",
    zone: decision.zone,
    timestamp,
    action: `Reflected on decision ${decisionId}: ${requiresReview ? "Flagged for review" : "Validated"}.`,
    input_ref: decisionId,
    output_json: reflection as any,
    conflict_flag: false,
    escalation_flag: requiresReview,
    confidence: 1.0,
  });

  // Save to DB
  await insertReflection({ ...reflection, decisionId });

  return reflection;
}
