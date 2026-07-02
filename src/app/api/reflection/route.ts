import { NextRequest, NextResponse } from "next/server";
import type { ReflectionOutput } from "@/lib/types/agent-schemas";

const MOCK_REFLECTIONS: Record<string, ReflectionOutput> = {
  "decision-zone-a": {
    validated: true,
    requires_human_review: true,
    flags: [],
    notes: "Decision is well-supported by aligned forecast and triage signals. Confidence above minimum threshold. Recommending human review as standard protocol for High-risk classification.",
    _mock: true,
  },
  "decision-zone-b": {
    validated: true,
    requires_human_review: false,
    flags: [],
    notes: "Low-risk decision with high confidence and no conflicts. Routine — no flags raised.",
    _mock: true,
  },
  "decision-zone-c": {
    validated: true,
    requires_human_review: true,
    flags: ["conflict_resolved_with_supplementary_data", "high_complaint_volume"],
    notes: "Conflict between forecast and triage was resolved via supplementary sensor data from Zone-B, which confirmed the localized pollution plume. Human review is strongly recommended due to the severity of the recommendation and the conflict resolution path taken.",
    _mock: true,
  },
  "decision-zone-d": {
    validated: true,
    requires_human_review: false,
    flags: [],
    notes: "Low-risk decision with highest confidence score. All signals aligned. No review required.",
    _mock: true,
  },
};

export async function GET(request: NextRequest) {
  const decisionId = request.nextUrl.searchParams.get("decision_id");

  if (decisionId && MOCK_REFLECTIONS[decisionId]) {
    return NextResponse.json(MOCK_REFLECTIONS[decisionId]);
  }

  // Return all reflections if no specific decision_id
  return NextResponse.json(Object.values(MOCK_REFLECTIONS));
}
