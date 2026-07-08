/**
 * CityPulse AI — Triage Agent
 *
 * Responsibility: Make sense of unstructured citizen reports.
 * Uses Gemini (via @google/generative-ai) to classify symptom category & severity,
 * calls the Python FastAPI service (with cuDF/cuML & CPU fallback) to cluster reports
 * and detect spatial/temporal hotspots, and escalates directly to the Decision Agent on spikes.
 */

import { generateContent, isLLMAvailable } from "../ai-client";
import {
  queryComplaintsHistory,
  insertTimelineEntry,
} from "../db/bigquery-client";
import type { TriageOutput, SeveritySignal, ComplaintCategory } from "@/lib/types/agent-schemas";
import crypto from "crypto";

// Coordinate mappings for zones
const ZONE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Zone-A": { lat: 28.6304, lng: 77.2177 },
  "Zone-B": { lat: 28.5823, lng: 77.0500 },
  "Zone-C": { lat: 28.5355, lng: 77.2718 },
  "Zone-D": { lat: 28.7495, lng: 77.1200 },
};

const DEFAULT_COORDS = { lat: 28.6139, lng: 77.2090 };

// Gemini will be lazily initialized in the functions to ensure process.env is fully loaded

/**
 * Classify a complaint text using Gemini.
 */
async function classifyComplaintWithLLM(
  rawText: string
): Promise<{ category: ComplaintCategory; severity: SeveritySignal; summary: string }> {
  if (!isLLMAvailable()) {
    throw new Error("No LLM API key configured (set OPENROUTER_API_KEY or GEMINI_API_KEY)");
  }

  const prompt = `
    You are an expert urban dispatcher. Classify the following citizen complaint about air quality or weather.
    Complaint: "${rawText}"
    
    Provide the classification in JSON format with exactly three fields:
    - "category": Must be exactly one of "respiratory", "visibility", "odor", or "other".
    - "severity": Must be exactly one of "low", "medium", "high", or "very_high".
    - "summary": A brief one-sentence summary of the user's issue.
    
    Format: Return ONLY valid JSON. Do not write anything else.
  `;

  const result = await generateContent(prompt, { jsonMode: true });
  const jsonText = result.text.replace(/```json/g, "").replace(/```/g, "").trim();
  const data = JSON.parse(jsonText);

  return {
    category: (data.category || "other") as ComplaintCategory,
    severity: (data.severity || "medium") as SeveritySignal,
    summary: data.summary || rawText,
  };
}

/**
 * Fallback keyword classifier when Gemini is offline or unconfigured.
 */
function classifyComplaintKeywordFallback(
  rawText: string
): { category: ComplaintCategory; severity: SeveritySignal; summary: string } {
  const text = rawText.toLowerCase();
  let category: ComplaintCategory = "other";
  let severity: SeveritySignal = "low";

  if (
    text.includes("cough") ||
    text.includes("breath") ||
    text.includes("inhaler") ||
    text.includes("throat") ||
    text.includes("respiratory") ||
    text.includes("chest")
  ) {
    category = "respiratory";
    severity = "medium";
  } else if (
    text.includes("smog") ||
    text.includes("fog") ||
    text.includes("haze") ||
    text.includes("see") ||
    text.includes("visibility")
  ) {
    category = "visibility";
    severity = "medium";
  } else if (
    text.includes("smell") ||
    text.includes("odor") ||
    text.includes("stink") ||
    text.includes("chemical") ||
    text.includes("gas")
  ) {
    category = "odor";
    severity = "medium";
  }

  if (
    text.includes("severe") ||
    text.includes("emergency") ||
    text.includes("hospital") ||
    text.includes("asap") ||
    text.includes("extremely") ||
    text.includes("very")
  ) {
    severity = "high";
    if (text.includes("emergency") || text.includes("hospital") || text.includes("extremely")) {
      severity = "very_high";
    }
  }

  return {
    category,
    severity,
    summary: rawText.length > 80 ? rawText.substring(0, 77) + "..." : rawText,
  };
}

/**
 * Run Gemini / Rule-based classification on a complaint text.
 */
export async function classifyComplaint(
  rawText: string
): Promise<{ category: ComplaintCategory; severity: SeveritySignal; summary: string }> {
  if (isLLMAvailable()) {
    try {
      return await classifyComplaintWithLLM(rawText);
    } catch (err: any) {
      console.warn(`LLM classification failed: ${err.message}. Using rule-based fallback.`);
    }
  }
  return classifyComplaintKeywordFallback(rawText);
}

/**
 * Generate a deterministic coordinate offset for a complaint using a string hash
 */
function getCoordinateOffset(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = ((Math.abs(hash) % 100) / 100 - 0.5) * 0.008;
  const lngOffset = (((Math.abs(hash) >> 8) % 100) / 100 - 0.5) * 0.008;
  return { latOffset, lngOffset };
}

/**
 * Analyze citizen reports for a zone — classify, cluster, and assess severity.
 */
export async function triage(zone: string): Promise<TriageOutput> {
  const now = new Date();
  const nowStr = now.toISOString();

  // 1. Query complaints history (last 48 hours for trend analysis)
  const since48h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const allHistory = await queryComplaintsHistory(zone, since48h);

  // Split into today (last 24h) and yesterday (24h - 48h)
  const cutOff24h = now.getTime() - 24 * 60 * 60 * 1000;
  const complaintsToday = allHistory.filter((h) => new Date(h.timestamp).getTime() >= cutOff24h);
  const complaintsYesterday = allHistory.filter(
    (h) => new Date(h.timestamp).getTime() < cutOff24h && new Date(h.timestamp).getTime() >= cutOff24h - 24 * 60 * 60 * 1000
  );

  const countToday = complaintsToday.length;
  const countYesterday = complaintsYesterday.length;

  // 2. Classify and format today's complaints
  const formattedComplaints = [];
  const coords = ZONE_COORDINATES[zone] || DEFAULT_COORDS;

  for (const c of complaintsToday) {
    const rawText = (c.payload as any).raw_text;
    const categoryFromDB = (c.payload as any).category;
    const severityFromDB = (c.payload as any).severity;

    // Run classifier if category/severity are default/missing
    let category = categoryFromDB;
    let severity = severityFromDB;
    let summary = rawText;

    if (!category || category === "other" || !severity || severity === "medium") {
      const cls = await classifyComplaint(rawText);
      category = cls.category;
      severity = cls.severity;
      summary = cls.summary;
    }

    const { latOffset, lngOffset } = getCoordinateOffset(rawText);
    const complaintTime = new Date(c.timestamp).getTime();
    const timeOffsetHours = (now.getTime() - complaintTime) / (60 * 60 * 1000);

    formattedComplaints.push({
      id: (c as any).id || crypto.randomUUID(),
      raw_text: rawText,
      category,
      severity,
      latitude: coords.lat + latOffset,
      longitude: coords.lng + lngOffset,
      timestamp: c.timestamp,
      time_offset_hours: timeOffsetHours,
      summary,
    });
  }

  // 3. Trigger DBSCAN clustering via Python GPU Service
  const pythonUrl = `${process.env.NEXT_PUBLIC_GPU_SERVICE_URL || "http://127.0.0.1:8000"}/triage`;
  const apiKey = process.env.GPU_SERVICE_API_KEY || "";
  let hotspotDetected = false;
  let clusterCount = 0;
  let computedOnGpu = false;

  if (countToday > 0) {
    try {
      const res = await fetch(pythonUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify({
          zone,
          complaints: formattedComplaints,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        hotspotDetected = data.hotspot_detected;
        clusterCount = data.cluster_count;
        computedOnGpu = data.computed_on_gpu;
      } else {
        throw new Error(`Python triage service returned status ${res.status}`);
      }
    } catch (err: any) {
      console.error(`Triage Agent failed to contact Python backend: ${err.message}. Running fallback clustering.`);
      // Simple heuristic fallback: if more than 3 complaints today, assume potential hotspot
      hotspotDetected = countToday >= 3;
      clusterCount = hotspotDetected ? 1 : 0;
    }
  }

  // 4. Calculate trend
  let trendVsYesterday: "up" | "down" | "flat" = "flat";
  if (countToday > countYesterday) trendVsYesterday = "up";
  else if (countToday < countYesterday) trendVsYesterday = "down";

  // 5. Calculate overall severity signal
  let severitySignal: SeveritySignal = "low";
  for (const c of formattedComplaints) {
    if (c.severity === "very_high") {
      severitySignal = "very_high";
      break;
    } else if (c.severity === "high") {
      severitySignal = "high";
    } else if (c.severity === "medium" && severitySignal !== "high") {
      severitySignal = "medium";
    }
  }

  const summaryText =
    countToday > 0
      ? `Triage processed ${countToday} citizen report(s). Spatial analysis identified ${clusterCount} cluster hotspot(s). Max severity signal: ${severitySignal.toUpperCase()}.`
      : `No citizen complaints received in the last 24 hours.`;

  const triageResult: TriageOutput = {
    zone,
    complaint_count: countToday,
    trend_vs_yesterday: trendVsYesterday,
    severity_signal: severitySignal,
    hotspot_detected: hotspotDetected,
    summary: summaryText,
  };

  // 6. Log timeline entry
  await insertTimelineEntry({
    id: crypto.randomUUID(),
    agent_name: "triage",
    zone,
    timestamp: nowStr,
    action: `Triaged ${countToday} citizen reports: ${severitySignal.toUpperCase()} signal, hotspot: ${hotspotDetected}`,
    input_ref: null,
    output_json: { ...triageResult, computed_on_gpu: computedOnGpu } as any,
    conflict_flag: false,
    escalation_flag: false,
    confidence: 1.0,
  });

  // 7. Check escalation threshold (spike >= 5 reports)
  const escalated = await checkEscalationThreshold(zone, countToday);
  if (escalated) {
    await insertTimelineEntry({
      id: crypto.randomUUID(),
      agent_name: "triage",
      zone,
      timestamp: nowStr,
      action: `Escalating critical complaint spike: ${countToday} reports in 24h.`,
      input_ref: null,
      output_json: { triageResult },
      conflict_flag: false,
      escalation_flag: true,
      confidence: 1.0,
    });
  }

  return triageResult;
}

/**
 * Check if complaint volume exceeds threshold for immediate escalation.
 */
export async function checkEscalationThreshold(
  _zone: string,
  complaintCount: number,
): Promise<boolean> {
  // Escalate if we have 5 or more complaints today
  return complaintCount >= 5;
}
