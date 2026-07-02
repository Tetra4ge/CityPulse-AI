import { NextRequest, NextResponse } from "next/server";
import type {
  ApprovalPendingItem,
  ApprovalRequest,
  ApprovalResponse,
} from "@/lib/types/agent-schemas";

const MOCK_PENDING: ApprovalPendingItem[] = [
  {
    decision: {
      id: "decision-zone-a",
      generated_at: new Date().toISOString(),
      zone: "Zone-A",
      risk_level: "high",
      overall_confidence: 0.76,
      conflict_detected: false,
      recommendations: [
        { target: "schools", action: "Postpone outdoor sports and recess activities" },
        { target: "hospital", action: "Prepare for ~15% increase in respiratory admissions" },
        { target: "transit", action: "Issue air quality warning on displays" },
        { target: "citizens", action: "Avoid prolonged outdoor exposure" },
      ],
      rationale:
        "Forecast AQI 158 with upward trend, corroborated by 47 citizen complaints near industrial corridor.",
    },
    reflection: {
      validated: true,
      requires_human_review: true,
      flags: [],
      notes: "High-risk classification — standard human review required.",
    },
    _mock: true,
  },
  {
    decision: {
      id: "decision-zone-c",
      generated_at: new Date().toISOString(),
      zone: "Zone-C",
      risk_level: "severe",
      overall_confidence: 0.68,
      conflict_detected: true,
      recommendations: [
        { target: "schools", action: "Cancel all outdoor activities" },
        { target: "hospital", action: "Activate surge protocol; +28% respiratory admissions expected" },
        { target: "transit", action: "Issue immediate air quality emergency warning" },
        { target: "citizens", action: "Stay indoors with windows closed" },
      ],
      rationale:
        "CONFLICT RESOLVED: Forecast vs. citizen reports divergence confirmed by supplementary sensor data.",
    },
    reflection: {
      validated: true,
      requires_human_review: true,
      flags: ["conflict_resolved_with_supplementary_data", "high_complaint_volume"],
      notes: "Conflict was resolved but human review strongly recommended due to severity.",
    },
    _mock: true,
  },
];

export async function GET() {
  return NextResponse.json(MOCK_PENDING);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ApprovalRequest;

  const response: ApprovalResponse = {
    decision_id: body.decision_id,
    approval_status: body.approved ? "approved" : "rejected",
    reviewer_id: body.reviewer_id,
    reviewed_at: new Date().toISOString(),
    notes: body.notes,
    _mock: true,
  };

  return NextResponse.json(response);
}
