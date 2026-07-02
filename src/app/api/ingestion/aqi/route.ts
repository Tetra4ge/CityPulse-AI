import { NextRequest, NextResponse } from "next/server";
import type { IngestionOutput } from "@/lib/types/agent-schemas";

const MOCK_AQI_DATA: IngestionOutput[] = [
  {
    source: "aqi",
    zone: "Zone-A",
    timestamp: new Date().toISOString(),
    payload: { aqi_value: 142, pollutant_primary: "PM2.5" },
    status: "ok",
    confidence_penalty: 0.0,
    _mock: true,
  },
  {
    source: "aqi",
    zone: "Zone-B",
    timestamp: new Date().toISOString(),
    payload: { aqi_value: 89, pollutant_primary: "PM10" },
    status: "ok",
    confidence_penalty: 0.0,
    _mock: true,
  },
  {
    source: "aqi",
    zone: "Zone-C",
    timestamp: new Date().toISOString(),
    payload: { aqi_value: 201, pollutant_primary: "PM2.5" },
    status: "ok",
    confidence_penalty: 0.0,
    _mock: true,
  },
  {
    source: "aqi",
    zone: "Zone-D",
    timestamp: new Date().toISOString(),
    payload: { aqi_value: 56, pollutant_primary: "O3" },
    status: "ok",
    confidence_penalty: 0.0,
    _mock: true,
  },
];

export async function GET(request: NextRequest) {
  const zone = request.nextUrl.searchParams.get("zone");
  const data = zone
    ? MOCK_AQI_DATA.filter((d) => d.zone === zone)
    : MOCK_AQI_DATA;

  return NextResponse.json(data);
}
