import { NextRequest, NextResponse } from "next/server";
import type { TriageOutput } from "@/lib/types/agent-schemas";

const MOCK_TRIAGE_DATA: TriageOutput[] = [
  {
    zone: "Zone-A",
    complaint_count: 47,
    trend_vs_yesterday: "up",
    severity_signal: "high",
    hotspot_detected: true,
    summary:
      "Significant increase in respiratory complaints clustered near the industrial corridor. DBSCAN clustering identified 3 spatial hotspots with high temporal correlation to PM2.5 spikes.",
    _mock: true,
  },
  {
    zone: "Zone-B",
    complaint_count: 12,
    trend_vs_yesterday: "flat",
    severity_signal: "low",
    hotspot_detected: false,
    summary:
      "Complaint volume within normal range. No spatial clustering detected. Reports are dispersed geographically and temporally.",
    _mock: true,
  },
  {
    zone: "Zone-C",
    complaint_count: 83,
    trend_vs_yesterday: "up",
    severity_signal: "very_high",
    hotspot_detected: true,
    summary:
      "Major complaint spike with 83 reports in the last 6 hours, primarily visibility and respiratory categories. Two dense clusters detected near the highway interchange and the residential district downwind of it.",
    _mock: true,
  },
  {
    zone: "Zone-D",
    complaint_count: 5,
    trend_vs_yesterday: "down",
    severity_signal: "low",
    hotspot_detected: false,
    summary:
      "Minimal complaint activity, down from yesterday. No actionable clusters or severity signals.",
    _mock: true,
  },
];

export async function GET(request: NextRequest) {
  const zone = request.nextUrl.searchParams.get("zone");
  const data = zone
    ? MOCK_TRIAGE_DATA.filter((d) => d.zone === zone)
    : MOCK_TRIAGE_DATA;

  return NextResponse.json(data);
}
