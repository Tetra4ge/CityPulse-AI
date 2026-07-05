/**
 * CityPulse AI — Ingestion Agent
 *
 * Responsibility: Pull and normalize external data (AQI, weather).
 * Handle failures gracefully with exponential backoff retry, degraded stale caching,
 * and direct escalation logging to alert downstream agents.
 */

import {
  insertAqiRecord,
  insertWeatherRecord,
  queryAqiHistory,
  queryWeatherHistory,
  saveRawPayload,
  insertTimelineEntry,
} from "../db/bigquery-client";
import { simulateComplaints } from "./complaint-simulator";
import type { IngestionOutput, IngestionSource } from "@/lib/types/agent-schemas";

// Coordinates for Delhi zones to provide localized variation
const ZONE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Zone-A": { lat: 28.6304, lng: 77.2177 }, // Connaught Place (Central)
  "Zone-B": { lat: 28.5823, lng: 77.0500 }, // Dwarka (West)
  "Zone-C": { lat: 28.5355, lng: 77.2718 }, // Okhla (South)
  "Zone-D": { lat: 28.7495, lng: 77.1200 }, // Rohini (North)
  "Delhi": { lat: 28.6139, lng: 77.2090 },
  "Mumbai": { lat: 19.0760, lng: 72.8777 },
  "Bangalore": { lat: 12.9716, lng: 77.5946 },
  "New York": { lat: 40.7128, lng: -74.0060 },
  "London": { lat: 51.5074, lng: -0.1278 },
  "Tokyo": { lat: 35.6762, lng: 139.6503 }
};

// Default coords (Central Delhi)
const DEFAULT_COORDS = { lat: 28.6139, lng: 77.2090 };

/**
 * Helper delay function
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Pull data from an external source and normalize it.
 * Writes raw payload to storage and normalized record to database.
 */
export async function ingest(source: IngestionSource, zone: string = "Zone-A", lat?: number | null, lng?: number | null): Promise<IngestionOutput> {
  // Support forced failures for manual testing
  if (zone === "FORCE_FAILURE" || process.env.FORCE_INGESTION_FAILURE === "true") {
    throw new Error("Forced ingestion failure for testing retry/failover path.");
  }

  let coords = ZONE_COORDINATES[zone] || DEFAULT_COORDS;
  if (lat != null && lng != null) {
    coords = { lat, lng };
  }
  const timestamp = new Date().toISOString();

  if (source === "aqi") {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coords.lat}&longitude=${coords.lng}&current=us_aqi,pm2_5,pm10,ozone`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo AQI API responded with status ${res.status}`);
    }
    const rawData = await res.json();

    // 1. Save raw payload
    const rawUri = await saveRawPayload("aqi", zone, timestamp, rawData);

    const aqiValue = rawData.current?.us_aqi ?? 50;
    const pm25 = rawData.current?.pm2_5 ?? 15.0;
    const pm10 = rawData.current?.pm10 ?? 30.0;
    const primaryPollutant = pm25 > pm10 ? "PM2.5" : "PM10";

    // 2. Form normalized record
    const record: IngestionOutput = {
      source: "aqi",
      zone,
      timestamp,
      payload: {
        aqi_value: aqiValue,
        pollutant_primary: primaryPollutant,
        raw_payload_uri: rawUri,
      },
      status: "ok",
      confidence_penalty: 0.0,
    };

    // 3. Write normalized record to DB
    await insertAqiRecord(record);

    // 4. Log successful step to timeline
    await insertTimelineEntry({
      id: crypto.randomUUID(),
      agent_name: "ingestion",
      zone,
      timestamp,
      action: `Successfully ingested AQI data: ${aqiValue} (${primaryPollutant})`,
      input_ref: rawUri,
      output_json: record as any,
      conflict_flag: false,
      escalation_flag: false,
      confidence: 1.0,
    });

    // 5. Trigger citizen complaints simulation if AQI exceeds 100
    if (aqiValue > 100) {
      await simulateComplaints(zone, aqiValue, timestamp);
    }

    return record;
  } else if (source === "weather") {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo Weather API responded with status ${res.status}`);
    }
    const rawData = await res.json();

    // 1. Save raw payload
    const rawUri = await saveRawPayload("weather", zone, timestamp, rawData);

    const temp = rawData.current?.temperature_2m ?? 25.0;
    const hum = rawData.current?.relative_humidity_2m ?? 60.0;
    const wind = rawData.current?.wind_speed_10m ?? 10.0;

    // 2. Form normalized record
    const record: IngestionOutput = {
      source: "weather",
      zone,
      timestamp,
      payload: {
        temperature_c: temp,
        humidity_pct: hum,
        wind_kph: wind,
        raw_payload_uri: rawUri,
      },
      status: "ok",
      confidence_penalty: 0.0,
    };

    // 3. Write normalized record to DB
    await insertWeatherRecord(record);

    // 4. Log successful step to timeline
    await insertTimelineEntry({
      id: crypto.randomUUID(),
      agent_name: "ingestion",
      zone,
      timestamp,
      action: `Successfully ingested Weather data: Temp ${temp}°C, Humidity ${hum}%, Wind ${wind} km/h`,
      input_ref: rawUri,
      output_json: record as any,
      conflict_flag: false,
      escalation_flag: false,
      confidence: 1.0,
    });

    return record;
  } else {
    throw new Error(`Source type "${source}" is not directly fetched via API.`);
  }
}

/**
 * Run ingest with exponential backoff retry, up to maxRetries attempts.
 * Falls back to degraded cache state with confidence penalty on persistent failure.
 */
export async function ingestWithRetry(
  source: IngestionSource,
  zone: string = "Zone-A",
  lat?: number | null,
  lng?: number | null,
  maxRetries: number = 3
): Promise<IngestionOutput> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await ingest(source, zone, lat, lng);
    } catch (err: any) {
      attempt++;
      console.warn(`Ingestion attempt ${attempt} failed for ${source} in ${zone}: ${err.message}`);
      if (attempt >= maxRetries) {
        break;
      }
      // Exponential backoff delay
      const backoffMs = 1000 * Math.pow(2, attempt - 1);
      await delay(backoffMs);
    }
  }

  // Degraded state fallback: Fetch the most recent valid record from database
  const timestamp = new Date().toISOString();
  console.error(`Persistent ingestion failure for ${source} in ${zone}. Entering degraded fallback path.`);

  if (source === "aqi") {
    const history = await queryAqiHistory(zone);
    const lastValid = history.find((h) => h.status === "ok");

    if (lastValid) {
      const penalty = 0.5;
      const degradedRecord: IngestionOutput = {
        ...lastValid,
        timestamp,
        status: "stale",
        confidence_penalty: penalty,
      };

      // Write stale record to database
      await insertAqiRecord(degradedRecord);

      // Log escalation directly to decision log (bypassing normal loop)
      await insertTimelineEntry({
        id: crypto.randomUUID(),
        agent_name: "ingestion",
        zone,
        timestamp,
        action: `Ingestion failed after ${maxRetries} attempts. Falling back to stale cache. Confidence penalty applied.`,
        input_ref: (lastValid.payload as any).raw_payload_uri || null,
        output_json: degradedRecord as any,
        conflict_flag: false,
        escalation_flag: true,
        confidence: 1.0 - penalty,
      });

      return degradedRecord;
    }
  } else if (source === "weather") {
    const history = await queryWeatherHistory(zone);
    const lastValid = history.find((h) => h.status === "ok");

    if (lastValid) {
      const penalty = 0.5;
      const degradedRecord: IngestionOutput = {
        ...lastValid,
        timestamp,
        status: "stale",
        confidence_penalty: penalty,
      };

      await insertWeatherRecord(degradedRecord);

      await insertTimelineEntry({
        id: crypto.randomUUID(),
        agent_name: "ingestion",
        zone,
        timestamp,
        action: `Ingestion failed after ${maxRetries} attempts. Falling back to stale cache. Confidence penalty applied.`,
        input_ref: (lastValid.payload as any).raw_payload_uri || null,
        output_json: degradedRecord as any,
        conflict_flag: false,
        escalation_flag: true,
        confidence: 1.0 - penalty,
      });

      return degradedRecord;
    }
  }

  // If absolutely no backup data exists, build a fallback record
  const penalty = 0.8;
  const ultimateFallback: IngestionOutput = {
    source,
    zone,
    timestamp,
    payload: source === "aqi" 
      ? { aqi_value: 50, pollutant_primary: "PM2.5" } 
      : { temperature_c: 25, humidity_pct: 50, wind_kph: 10 },
    status: "failed",
    confidence_penalty: penalty,
  };

  if (source === "aqi") {
    await insertAqiRecord(ultimateFallback);
  } else {
    await insertWeatherRecord(ultimateFallback);
  }

  await insertTimelineEntry({
    id: crypto.randomUUID(),
    agent_name: "ingestion",
    zone,
    timestamp,
    action: `CRITICAL: Ingestion failed and no cached history was found. Default values loaded. Confidence penalty applied.`,
    input_ref: null,
    output_json: ultimateFallback as any,
    conflict_flag: false,
    escalation_flag: true,
    confidence: 1.0 - penalty,
  });

  return ultimateFallback;
}
