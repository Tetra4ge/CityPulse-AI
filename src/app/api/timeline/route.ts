import { NextRequest, NextResponse } from "next/server";
import type { TimelineEntry } from "@/lib/types/agent-schemas";

const now = Date.now();

const MOCK_TIMELINE: TimelineEntry[] = [
  {
    id: "tl-001",
    agent_name: "ingestion",
    zone: "Zone-A",
    timestamp: new Date(now - 300000).toISOString(),
    action: "Pulled AQI data from OpenAQ — AQI 142, status: ok",
    input_ref: null,
    output_json: { source: "aqi", aqi_value: 142, status: "ok" },
    conflict_flag: false,
    escalation_flag: false,
    confidence: null,
    _mock: true,
  },
  {
    id: "tl-002",
    agent_name: "ingestion",
    zone: "Zone-A",
    timestamp: new Date(now - 295000).toISOString(),
    action: "Pulled weather data — 38.2°C, humidity 45%, wind 12.5 kph",
    input_ref: null,
    output_json: { source: "weather", temperature_c: 38.2, humidity_pct: 45, wind_kph: 12.5 },
    conflict_flag: false,
    escalation_flag: false,
    confidence: null,
    _mock: true,
  },
  {
    id: "tl-003",
    agent_name: "ingestion",
    zone: "Zone-A",
    timestamp: new Date(now - 290000).toISOString(),
    action: "Ingested 47 citizen reports for Zone-A",
    input_ref: null,
    output_json: { source: "citizen_reports", count: 47 },
    conflict_flag: false,
    escalation_flag: false,
    confidence: null,
    _mock: true,
  },
  {
    id: "tl-004",
    agent_name: "forecast",
    zone: "Zone-A",
    timestamp: new Date(now - 240000).toISOString(),
    action: "Generated 24h forecast — predicted AQI 158, confidence 0.78",
    input_ref: "tl-001",
    output_json: { predicted_aqi: 158, confidence: 0.78 },
    conflict_flag: false,
    escalation_flag: false,
    confidence: 0.78,
    _mock: true,
  },
  {
    id: "tl-005",
    agent_name: "triage",
    zone: "Zone-A",
    timestamp: new Date(now - 235000).toISOString(),
    action: "Clustered citizen complaints — 3 hotspots detected, severity: high",
    input_ref: "tl-003",
    output_json: { complaint_count: 47, hotspot_detected: true, severity_signal: "high" },
    conflict_flag: false,
    escalation_flag: false,
    confidence: null,
    _mock: true,
  },
  {
    id: "tl-006",
    agent_name: "decision",
    zone: "Zone-A",
    timestamp: new Date(now - 180000).toISOString(),
    action: "Synthesized recommendation — risk: high, no conflict detected",
    input_ref: "tl-004,tl-005",
    output_json: { risk_level: "high", overall_confidence: 0.76, conflict_detected: false },
    conflict_flag: false,
    escalation_flag: false,
    confidence: 0.76,
    _mock: true,
  },
  {
    id: "tl-007",
    agent_name: "reflection",
    zone: "Zone-A",
    timestamp: new Date(now - 170000).toISOString(),
    action: "Quality check passed — recommending human review for high-risk decision",
    input_ref: "tl-006",
    output_json: { validated: true, requires_human_review: true, flags: [] },
    conflict_flag: false,
    escalation_flag: false,
    confidence: null,
    _mock: true,
  },
  {
    id: "tl-008",
    agent_name: "human",
    zone: "Zone-A",
    timestamp: new Date(now - 120000).toISOString(),
    action: "Recommendation approved by District Health Officer",
    input_ref: "tl-006",
    output_json: { approved: true, reviewer_id: "officer-dho-01" },
    conflict_flag: false,
    escalation_flag: false,
    confidence: null,
    _mock: true,
  },
  {
    id: "tl-009",
    agent_name: "notification",
    zone: "Zone-A",
    timestamp: new Date(now - 60000).toISOString(),
    action: "Dispatched advisories to 3 targets: schools, hospital, transit (simulated)",
    input_ref: "tl-008",
    output_json: { targets_notified: 3, dispatch_status: "simulated" },
    conflict_flag: false,
    escalation_flag: false,
    confidence: null,
    _mock: true,
  },
];

export async function GET(request: NextRequest) {
  const zone = request.nextUrl.searchParams.get("zone");
  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10);

  let data = zone
    ? MOCK_TIMELINE.filter((d) => d.zone === zone)
    : MOCK_TIMELINE;

  // Newest first
  data = [...data].reverse().slice(0, limit);

  return NextResponse.json(data);
}
