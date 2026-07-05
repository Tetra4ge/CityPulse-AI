/**
 * CityPulse AI — Agent Schema Type Definitions
 *
 * These types match the exact schemas defined in 03_TRD.md Section 2.
 * They are the contract between agents, API routes, and the frontend.
 * Do not modify these types without updating the corresponding TRD section.
 */

// =============================================================================
// Shared types
// =============================================================================

/** Source status for ingested data */
export type SourceStatus = "ok" | "stale" | "failed";

/** Risk level classification from Decision Agent */
export type RiskLevel = "low" | "medium" | "high" | "severe";

/** Trend direction relative to prior period */
export type TrendDirection = "up" | "down" | "flat";

/** Severity signal from Triage Agent */
export type SeveritySignal = "low" | "medium" | "high" | "very_high";

/** Data source type for Ingestion Agent */
export type IngestionSource = "aqi" | "weather" | "citizen_reports";

/** Agent name in the system */
export type AgentName =
  | "ingestion"
  | "forecast"
  | "triage"
  | "decision"
  | "reflection"
  | "human"
  | "notification";

/** Target audience for notifications */
export type TargetAudience = "schools" | "hospital" | "transit" | "citizens";

/** Approval status for decisions */
export type ApprovalStatus = "pending" | "approved" | "rejected";

/** Dispatch status for notifications */
export type DispatchStatus = "simulated" | "sent" | "failed";

/** Complaint category */
export type ComplaintCategory = "respiratory" | "visibility" | "odor" | "other";

// =============================================================================
// Agent output schemas (03_TRD.md §2.1–2.8)
// =============================================================================

/**
 * Ingestion Agent output (TRD §2.1)
 * Emitted after pulling and normalizing external data.
 */
export interface IngestionOutput {
  source: IngestionSource;
  zone: string;
  timestamp: string; // ISO 8601
  payload: AqiPayload | WeatherPayload | CitizenReportPayload;
  status: SourceStatus;
  confidence_penalty: number;
  _mock?: boolean;
}

export interface AqiPayload {
  aqi_value: number;
  pollutant_primary?: string;
  raw_payload_uri?: string;
}

export interface WeatherPayload {
  temperature_c: number;
  humidity_pct: number;
  wind_kph: number;
  raw_payload_uri?: string;
}

export interface CitizenReportPayload {
  raw_text: string;
  category?: ComplaintCategory;
  severity?: SeveritySignal;
  is_simulated: boolean;
}

/**
 * Forecast Agent output (TRD §2.2)
 * Predicts next-period AQI per zone.
 */
export interface ForecastOutput {
  zone: string;
  predicted_aqi: number;
  horizon_hours: number;
  confidence: number;
  reasoning: string;
  _mock?: boolean;
}

/**
 * Resource Agent output (TRD §2.4 - New)
 * Evaluates city resource capacity.
 */
export interface ResourceOutput {
  resource_risk_score: number; // 0.0 - 1.0
  bottlenecks: string[];       // e.g. ["hospital_beds_zone_a"]
  analysis: string;
  data_stale: boolean;
  _mock?: boolean;
}

/**
 * Triage Agent output (TRD §2.3)
 * Clustering and severity analysis of citizen reports.
 */
export interface TriageOutput {
  zone: string;
  complaint_count: number;
  trend_vs_yesterday: TrendDirection;
  severity_signal: SeveritySignal;
  hotspot_detected: boolean;
  summary: string;
  _mock?: boolean;
}

/**
 * Decision Agent recommendation target
 */
export interface RecommendationTarget {
  target: TargetAudience;
  action: string;
}

/**
 * Decision Agent output (TRD §2.5)
 * Synthesized recommendation with conflict detection.
 */
export interface DecisionOutput {
  zone: string;
  risk_level: RiskLevel;
  overall_confidence: number;
  conflict_detected: boolean;
  recommendations: RecommendationTarget[];
  rationale: string;
  _mock?: boolean;
}

/**
 * Reflection Agent output (TRD §2.6)
 * Quality-check on Decision Agent output.
 */
export interface ReflectionOutput {
  validated: boolean;
  requires_human_review: boolean;
  flags: string[];
  notes: string;
  _mock?: boolean;
}

/**
 * Explainability Agent output (TRD §2.7 - New)
 * Generates a human-readable trace of the decision math.
 */
export interface ExplainabilityOutput {
  trace_report: string;
  key_metrics: string[];
  _mock?: boolean;
}

// =============================================================================
// API-specific types (ENDPOINT_OVERVIEW.md)
// =============================================================================

/**
 * Citizen report submission request body
 */
export interface CitizenReportRequest {
  zone: string;
  text: string;
  timestamp: string; // ISO 8601
}

/**
 * Forecast re-run request body (what-if simulation)
 */
export interface ForecastRequest {
  zone: string;
  traffic_multiplier?: number;
  override_features?: Record<string, number>;
}

/**
 * Conflict resolution request body
 */
export interface ConflictResolveRequest {
  zone: string;
  conflict_id: string;
}

/**
 * Human approval request body
 */
export interface ApprovalRequest {
  decision_id: string;
  approved: boolean;
  reviewer_id: string;
  notes?: string;
}

/**
 * Approval record (paired decision + reflection for pending list)
 */
export interface ApprovalPendingItem {
  decision: DecisionOutput & { id: string; generated_at: string; trace_report?: string | null };
  reflection: ReflectionOutput;
  _mock?: boolean;
}

/**
 * Approval response after approve/reject
 */
export interface ApprovalResponse {
  decision_id: string;
  approval_status: ApprovalStatus;
  reviewer_id: string;
  reviewed_at: string;
  notes?: string;
  _mock?: boolean;
}

/**
 * Notification dispatch request body
 */
export interface NotificationDispatchRequest {
  decision_id: string;
}

/**
 * Notification log entry
 */
export interface NotificationEntry {
  id: string;
  decision_id: string;
  zone: string;
  timestamp: string;
  target_audience: TargetAudience;
  message: string;
  approved_by: string;
  dispatch_status: DispatchStatus;
  _mock?: boolean;
}

/**
 * What-if simulation request body
 */
export interface WhatIfRequest {
  zone: string;
  traffic_multiplier: number;
  other_overrides?: Record<string, number>;
}

/**
 * What-if simulation result
 */
export interface WhatIfResult {
  forecast: ForecastOutput;
  decision: DecisionOutput;
  compute_time_ms: number;
  _mock?: boolean;
}

/**
 * Agent activity timeline entry (from agent_decisions_log table)
 */
export interface TimelineEntry {
  id: string;
  agent_name: AgentName;
  zone: string | null;
  timestamp: string;
  action: string;
  input_ref: string | null;
  output_json: Record<string, unknown>;
  conflict_flag: boolean;
  escalation_flag: boolean;
  confidence: number | null;
  _mock?: boolean;
}

/**
 * Acceleration benchmark result (Phase 6, stubbed now)
 */
export interface BenchmarkResult {
  pandas_ms: number;
  cudf_ms: number;
  speedup: number;
  dataset_size: number;
  last_run: string; // ISO 8601
  _mock?: boolean;
}

// =============================================================================
// Standard API error shape (ENDPOINT_OVERVIEW.md conventions)
// =============================================================================

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
