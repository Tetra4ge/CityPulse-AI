import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Helper for generating UUIDs since SQLite doesn't have a built-in one
const generateId = () => sql`(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`;

export const aqiHistory = sqliteTable('aqi_history', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  zone: text('zone').notNull(),
  timestamp: text('timestamp').notNull(), // ISO string
  aqiValue: real('aqi_value').notNull(),
  sourceStatus: text('source_status').notNull(), // 'ok' | 'stale' | 'failed'
  confidencePenalty: real('confidence_penalty').default(0.0),
  rawPayloadUri: text('raw_payload_uri'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const weatherHistory = sqliteTable('weather_history', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  zone: text('zone').notNull(),
  timestamp: text('timestamp').notNull(), // ISO string
  temperatureC: real('temperature_c'),
  humidityPct: real('humidity_pct'),
  windKph: real('wind_kph'),
  sourceStatus: text('source_status').notNull(), // 'ok' | 'stale' | 'failed'
  rawPayloadUri: text('raw_payload_uri'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const complaintsHistory = sqliteTable('complaints_history', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  zone: text('zone').notNull(),
  timestamp: text('timestamp').notNull(), // ISO string
  rawText: text('raw_text').notNull(),
  category: text('category'), // e.g. 'respiratory', 'visibility', 'odor'
  severity: text('severity'), // 'low' | 'medium' | 'high' | 'very_high'
  clusterId: text('cluster_id'),
  isSimulated: integer('is_simulated', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const forecasts = sqliteTable('forecasts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  zone: text('zone').notNull(),
  generatedAt: text('generated_at').notNull(), // ISO string
  predictedAqi: real('predicted_aqi').notNull(),
  horizonHours: integer('horizon_hours').notNull(),
  confidence: real('confidence').notNull(),
  reasoning: text('reasoning'),
  isWhatif: integer('is_whatif', { mode: 'boolean' }).default(false),
  whatifParams: text('whatif_params', { mode: 'json' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const agentDecisionsLog = sqliteTable('agent_decisions_log', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  agentName: text('agent_name').notNull(),
  zone: text('zone'),
  timestamp: text('timestamp').notNull(), // ISO string
  action: text('action').notNull(),
  inputRef: text('input_ref'),
  outputJson: text('output_json', { mode: 'json' }),
  conflictFlag: integer('conflict_flag', { mode: 'boolean' }).default(false),
  escalationFlag: integer('escalation_flag', { mode: 'boolean' }).default(false),
  confidence: real('confidence'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const decisions = sqliteTable('decisions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  zone: text('zone').notNull(),
  generatedAt: text('generated_at').notNull(), // ISO string
  riskLevel: text('risk_level').notNull(), // 'low' | 'medium' | 'high' | 'severe'
  overallConfidence: real('overall_confidence').notNull(),
  conflictDetected: integer('conflict_detected', { mode: 'boolean' }).default(false),
  recommendations: text('recommendations', { mode: 'json' }).notNull(),
  rationale: text('rationale'),
  traceReport: text('trace_report'),
  reflectionId: text('reflection_id'),
  approvalStatus: text('approval_status').default('pending'), // 'pending' | 'approved' | 'rejected'
  reviewerId: text('reviewer_id'),
  reviewedAt: text('reviewed_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const reflections = sqliteTable('reflections', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  decisionId: text('decision_id').notNull(),
  validated: integer('validated', { mode: 'boolean' }).notNull(),
  requiresHumanReview: integer('requires_human_review', { mode: 'boolean' }).notNull(),
  flags: text('flags', { mode: 'json' }),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const notificationsLog = sqliteTable('notifications_log', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  decisionId: text('decision_id').notNull(),
  zone: text('zone').notNull(),
  timestamp: text('timestamp').notNull(), // ISO string
  targetAudience: text('target_audience').notNull(), // 'schools' | 'hospital' | 'transit' | 'citizens'
  message: text('message').notNull(),
  approvedBy: text('approved_by'),
  dispatchStatus: text('dispatch_status').default('simulated'), // 'simulated' | 'sent' | 'failed'
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const hospitalStatus = sqliteTable("hospital_status", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  zone: text("zone").notNull(),
  totalBeds: integer("total_beds").notNull(),
  availableBeds: integer("available_beds").notNull(),
  lastUpdated: text("last_updated").notNull(),
});

export const transitStatus = sqliteTable("transit_status", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  zone: text("zone").notNull(),
  availableUnits: integer("available_units").notNull(),
  status: text("status").notNull(), // 'operational', 'degraded', 'offline'
  lastUpdated: text("last_updated").notNull(),
});

export const learnedHeuristics = sqliteTable("learned_heuristics", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  zone: text("zone").notNull(),
  decisionId: text("decision_id").notNull(),
  originalRisk: text("original_risk").notNull(),
  humanFeedback: text("human_feedback").notNull(),
  extractedRule: text("extracted_rule").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
