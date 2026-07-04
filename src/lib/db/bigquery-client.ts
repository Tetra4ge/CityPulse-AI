/**
 * CityPulse AI — BigQuery Client (Dual-Mode: BigQuery/GCS & SQLite/FS Fallback)
 *
 * Responsibility: Provide a unified read/write API for the shared memory layer.
 * If GCP environment variables are set, it connects to standard GCP BigQuery and
 * GCS. Otherwise, it falls back to the local SQLite database and local disk storage
 * for raw JSON payloads, making local dev easy and dependency-free.
 */

import { BigQuery } from "@google-cloud/bigquery";
import { Storage } from "@google-cloud/storage";
import { db } from "./index";
import * as schema from "./schema";
import { eq, desc, and, gte } from "drizzle-orm";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import type {
  IngestionOutput,
  ForecastOutput,
  DecisionOutput,
  ReflectionOutput,
  TimelineEntry,
  NotificationEntry,
  AqiPayload,
  WeatherPayload,
  CitizenReportPayload,
} from "@/lib/types/agent-schemas";

// Determine if we should use live GCP services
const isGcpEnabled = !!(
  process.env.GOOGLE_CLOUD_PROJECT_ID &&
  (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE)
);

const datasetId = process.env.BIGQUERY_DATASET || "citypulse_ai";
const bucketName = process.env.GCS_BUCKET_NAME || "citypulse-raw-ingestion";

let bq: BigQuery | null = null;
let storage: Storage | null = null;

if (isGcpEnabled) {
  bq = new BigQuery({ projectId: process.env.GOOGLE_CLOUD_PROJECT_ID });
  storage = new Storage({ projectId: process.env.GOOGLE_CLOUD_PROJECT_ID });
}

// Helper to format timestamps from BigQuery / DB to ISO string
function formatTimestamp(ts: any): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === "object" && ts.value) return new Date(ts.value).toISOString();
  return new Date(ts).toISOString();
}

/**
 * Write a raw API response to Storage (GCS or local directory).
 * Returns the URI pointer.
 */
export async function saveRawPayload(
  source: string,
  zone: string,
  timestamp: string,
  rawPayload: any
): Promise<string> {
  const payloadStr = typeof rawPayload === "string" ? rawPayload : JSON.stringify(rawPayload);
  const safeTimestamp = timestamp.replace(/[:.]/g, "-");
  const key = `raw/${source}/${safeTimestamp}_${zone.replace(/\s+/g, "_")}.json`;

  if (isGcpEnabled && storage) {
    const file = storage.bucket(bucketName).file(key);
    await file.save(payloadStr, {
      contentType: "application/json",
      resumable: false,
    });
    return `gs://${bucketName}/${key}`;
  } else {
    const dir = path.join(process.cwd(), "data", "raw-ingestion", source);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, `${safeTimestamp}_${zone.replace(/\s+/g, "_")}.json`);
    fs.writeFileSync(filePath, payloadStr, "utf8");
    return `file:///${filePath.replace(/\\/g, "/")}`;
  }
}

/**
 * Direct stream helper for BigQuery inserts
 */
async function insertBqRow(tableId: string, row: any) {
  if (!bq) throw new Error("BigQuery client not initialized");
  await bq.dataset(datasetId).table(tableId).insert(row);
}

// =============================================================================
// Query methods (read)
// =============================================================================

export async function queryAqiHistory(
  zone?: string,
  since?: string,
): Promise<IngestionOutput[]> {
  if (isGcpEnabled && bq) {
    let queryStr = `
      SELECT id, zone, timestamp, aqi_value, source_status, confidence_penalty, raw_payload_uri 
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${datasetId}.aqi_history\`
      WHERE 1=1
    `;
    const params: any = {};
    if (zone) {
      queryStr += ` AND zone = @zone`;
      params.zone = zone;
    }
    if (since) {
      queryStr += ` AND timestamp >= @since`;
      params.since = since;
    }
    queryStr += ` ORDER BY timestamp DESC`;

    const [rows] = await bq.query({ query: queryStr, params });
    return rows.map((row: any) => ({
      source: "aqi",
      zone: row.zone,
      timestamp: formatTimestamp(row.timestamp),
      payload: {
        aqi_value: Number(row.aqi_value),
        raw_payload_uri: row.raw_payload_uri || undefined,
      },
      status: row.source_status as any,
      confidence_penalty: Number(row.confidence_penalty || 0),
    }));
  } else {
    // SQLite Fallback
    const conditions = [];
    if (zone) conditions.push(eq(schema.aqiHistory.zone, zone));
    if (since) conditions.push(gte(schema.aqiHistory.timestamp, since));
    
    let rows;
    if (conditions.length > 0) {
      rows = await db.select().from(schema.aqiHistory).where(and(...conditions)).orderBy(desc(schema.aqiHistory.timestamp));
    } else {
      rows = await db.select().from(schema.aqiHistory).orderBy(desc(schema.aqiHistory.timestamp));
    }

    return rows.map(row => ({
      source: "aqi",
      zone: row.zone,
      timestamp: row.timestamp,
      payload: {
        aqi_value: row.aqiValue,
        raw_payload_uri: row.rawPayloadUri || undefined,
      },
      status: row.sourceStatus as any,
      confidence_penalty: row.confidencePenalty || 0,
    }));
  }
}

export async function queryWeatherHistory(
  zone?: string,
  since?: string,
): Promise<IngestionOutput[]> {
  if (isGcpEnabled && bq) {
    let queryStr = `
      SELECT id, zone, timestamp, temperature_c, humidity_pct, wind_kph, source_status, raw_payload_uri 
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${datasetId}.weather_history\`
      WHERE 1=1
    `;
    const params: any = {};
    if (zone) {
      queryStr += ` AND zone = @zone`;
      params.zone = zone;
    }
    if (since) {
      queryStr += ` AND timestamp >= @since`;
      params.since = since;
    }
    queryStr += ` ORDER BY timestamp DESC`;

    const [rows] = await bq.query({ query: queryStr, params });
    return rows.map((row: any) => ({
      source: "weather",
      zone: row.zone,
      timestamp: formatTimestamp(row.timestamp),
      payload: {
        temperature_c: Number(row.temperature_c ?? 0),
        humidity_pct: Number(row.humidity_pct ?? 0),
        wind_kph: Number(row.wind_kph ?? 0),
        raw_payload_uri: row.raw_payload_uri || undefined,
      },
      status: row.source_status as any,
      confidence_penalty: 0.0,
    }));
  } else {
    // SQLite Fallback
    const conditions = [];
    if (zone) conditions.push(eq(schema.weatherHistory.zone, zone));
    if (since) conditions.push(gte(schema.weatherHistory.timestamp, since));

    let rows;
    if (conditions.length > 0) {
      rows = await db.select().from(schema.weatherHistory).where(and(...conditions)).orderBy(desc(schema.weatherHistory.timestamp));
    } else {
      rows = await db.select().from(schema.weatherHistory).orderBy(desc(schema.weatherHistory.timestamp));
    }

    return rows.map(row => ({
      source: "weather",
      zone: row.zone,
      timestamp: row.timestamp,
      payload: {
        temperature_c: row.temperatureC ?? 0,
        humidity_pct: row.humidityPct ?? 0,
        wind_kph: row.windKph ?? 0,
        raw_payload_uri: row.rawPayloadUri || undefined,
      },
      status: row.sourceStatus as any,
      confidence_penalty: 0.0,
    }));
  }
}

export async function queryComplaintsHistory(
  zone?: string,
  since?: string,
): Promise<IngestionOutput[]> {
  if (isGcpEnabled && bq) {
    let queryStr = `
      SELECT id, zone, timestamp, raw_text, category, severity, is_simulated 
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${datasetId}.complaints_history\`
      WHERE 1=1
    `;
    const params: any = {};
    if (zone) {
      queryStr += ` AND zone = @zone`;
      params.zone = zone;
    }
    if (since) {
      queryStr += ` AND timestamp >= @since`;
      params.since = since;
    }
    queryStr += ` ORDER BY timestamp DESC`;

    const [rows] = await bq.query({ query: queryStr, params });
    return rows.map((row: any) => ({
      source: "citizen_reports",
      zone: row.zone,
      timestamp: formatTimestamp(row.timestamp),
      payload: {
        raw_text: row.raw_text,
        category: row.category || "other",
        severity: row.severity || "medium",
        is_simulated: !!row.is_simulated,
      },
      status: "ok",
      confidence_penalty: 0.0,
    }));
  } else {
    // SQLite Fallback
    const conditions = [];
    if (zone) conditions.push(eq(schema.complaintsHistory.zone, zone));
    if (since) conditions.push(gte(schema.complaintsHistory.timestamp, since));

    let rows;
    if (conditions.length > 0) {
      rows = await db.select().from(schema.complaintsHistory).where(and(...conditions)).orderBy(desc(schema.complaintsHistory.timestamp));
    } else {
      rows = await db.select().from(schema.complaintsHistory).orderBy(desc(schema.complaintsHistory.timestamp));
    }

    return rows.map(row => ({
      source: "citizen_reports",
      zone: row.zone,
      timestamp: row.timestamp,
      payload: {
        raw_text: row.rawText,
        category: (row.category as any) ?? "other",
        severity: (row.severity as any) ?? "medium",
        is_simulated: !!row.isSimulated,
      },
      status: "ok",
      confidence_penalty: 0.0,
    }));
  }
}

export async function queryForecasts(zone?: string): Promise<ForecastOutput[]> {
  if (isGcpEnabled && bq) {
    let queryStr = `
      SELECT zone, predicted_aqi, horizon_hours, confidence, reasoning
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${datasetId}.forecasts\`
      WHERE 1=1
    `;
    const params: any = {};
    if (zone) {
      queryStr += ` AND zone = @zone`;
      params.zone = zone;
    }
    queryStr += ` ORDER BY generated_at DESC`;

    const [rows] = await bq.query({ query: queryStr, params });
    return rows.map((row: any) => ({
      zone: row.zone,
      predicted_aqi: Number(row.predicted_aqi),
      horizon_hours: Number(row.horizon_hours),
      confidence: Number(row.confidence),
      reasoning: row.reasoning || "",
    }));
  } else {
    let rows;
    if (zone) {
      rows = await db.select().from(schema.forecasts).where(eq(schema.forecasts.zone, zone)).orderBy(desc(schema.forecasts.generatedAt));
    } else {
      rows = await db.select().from(schema.forecasts).orderBy(desc(schema.forecasts.generatedAt));
    }
    return rows.map(row => ({
      zone: row.zone,
      predicted_aqi: row.predictedAqi,
      horizon_hours: row.horizonHours,
      confidence: row.confidence,
      reasoning: row.reasoning || "",
    }));
  }
}

export async function queryDecisions(zone?: string): Promise<DecisionOutput[]> {
  if (isGcpEnabled && bq) {
    let queryStr = `
      SELECT zone, risk_level, overall_confidence, conflict_detected, recommendations, rationale
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${datasetId}.decisions\`
      WHERE 1=1
    `;
    const params: any = {};
    if (zone) {
      queryStr += ` AND zone = @zone`;
      params.zone = zone;
    }
    queryStr += ` ORDER BY generated_at DESC`;

    const [rows] = await bq.query({ query: queryStr, params });
    return rows.map((row: any) => ({
      zone: row.zone,
      risk_level: row.risk_level as any,
      overall_confidence: Number(row.overall_confidence),
      conflict_detected: !!row.conflict_detected,
      recommendations: typeof row.recommendations === "string" ? JSON.parse(row.recommendations) : row.recommendations,
      rationale: row.rationale || "",
    }));
  } else {
    let rows;
    if (zone) {
      rows = await db.select().from(schema.decisions).where(eq(schema.decisions.zone, zone)).orderBy(desc(schema.decisions.generatedAt));
    } else {
      rows = await db.select().from(schema.decisions).orderBy(desc(schema.decisions.generatedAt));
    }
    return rows.map(row => ({
      zone: row.zone,
      risk_level: row.riskLevel as any,
      overall_confidence: row.overallConfidence,
      conflict_detected: !!row.conflictDetected,
      recommendations: (row.recommendations as any) || [],
      rationale: row.rationale || "",
    }));
  }
}

export async function queryReflection(decisionId: string): Promise<ReflectionOutput | null> {
  if (isGcpEnabled && bq) {
    const queryStr = `
      SELECT validated, requires_human_review, flags, notes
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${datasetId}.reflections\`
      WHERE decision_id = @decisionId
      LIMIT 1
    `;
    const [rows] = await bq.query({ query: queryStr, params: { decisionId } });
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      validated: !!row.validated,
      requires_human_review: !!row.requires_human_review,
      flags: typeof row.flags === "string" ? JSON.parse(row.flags) : row.flags || [],
      notes: row.notes || "",
    };
  } else {
    const rows = await db.select().from(schema.reflections).where(eq(schema.reflections.decisionId, decisionId)).limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      validated: !!row.validated,
      requires_human_review: !!row.requiresHumanReview,
      flags: (row.flags as any) || [],
      notes: row.notes || "",
    };
  }
}

export async function queryTimeline(
  zone?: string,
  limit?: number,
): Promise<TimelineEntry[]> {
  const maxLimit = limit || 50;
  if (isGcpEnabled && bq) {
    let queryStr = `
      SELECT id, agent_name, zone, timestamp, action, input_ref, output_json, conflict_flag, escalation_flag, confidence
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${datasetId}.agent_decisions_log\`
      WHERE 1=1
    `;
    const params: any = {};
    if (zone) {
      queryStr += ` AND zone = @zone`;
      params.zone = zone;
    }
    queryStr += ` ORDER BY timestamp DESC LIMIT @limit`;
    params.limit = maxLimit;

    const [rows] = await bq.query({ query: queryStr, params });
    return rows.map((row: any) => ({
      id: row.id,
      agent_name: row.agent_name as any,
      zone: row.zone || null,
      timestamp: formatTimestamp(row.timestamp),
      action: row.action,
      input_ref: row.input_ref || null,
      output_json: typeof row.output_json === "string" ? JSON.parse(row.output_json) : row.output_json || {},
      conflict_flag: !!row.conflict_flag,
      escalation_flag: !!row.escalation_flag,
      confidence: row.confidence !== null ? Number(row.confidence) : null,
    }));
  } else {
    let rows;
    if (zone) {
      rows = await db.select().from(schema.agentDecisionsLog).where(eq(schema.agentDecisionsLog.zone, zone)).orderBy(desc(schema.agentDecisionsLog.timestamp)).limit(maxLimit);
    } else {
      rows = await db.select().from(schema.agentDecisionsLog).orderBy(desc(schema.agentDecisionsLog.timestamp)).limit(maxLimit);
    }
    return rows.map(row => ({
      id: row.id,
      agent_name: row.agentName as any,
      zone: row.zone || null,
      timestamp: row.timestamp,
      action: row.action,
      input_ref: row.inputRef || null,
      output_json: (row.outputJson as any) || {},
      conflict_flag: !!row.conflictFlag,
      escalation_flag: !!row.escalationFlag,
      confidence: row.confidence ?? null,
    }));
  }
}

export async function queryNotifications(
  zone?: string,
  since?: string,
): Promise<NotificationEntry[]> {
  if (isGcpEnabled && bq) {
    let queryStr = `
      SELECT id, decision_id, zone, timestamp, target_audience, message, approved_by, dispatch_status
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${datasetId}.notifications_log\`
      WHERE 1=1
    `;
    const params: any = {};
    if (zone) {
      queryStr += ` AND zone = @zone`;
      params.zone = zone;
    }
    if (since) {
      queryStr += ` AND timestamp >= @since`;
      params.since = since;
    }
    queryStr += ` ORDER BY timestamp DESC`;

    const [rows] = await bq.query({ query: queryStr, params });
    return rows.map((row: any) => ({
      id: row.id,
      decision_id: row.decision_id,
      zone: row.zone,
      timestamp: formatTimestamp(row.timestamp),
      target_audience: row.target_audience as any,
      message: row.message,
      approved_by: row.approved_by || "",
      dispatch_status: row.dispatch_status as any,
    }));
  } else {
    const conditions = [];
    if (zone) conditions.push(eq(schema.notificationsLog.zone, zone));
    if (since) conditions.push(gte(schema.notificationsLog.timestamp, since));

    let rows;
    if (conditions.length > 0) {
      rows = await db.select().from(schema.notificationsLog).where(and(...conditions)).orderBy(desc(schema.notificationsLog.timestamp));
    } else {
      rows = await db.select().from(schema.notificationsLog).orderBy(desc(schema.notificationsLog.timestamp));
    }

    return rows.map(row => ({
      id: row.id,
      decision_id: row.decisionId,
      zone: row.zone,
      timestamp: row.timestamp,
      target_audience: row.targetAudience as any,
      message: row.message,
      approved_by: row.approvedBy || "",
      dispatch_status: row.dispatchStatus as any,
    }));
  }
}

// =============================================================================
// Insert methods (write)
// =============================================================================

export async function insertAqiRecord(record: IngestionOutput): Promise<string> {
  const payload = record.payload as AqiPayload;
  const id = crypto.randomUUID();
  if (isGcpEnabled && bq) {
    await insertBqRow("aqi_history", {
      id,
      zone: record.zone,
      timestamp: record.timestamp,
      aqi_value: payload.aqi_value,
      source_status: record.status,
      confidence_penalty: record.confidence_penalty,
      raw_payload_uri: payload.raw_payload_uri || null,
      created_at: new Date().toISOString(),
    });
  } else {
    await db.insert(schema.aqiHistory).values({
      id,
      zone: record.zone,
      timestamp: record.timestamp,
      aqiValue: payload.aqi_value,
      sourceStatus: record.status,
      confidencePenalty: record.confidence_penalty,
      rawPayloadUri: payload.raw_payload_uri || null,
    });
  }
  return id;
}

export async function insertWeatherRecord(record: IngestionOutput): Promise<string> {
  const payload = record.payload as WeatherPayload;
  const id = crypto.randomUUID();
  if (isGcpEnabled && bq) {
    await insertBqRow("weather_history", {
      id,
      zone: record.zone,
      timestamp: record.timestamp,
      temperature_c: payload.temperature_c,
      humidity_pct: payload.humidity_pct,
      wind_kph: payload.wind_kph,
      source_status: record.status,
      raw_payload_uri: payload.raw_payload_uri || null,
      created_at: new Date().toISOString(),
    });
  } else {
    await db.insert(schema.weatherHistory).values({
      id,
      zone: record.zone,
      timestamp: record.timestamp,
      temperatureC: payload.temperature_c,
      humidityPct: payload.humidity_pct,
      windKph: payload.wind_kph,
      sourceStatus: record.status,
      rawPayloadUri: payload.raw_payload_uri || null,
    });
  }
  return id;
}

export async function insertComplaint(record: IngestionOutput): Promise<string> {
  const payload = record.payload as CitizenReportPayload;
  const id = crypto.randomUUID();
  if (isGcpEnabled && bq) {
    await insertBqRow("complaints_history", {
      id,
      zone: record.zone,
      timestamp: record.timestamp,
      raw_text: payload.raw_text,
      category: payload.category || null,
      severity: payload.severity || null,
      cluster_id: null,
      is_simulated: payload.is_simulated,
      created_at: new Date().toISOString(),
    });
  } else {
    await db.insert(schema.complaintsHistory).values({
      id,
      zone: record.zone,
      timestamp: record.timestamp,
      rawText: payload.raw_text,
      category: payload.category || null,
      severity: payload.severity || null,
      isSimulated: payload.is_simulated,
    });
  }
  return id;
}

export async function insertForecast(
  record: ForecastOutput,
  isWhatif: boolean = false,
  whatifParams: any = null
): Promise<string> {
  const id = crypto.randomUUID();
  const generatedAt = new Date().toISOString();
  if (isGcpEnabled && bq) {
    await insertBqRow("forecasts", {
      id,
      zone: record.zone,
      generated_at: generatedAt,
      predicted_aqi: record.predicted_aqi,
      horizon_hours: record.horizon_hours,
      confidence: record.confidence,
      reasoning: record.reasoning || null,
      is_whatif: isWhatif,
      whatif_params: whatifParams ? JSON.stringify(whatifParams) : null,
      created_at: new Date().toISOString(),
    });
  } else {
    await db.insert(schema.forecasts).values({
      id,
      zone: record.zone,
      generatedAt,
      predictedAqi: record.predicted_aqi,
      horizonHours: record.horizon_hours,
      confidence: record.confidence,
      reasoning: record.reasoning || null,
      isWhatif,
      whatifParams,
    });
  }
  return id;
}

export async function insertDecision(record: DecisionOutput, providedId?: string): Promise<string> {
  const id = providedId || crypto.randomUUID();
  if (isGcpEnabled && bq) {
    await insertBqRow("decisions", {
      id,
      zone: record.zone,
      generated_at: new Date().toISOString(),
      risk_level: record.risk_level,
      overall_confidence: record.overall_confidence,
      conflict_detected: record.conflict_detected,
      recommendations: JSON.stringify(record.recommendations),
      rationale: record.rationale || null,
      reflection_id: null,
      approval_status: "pending",
      reviewer_id: null,
      reviewed_at: null,
      created_at: new Date().toISOString(),
    });
  } else {
    await db.insert(schema.decisions).values({
      id,
      zone: record.zone,
      generatedAt: new Date().toISOString(),
      riskLevel: record.risk_level,
      overallConfidence: record.overall_confidence,
      conflictDetected: record.conflict_detected,
      recommendations: record.recommendations,
      rationale: record.rationale || null,
      approvalStatus: "pending",
    });
  }
  return id;
}

export async function insertReflection(record: ReflectionOutput & { decisionId?: string }): Promise<string> {
  const id = crypto.randomUUID();
  const decisionId = record.decisionId || "";
  if (isGcpEnabled && bq) {
    await insertBqRow("reflections", {
      id,
      decision_id: decisionId,
      validated: record.validated,
      requires_human_review: record.requires_human_review,
      flags: JSON.stringify(record.flags || []),
      notes: record.notes || null,
      created_at: new Date().toISOString(),
    });
  } else {
    await db.insert(schema.reflections).values({
      id,
      decisionId,
      validated: record.validated,
      requiresHumanReview: record.requires_human_review,
      flags: record.flags || [],
      notes: record.notes || null,
    });
  }
  return id;
}

export async function insertTimelineEntry(entry: TimelineEntry): Promise<string> {
  const id = crypto.randomUUID();
  if (isGcpEnabled && bq) {
    await insertBqRow("agent_decisions_log", {
      id,
      agent_name: entry.agent_name,
      zone: entry.zone || null,
      timestamp: entry.timestamp,
      action: entry.action,
      input_ref: entry.input_ref || null,
      output_json: JSON.stringify(entry.output_json),
      conflict_flag: entry.conflict_flag,
      escalation_flag: entry.escalation_flag,
      confidence: entry.confidence !== null ? entry.confidence : null,
      created_at: new Date().toISOString(),
    });
  } else {
    await db.insert(schema.agentDecisionsLog).values({
      id,
      agentName: entry.agent_name,
      zone: entry.zone || null,
      timestamp: entry.timestamp,
      action: entry.action,
      inputRef: entry.input_ref || null,
      outputJson: entry.output_json,
      conflictFlag: entry.conflict_flag,
      escalationFlag: entry.escalation_flag,
      confidence: entry.confidence ?? null,
    });
  }
  return id;
}

export async function insertNotification(entry: NotificationEntry): Promise<string> {
  const id = crypto.randomUUID();
  if (isGcpEnabled && bq) {
    await insertBqRow("notifications_log", {
      id,
      decision_id: entry.decision_id,
      zone: entry.zone,
      timestamp: entry.timestamp,
      target_audience: entry.target_audience,
      message: entry.message,
      approved_by: entry.approved_by || null,
      dispatch_status: entry.dispatch_status,
      created_at: new Date().toISOString(),
    });
  } else {
    await db.insert(schema.notificationsLog).values({
      id,
      decisionId: entry.decision_id,
      zone: entry.zone,
      timestamp: entry.timestamp,
      targetAudience: entry.target_audience,
      message: entry.message,
      approvedBy: entry.approved_by || null,
      dispatchStatus: entry.dispatch_status,
    });
  }
  return id;
}

// =============================================================================
// Update methods
// =============================================================================

export async function updateDecisionApproval(
  decisionId: string,
  approved: boolean,
  reviewerId: string,
): Promise<void> {
  const approvalStatus = approved ? "approved" : "rejected";
  const reviewedAt = new Date().toISOString();

  if (isGcpEnabled && bq) {
    const queryStr = `
      UPDATE \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${datasetId}.decisions\`
      SET approval_status = @approvalStatus, reviewer_id = @reviewerId, reviewed_at = @reviewedAt
      WHERE id = @decisionId
    `;
    await bq.query({
      query: queryStr,
      params: { approvalStatus, reviewerId, reviewedAt, decisionId },
    });
  } else {
    await db
      .update(schema.decisions)
      .set({
        approvalStatus,
        reviewerId,
        reviewedAt,
      })
      .where(eq(schema.decisions.id, decisionId));
  }
}
