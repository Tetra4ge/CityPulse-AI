import { NextRequest, NextResponse } from "next/server";
import type { WhatIfRequest, WhatIfResult } from "@/lib/types/agent-schemas";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as WhatIfRequest;

  const multiplier = body.traffic_multiplier;
  const baseAqi = 142; // Zone-A baseline
  const adjustedAqi = Math.round(baseAqi * multiplier);

  const riskLevel =
    adjustedAqi > 200 ? "severe" as const :
    adjustedAqi > 150 ? "high" as const :
    adjustedAqi > 100 ? "medium" as const :
    "low" as const;

  const result: WhatIfResult = {
    forecast: {
      zone: body.zone,
      predicted_aqi: adjustedAqi,
      horizon_hours: 24,
      confidence: Math.max(0.5, 0.78 - (Math.abs(multiplier - 1) * 0.15)),
      reasoning: `[What-if simulation] With traffic multiplier ${multiplier}x applied, adjusted AQI forecast from ${baseAqi} to ${adjustedAqi}. ${multiplier > 1 ? "Increased traffic emissions are expected to worsen air quality." : "Reduced traffic would improve dispersion conditions."}`,
      _mock: true,
    },
    decision: {
      zone: body.zone,
      risk_level: riskLevel,
      overall_confidence: Math.max(0.5, 0.76 - (Math.abs(multiplier - 1) * 0.12)),
      conflict_detected: false,
      recommendations: [
        { target: "schools", action: riskLevel === "severe" || riskLevel === "high" ? "Postpone outdoor activities" : "Normal activities may proceed" },
        { target: "hospital", action: riskLevel === "severe" ? "Activate surge protocol" : riskLevel === "high" ? "Monitor respiratory admissions" : "No action needed" },
        { target: "transit", action: riskLevel === "severe" || riskLevel === "high" ? "Issue air quality advisory" : "No advisory needed" },
        { target: "citizens", action: riskLevel === "severe" ? "Stay indoors" : riskLevel === "high" ? "Limit outdoor exposure" : "Normal outdoor activity" },
      ],
      rationale: `[What-if simulation] Under ${multiplier}x traffic scenario, risk level adjusts to ${riskLevel} with AQI ${adjustedAqi}.`,
      _mock: true,
    },
    compute_time_ms: 847,
    _mock: true,
  };

  return NextResponse.json(result);
}
