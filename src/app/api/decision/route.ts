import { NextRequest, NextResponse } from "next/server";
import { decide } from "@/lib/agents/decision-agent";
import { forecast } from "@/lib/agents/forecast-agent";
import { triage } from "@/lib/agents/triage-agent";
import { resource } from "@/lib/agents/resource-agent";
import { insertDecision } from "@/lib/db/bigquery-client";

export async function GET(request: NextRequest) {
  const zone = request.nextUrl.searchParams.get("zone");
  
  if (!zone) {
    return NextResponse.json({ error: "Zone parameter is required" }, { status: 400 });
  }

  try {
    // 1. Fetch latest forecast
    const forecastOutput = await forecast(zone);
    
    // 2. Fetch latest triage
    const triageOutput = await triage(zone);
    
    // 2.5 Fetch resources
    const resourceOutput = await resource(forecastOutput, zone);
    
    // 3. Synthesize decision
    const decision = await decide(forecastOutput, triageOutput, resourceOutput, zone, false);
    
    // 4. Save decision to bigquery/sqlite
    // The `decisions` table requires a generated_at timestamp
    const decisionId = await insertDecision({
      ...decision,
    });
    
    return NextResponse.json([{ ...decision, id: decisionId }]);
  } catch (error: any) {
    console.error("Decision API failed:", error);
    return NextResponse.json(
      { error: "Failed to generate decision", details: error.message },
      { status: 500 }
    );
  }
}
