import { NextRequest, NextResponse } from "next/server";
import type {
  NotificationEntry,
  NotificationDispatchRequest,
} from "@/lib/types/agent-schemas";

const MOCK_NOTIFICATION_LOG: NotificationEntry[] = [
  {
    id: "notif-001",
    decision_id: "decision-zone-a",
    zone: "Zone-A",
    timestamp: new Date().toISOString(),
    target_audience: "schools",
    message: "Zone-A Air Quality Advisory: Postpone outdoor sports and recess activities until further notice. Current AQI forecast: 158 (Unhealthy).",
    approved_by: "officer-dho-01",
    dispatch_status: "simulated",
    _mock: true,
  },
  {
    id: "notif-002",
    decision_id: "decision-zone-a",
    zone: "Zone-A",
    timestamp: new Date().toISOString(),
    target_audience: "hospital",
    message: "Zone-A Health Alert: Prepare for approximately 15% increase in respiratory admissions over the next 12 hours. AQI forecast: 158.",
    approved_by: "officer-dho-01",
    dispatch_status: "simulated",
    _mock: true,
  },
  {
    id: "notif-003",
    decision_id: "decision-zone-a",
    zone: "Zone-A",
    timestamp: new Date().toISOString(),
    target_audience: "transit",
    message: "Zone-A Transit Advisory: Display air quality warnings at all outdoor stops and stations.",
    approved_by: "officer-dho-01",
    dispatch_status: "simulated",
    _mock: true,
  },
];

export async function GET(request: NextRequest) {
  const zone = request.nextUrl.searchParams.get("zone");
  const data = zone
    ? MOCK_NOTIFICATION_LOG.filter((d) => d.zone === zone)
    : MOCK_NOTIFICATION_LOG;

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as NotificationDispatchRequest;

  const dispatched: NotificationEntry[] = [
    {
      id: `notif-${Date.now()}-schools`,
      decision_id: body.decision_id,
      zone: "Zone-A",
      timestamp: new Date().toISOString(),
      target_audience: "schools",
      message: "Air quality advisory dispatched to school administrators.",
      approved_by: "officer-dho-01",
      dispatch_status: "simulated",
      _mock: true,
    },
    {
      id: `notif-${Date.now()}-hospital`,
      decision_id: body.decision_id,
      zone: "Zone-A",
      timestamp: new Date().toISOString(),
      target_audience: "hospital",
      message: "Health alert dispatched to hospital respiratory ward.",
      approved_by: "officer-dho-01",
      dispatch_status: "simulated",
      _mock: true,
    },
    {
      id: `notif-${Date.now()}-transit`,
      decision_id: body.decision_id,
      zone: "Zone-A",
      timestamp: new Date().toISOString(),
      target_audience: "transit",
      message: "Transit advisory dispatched to transit authority.",
      approved_by: "officer-dho-01",
      dispatch_status: "simulated",
      _mock: true,
    },
    {
      id: `notif-${Date.now()}-citizens`,
      decision_id: body.decision_id,
      zone: "Zone-A",
      timestamp: new Date().toISOString(),
      target_audience: "citizens",
      message: "Public air quality warning dispatched.",
      approved_by: "officer-dho-01",
      dispatch_status: "simulated",
      _mock: true,
    },
  ];

  return NextResponse.json(dispatched, { status: 201 });
}
