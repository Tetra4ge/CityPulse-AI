import { NextRequest, NextResponse } from "next/server";
import type { DecisionOutput } from "@/lib/types/agent-schemas";

const MOCK_DECISIONS: DecisionOutput[] = [
  {
    zone: "Zone-A",
    risk_level: "high",
    overall_confidence: 0.76,
    conflict_detected: false,
    recommendations: [
      { target: "schools", action: "Postpone outdoor sports and recess activities until further notice" },
      { target: "hospital", action: "Prepare for approximately 15% increase in respiratory admissions" },
      { target: "transit", action: "Issue air quality warning on transit information displays" },
      { target: "citizens", action: "Avoid prolonged outdoor exposure, especially for children and elderly" },
    ],
    rationale:
      "Forecast AQI of 158 (Unhealthy) with upward trend, corroborated by 47 citizen complaints showing respiratory symptom clustering near industrial corridor. Signals are aligned — no conflict detected. Confidence score reflects reliable data sources.",
    _mock: true,
  },
  {
    zone: "Zone-B",
    risk_level: "low",
    overall_confidence: 0.88,
    conflict_detected: false,
    recommendations: [
      { target: "schools", action: "Normal outdoor activities may proceed" },
      { target: "hospital", action: "No additional staffing required" },
      { target: "transit", action: "No advisory needed" },
      { target: "citizens", action: "Air quality is acceptable for outdoor activities" },
    ],
    rationale:
      "Forecast AQI of 82 (Moderate) with stable trend, minimal citizen complaints. No conflict between predictive and ground-truth signals.",
    _mock: true,
  },
  {
    zone: "Zone-C",
    risk_level: "severe",
    overall_confidence: 0.68,
    conflict_detected: true,
    recommendations: [
      { target: "schools", action: "Cancel all outdoor activities; consider early dismissal if AQI exceeds 250" },
      { target: "hospital", action: "Activate surge protocol; expected +28% respiratory admissions within 12 hours" },
      { target: "transit", action: "Issue immediate air quality emergency warning; consider route advisories for open-air stops" },
      { target: "citizens", action: "Stay indoors with windows closed. Use air purifiers if available. Seek medical attention for breathing difficulty." },
    ],
    rationale:
      "CONFLICT DETECTED: Forecast predicted AQI 215 (Very Unhealthy) but citizen complaint severity signal is Very High with 83 reports — divergence exceeds one risk tier. Supplementary data from adjacent Zone-B sensor confirms localized pollution plume affecting Zone-C. Decision elevated to Severe based on ground-truth signal strength.",
    _mock: true,
  },
  {
    zone: "Zone-D",
    risk_level: "low",
    overall_confidence: 0.92,
    conflict_detected: false,
    recommendations: [
      { target: "schools", action: "Normal outdoor activities may proceed" },
      { target: "hospital", action: "No additional staffing required" },
      { target: "transit", action: "No advisory needed" },
      { target: "citizens", action: "Air quality is good; outdoor activities encouraged" },
    ],
    rationale:
      "Forecast AQI of 48 (Good) with downward complaint trend. All signals aligned at low risk with high confidence.",
    _mock: true,
  },
];

export async function GET(request: NextRequest) {
  const zone = request.nextUrl.searchParams.get("zone");
  const data = zone
    ? MOCK_DECISIONS.filter((d) => d.zone === zone)
    : MOCK_DECISIONS;

  return NextResponse.json(data);
}
