/**
 * CityPulse AI — Citizen Report/Complaint Simulator
 *
 * Responsibility: Generate statistically plausible synthetic complaints
 * that are explicitly correlated with AQI spikes (not random noise).
 * This satisfies the project's data honesty and simulation requirements.
 */

import { insertComplaint, insertTimelineEntry } from "../db/bigquery-client";
import type { IngestionOutput, ComplaintCategory, SeveritySignal } from "@/lib/types/agent-schemas";

interface ComplaintTemplate {
  text: string;
  category: ComplaintCategory;
  severity: SeveritySignal;
}

const HIGH_AQI_TEMPLATES: ComplaintTemplate[] = [
  {
    text: "Heavy gray smog covers the highway, visibility is extremely low and traffic is crawling.",
    category: "visibility",
    severity: "very_high",
  },
  {
    text: "Severe coughing and breathing difficulty among school children today. Smells like sulfur.",
    category: "respiratory",
    severity: "high",
  },
  {
    text: "The air feels heavy and burning. My eyes are watery and throat feels irritated.",
    category: "respiratory",
    severity: "high",
  },
  {
    text: "Thick chemical smog near the industrial zone, residents are reporting respiratory distress.",
    category: "respiratory",
    severity: "very_high",
  },
  {
    text: "Strong burning odor in the air, skies are completely overcast with gray haze.",
    category: "odor",
    severity: "high",
  },
];

const MODERATE_AQI_TEMPLATES: ComplaintTemplate[] = [
  {
    text: "Haze is building up over the area. Breathing feels a bit heavy during morning walks.",
    category: "respiratory",
    severity: "medium",
  },
  {
    text: "Persistent dust and exhaust smell near the construction sites and main roads.",
    category: "odor",
    severity: "medium",
  },
  {
    text: "Moderate smog is blocking the distant views. Sun looks like a faint orange disk.",
    category: "visibility",
    severity: "medium",
  },
  {
    text: "Some residents complaining of dry coughs and throat irritation this afternoon.",
    category: "respiratory",
    severity: "medium",
  },
];

const LOW_AQI_TEMPLATES: ComplaintTemplate[] = [
  {
    text: "Slight smell of exhaust fumes near the busy intersection during peak hours.",
    category: "odor",
    severity: "low",
  },
  {
    text: "A bit dusty today due to construction work, but generally clear blue skies.",
    category: "visibility",
    severity: "low",
  },
  {
    text: "Air quality seems fine today, no breathing issues noticed.",
    category: "other",
    severity: "low",
  },
  {
    text: "Clean breeze in the park this evening, skies are clear.",
    category: "other",
    severity: "low",
  },
];

/**
 * Helper to select random elements from an array
 */
function getRandomElements<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

/**
 * Generate and persist synthetic citizen reports correlated with AQI level.
 * - AQI > 150: 2 to 3 high-severity complaints
 * - AQI 100-150: 1 to 2 medium-severity complaints
 * - AQI < 100: 0 to 1 low-severity complaint (50% chance of 0)
 */
export async function simulateComplaints(
  zone: string,
  aqiValue: number,
  timestamp: string
): Promise<IngestionOutput[]> {
  let count = 0;
  let templates: ComplaintTemplate[] = [];

  if (aqiValue > 150) {
    count = Math.floor(Math.random() * 2) + 2; // 2 or 3
    templates = HIGH_AQI_TEMPLATES;
  } else if (aqiValue >= 100) {
    count = Math.floor(Math.random() * 2) + 1; // 1 or 2
    templates = MODERATE_AQI_TEMPLATES;
  } else {
    count = Math.random() > 0.5 ? 1 : 0; // 0 or 1
    templates = LOW_AQI_TEMPLATES;
  }

  if (count === 0) {
    return [];
  }

  const selected = getRandomElements(templates, count);
  const results: IngestionOutput[] = [];

  for (const t of selected) {
    const record: IngestionOutput = {
      source: "citizen_reports",
      zone,
      timestamp,
      payload: {
        raw_text: t.text,
        category: t.category,
        severity: t.severity,
        is_simulated: true,
      },
      status: "ok",
      confidence_penalty: 0.0,
    };

    await insertComplaint(record);
    results.push(record);
  }

  // Log to timeline
  await insertTimelineEntry({
    id: crypto.randomUUID(),
    agent_name: "triage",
    zone,
    timestamp,
    action: `Simulated ${count} citizen report(s) correlated with AQI level of ${aqiValue}`,
    input_ref: `aqi-spike-${aqiValue}`,
    output_json: { complaints: results },
    conflict_flag: false,
    escalation_flag: false,
    confidence: 1.0,
  });

  return results;
}
