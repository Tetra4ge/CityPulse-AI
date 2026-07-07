import { NextRequest, NextResponse } from "next/server";
import { decide } from "@/lib/agents/decision-agent";
import { resource } from "@/lib/agents/resource-agent";
import { sqlite } from "@/lib/db";
import type { WhatIfRequest, WhatIfResult, ForecastOutput, TriageOutput } from "@/lib/types/agent-schemas";
import { insertForecast } from "@/lib/db/bigquery-client"; // To save the what-if forecast

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    const body = (await request.json()) as WhatIfRequest;
    const { zone, traffic_multiplier } = body;

    if (!zone || typeof traffic_multiplier !== 'number') {
      return NextResponse.json({ error: "Missing zone or traffic_multiplier" }, { status: 400 });
    }

    // 1. Fetch latest triage data for the zone from the agent log
    const triageRecord = sqlite.prepare("SELECT output_json FROM agent_decisions_log WHERE zone = ? AND agent_name = 'triage' ORDER BY timestamp DESC LIMIT 1").get(zone) as any;
    let triageOutput: TriageOutput = { zone, complaint_count: 0, trend_vs_yesterday: "flat", severity_signal: "low", hotspot_detected: false, summary: "No data" };
    if (triageRecord && triageRecord.output_json) {
        triageOutput = JSON.parse(triageRecord.output_json);
    }

    // 2. Fetch latest actual forecast data to use as a baseline
    const forecastRecord = sqlite.prepare("SELECT output_json FROM agent_decisions_log WHERE zone = ? AND agent_name = 'forecast' ORDER BY timestamp DESC LIMIT 1").get(zone) as any;
    let baseAqi = 100;
    let baseConfidence = 0.8;
    if (forecastRecord && forecastRecord.output_json) {
        const parsed = JSON.parse(forecastRecord.output_json);
        baseAqi = parsed.predicted_aqi || 100;
        baseConfidence = parsed.confidence || 0.8;
    }

    // 3. Simulate Forecast Agent with the WhatIf overrides
    // Instead of calling the full Python backend, we simulate the 'what-if' math rapidly here to meet the <2000ms latency target natively.
    // Real implementation would pass `traffic_multiplier` to `POST /api/forecast`.
    const adjustedAqi = Math.round(baseAqi * traffic_multiplier);
    const simulatedForecast: ForecastOutput = {
      zone,
      predicted_aqi: adjustedAqi,
      horizon_hours: 24,
      confidence: Math.max(0.5, baseConfidence - (Math.abs(traffic_multiplier - 1) * 0.15)),
      reasoning: `[What-if simulation] With traffic multiplier ${traffic_multiplier}x applied, adjusted AQI forecast from ${baseAqi} to ${adjustedAqi}.`,
    };

    // Save the hypothetical forecast (audit requirement)
    await insertForecast(simulatedForecast, true, { traffic_multiplier });

    // 4. Run the Decision Agent
    // We strictly use the REAL decide() logic here to ensure true multi-agent accuracy!
    const resourceOutput = await resource(simulatedForecast, zone);
    const decision = await decide(simulatedForecast, triageOutput, resourceOutput, zone);
    
    // CRITICAL: We DO NOT save this decision into the `decisions` table. 
    // It remains hypothetical.

    const computeTimeMs = Date.now() - startTime;

    const result: WhatIfResult = {
      forecast: simulatedForecast,
      decision,
      compute_time_ms: computeTimeMs,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("WhatIf API failed:", error);
    return NextResponse.json(
      { error: "Failed to run simulation", details: error.message },
      { status: 500 }
    );
  }
}
