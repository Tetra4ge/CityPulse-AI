import { NextRequest, NextResponse } from "next/server";
import type { IngestionOutput } from "@/lib/types/agent-schemas";

const MOCK_WEATHER_DATA: IngestionOutput[] = [
  {
    source: "weather",
    zone: "Zone-A",
    timestamp: new Date().toISOString(),
    payload: { temperature_c: 38.2, humidity_pct: 45, wind_kph: 12.5 },
    status: "ok",
    confidence_penalty: 0.0,
    _mock: true,
  },
  {
    source: "weather",
    zone: "Zone-B",
    timestamp: new Date().toISOString(),
    payload: { temperature_c: 36.8, humidity_pct: 52, wind_kph: 8.3 },
    status: "ok",
    confidence_penalty: 0.0,
    _mock: true,
  },
  {
    source: "weather",
    zone: "Zone-C",
    timestamp: new Date().toISOString(),
    payload: { temperature_c: 39.1, humidity_pct: 40, wind_kph: 5.1 },
    status: "ok",
    confidence_penalty: 0.0,
    _mock: true,
  },
  {
    source: "weather",
    zone: "Zone-D",
    timestamp: new Date().toISOString(),
    payload: { temperature_c: 35.5, humidity_pct: 58, wind_kph: 15.7 },
    status: "ok",
    confidence_penalty: 0.0,
    _mock: true,
  },
];

export async function GET(request: NextRequest) {
  const zone = request.nextUrl.searchParams.get("zone");
  const data = zone
    ? MOCK_WEATHER_DATA.filter((d) => d.zone === zone)
    : MOCK_WEATHER_DATA;

  return NextResponse.json(data);
}
