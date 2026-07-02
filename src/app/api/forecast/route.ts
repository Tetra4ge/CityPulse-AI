import { NextRequest, NextResponse } from "next/server";
import type { ForecastOutput, ForecastRequest } from "@/lib/types/agent-schemas";

const MOCK_FORECASTS: ForecastOutput[] = [
  {
    zone: "Zone-A",
    predicted_aqi: 158,
    horizon_hours: 24,
    confidence: 0.78,
    reasoning:
      "AQI trending upward over the past 3 days with sustained PM2.5 levels. Low wind speed forecast suggests pollutant dispersion will remain poor. Industrial activity patterns consistent with prior high-AQI episodes.",
    _mock: true,
  },
  {
    zone: "Zone-B",
    predicted_aqi: 82,
    horizon_hours: 24,
    confidence: 0.85,
    reasoning:
      "AQI stable in the moderate range. Wind speeds adequate for partial dispersion. No significant emission source changes detected in this zone.",
    _mock: true,
  },
  {
    zone: "Zone-C",
    predicted_aqi: 215,
    horizon_hours: 24,
    confidence: 0.72,
    reasoning:
      "AQI already in the Very Unhealthy range with upward momentum. Highway traffic volumes remain elevated, and temperature inversion conditions are forecast to persist for the next 18 hours.",
    _mock: true,
  },
  {
    zone: "Zone-D",
    predicted_aqi: 48,
    horizon_hours: 24,
    confidence: 0.91,
    reasoning:
      "AQI consistently in the Good range. Strong winds and favorable dispersion conditions expected to continue.",
    _mock: true,
  },
];

export async function GET(request: NextRequest) {
  const zone = request.nextUrl.searchParams.get("zone");
  const data = zone
    ? MOCK_FORECASTS.filter((d) => d.zone === zone)
    : MOCK_FORECASTS;

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ForecastRequest;

  const baseForecast = MOCK_FORECASTS.find((f) => f.zone === body.zone) ?? MOCK_FORECASTS[0];
  const multiplier = body.traffic_multiplier ?? 1.0;

  const result: ForecastOutput = {
    ...baseForecast,
    zone: body.zone,
    predicted_aqi: Math.round(baseForecast.predicted_aqi * multiplier),
    confidence: Math.max(0.5, baseForecast.confidence - (Math.abs(multiplier - 1) * 0.1)),
    reasoning: `[What-if simulation: traffic_multiplier=${multiplier}] ${baseForecast.reasoning}`,
    _mock: true,
  };

  return NextResponse.json(result);
}
