import { generateContent, isLLMAvailable } from "../ai-client";
import { ForecastOutput, ResourceOutput } from "../types/agent-schemas";
import { db } from "../db";
import { hospitalStatus, transitStatus } from "../db/schema";
import { eq } from "drizzle-orm";

export async function resource(forecastResult: ForecastOutput, zone: string): Promise<ResourceOutput> {
  console.log(`[Resource Agent] Starting resource analysis for zone: ${zone}`);

  // 1. Fetch live resource data from the database
  const hospitals = await db.select().from(hospitalStatus).where(eq(hospitalStatus.zone, zone));
  const transits = await db.select().from(transitStatus).where(eq(transitStatus.zone, zone));

  const hospitalData = hospitals.length > 0 ? hospitals[0] : null;
  const transitData = transits.length > 0 ? transits[0] : null;

  const dataStale = !hospitalData || !transitData;

  const contextData = {
    zone,
    forecast: forecastResult,
    resources: {
      hospital: hospitalData ? {
        total_beds: hospitalData.totalBeds,
        available_beds: hospitalData.availableBeds,
        occupancy_percent: ((hospitalData.totalBeds - hospitalData.availableBeds) / hospitalData.totalBeds) * 100
      } : "Unknown",
      transit: transitData ? {
        available_units: transitData.availableUnits,
        status: transitData.status
      } : "Unknown"
    }
  };

  if (!isLLMAvailable()) {
    throw new Error("No LLM API key configured");
  }

  const prompt = `
    System Role: You are the CityPulse Logistics & Resource Coordinator.
    Objective: Evaluate if the city can handle a projected emergency event.
    Constraints: 
    - You must rely strictly on the numerical data provided. Do not invent resources. 
    - If hospital beds < 10% of total capacity, you MUST flag a critical bottleneck.
    - NEVER invent resource capacities. If a value is missing, assume 0. 
    - Return a JSON object with resource_risk_score (number 0.0-1.0), bottlenecks (array of strings), and analysis (string).

    Few-Shot Example:
    Input: Hospital occupancy 95%, AQI Forecast 450 (Hazardous).
    Output: {
      "resource_risk_score": 0.9,
      "bottlenecks": ["hospital_beds_zone_a"],
      "analysis": "Hospitals are at 95% capacity. Cannot support a mass casualty event caused by Hazardous AQI."
    }

    Analyze the following resource data and forecast:
    ${JSON.stringify(contextData, null, 2)}
  `;

  try {
    const result = await generateContent(prompt, { jsonMode: true, temperature: 0.1 });
    const object = JSON.parse(result.text);
    return {
      ...object,
      data_stale: dataStale
    };
  } catch (err) {
    console.error("LLM failed to generate resource output:", err);
    // Fallback if API fails (rate limits)
    return {
      resource_risk_score: 0.8,
      bottlenecks: [`hospital_beds_${zone.toLowerCase()}`],
      analysis: "[Fallback Analysis] LLM API quota exceeded. Assuming critical resource bottleneck for safety.",
      data_stale: dataStale,
      _mock: true
    };
  }
}
