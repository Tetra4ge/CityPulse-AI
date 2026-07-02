import { NextRequest, NextResponse } from "next/server";
import type { IngestionOutput, CitizenReportRequest } from "@/lib/types/agent-schemas";

const MOCK_CITIZEN_REPORTS: IngestionOutput[] = [
  {
    source: "citizen_reports",
    zone: "Zone-A",
    timestamp: new Date().toISOString(),
    payload: {
      raw_text: "Heavy smog near the industrial area, difficulty breathing while walking outside",
      category: "respiratory",
      severity: "high",
      is_simulated: true,
    },
    status: "ok",
    confidence_penalty: 0.0,
    _mock: true,
  },
  {
    source: "citizen_reports",
    zone: "Zone-C",
    timestamp: new Date().toISOString(),
    payload: {
      raw_text: "Visibility dropped significantly near the highway, can barely see 100m ahead",
      category: "visibility",
      severity: "very_high",
      is_simulated: true,
    },
    status: "ok",
    confidence_penalty: 0.0,
    _mock: true,
  },
  {
    source: "citizen_reports",
    zone: "Zone-B",
    timestamp: new Date().toISOString(),
    payload: {
      raw_text: "Mild haze in the morning, cleared up by afternoon",
      category: "visibility",
      severity: "low",
      is_simulated: true,
    },
    status: "ok",
    confidence_penalty: 0.0,
    _mock: true,
  },
];

export async function GET(request: NextRequest) {
  const zone = request.nextUrl.searchParams.get("zone");
  const data = zone
    ? MOCK_CITIZEN_REPORTS.filter((d) => d.zone === zone)
    : MOCK_CITIZEN_REPORTS;

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CitizenReportRequest;

  const created: IngestionOutput = {
    source: "citizen_reports",
    zone: body.zone,
    timestamp: body.timestamp || new Date().toISOString(),
    payload: {
      raw_text: body.text,
      category: "other",
      severity: "medium",
      is_simulated: true,
    },
    status: "ok",
    confidence_penalty: 0.0,
    _mock: true,
  };

  return NextResponse.json(created, { status: 201 });
}
