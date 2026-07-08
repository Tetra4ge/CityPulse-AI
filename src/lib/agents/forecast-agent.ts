/**
 * CityPulse AI — Forecast Agent
 *
 * Responsibility: Predict next-period AQI per zone using historical + current data.
 * Queries BigQuery/SQLite history, formats lag & weather data, and triggers
 * prediction via the FastAPI Python backend (with cuDF/cuML & CPU fallback).
 */

import {
  queryAqiHistory,
  queryWeatherHistory,
  insertForecast,
  insertTimelineEntry,
} from "../db/bigquery-client";
import type { ForecastOutput } from "@/lib/types/agent-schemas";
import crypto from "crypto";

/**
 * Generate AQI forecast for a zone.
 */
export async function forecast(zone: string): Promise<ForecastOutput> {
  return forecastWhatIf(zone, 1.0);
}

/**
 * Re-run forecast with adjusted features for what-if simulation.
 */
export async function forecastWhatIf(
  zone: string,
  trafficMultiplier: number,
  overrideFeatures?: Record<string, number>,
): Promise<ForecastOutput> {
  const now = new Date().toISOString();
  
  // 1. Query histories (last 7 days trailing window, up to 168 records)
  const aqiHistory = await queryAqiHistory(zone);
  const weatherHistory = await queryWeatherHistory(zone);

  // Format history records for the python service API
  const trailingAqi = aqiHistory.slice(0, 168).map((h) => ({
    timestamp: h.timestamp,
    value: (h.payload as any).aqi_value,
  })).reverse(); // Order chronologically (oldest to newest)

  const trailingWeather = weatherHistory.slice(0, 168).map((w) => ({
    timestamp: w.timestamp,
    temperature_c: (w.payload as any).temperature_c,
    humidity_pct: (w.payload as any).humidity_pct,
    wind_kph: (w.payload as any).wind_kph,
  })).reverse();

  const isWhatIf = trafficMultiplier !== 1.0 || !!overrideFeatures;

  // 2. Call python FastAPI service
  const pythonUrl = `${process.env.NEXT_PUBLIC_GPU_SERVICE_URL || "http://127.0.0.1:8000"}/forecast`;
  const apiKey = process.env.GPU_SERVICE_API_KEY || "";
  
  try {
    const res = await fetch(pythonUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify({
        zone,
        traffic_multiplier: trafficMultiplier,
        aqi_history: trailingAqi,
        weather_history: trailingWeather,
      }),
    });

    if (!res.ok) {
      throw new Error(`Python forecast service returned status ${res.status}`);
    }

    const data = await res.json();
    const prediction: ForecastOutput = {
      zone,
      predicted_aqi: data.predicted_aqi,
      horizon_hours: 24,
      confidence: data.confidence,
      reasoning: data.reasoning,
    };

    // 3. Save forecast to DB
    await insertForecast(
      prediction,
      isWhatIf,
      isWhatIf ? { traffic_multiplier: trafficMultiplier, override_features: overrideFeatures } : null
    );

    // 4. Log execution to timeline
    await insertTimelineEntry({
      id: crypto.randomUUID(),
      agent_name: "forecast",
      zone,
      timestamp: now,
      action: `Generated AQI forecast: ${data.predicted_aqi} (${isWhatIf ? "what-if simulation" : "normal forecast"})`,
      input_ref: null,
      output_json: prediction as any,
      conflict_flag: false,
      escalation_flag: false,
      confidence: data.confidence,
    });

    return prediction;

  } catch (error: any) {
    console.error(`Forecast Agent failed to contact Python backend: ${error.message}. Running fallback heuristic.`);
    
    // Fallback heuristic: project from latest value
    const baseAqi = trailingAqi.length > 0 ? trailingAqi[trailingAqi.length - 1].value : 75;
    let predicted_aqi = baseAqi * (1.0 + (trafficMultiplier - 1.0) * 0.3);
    predicted_aqi = Math.round(predicted_aqi);
    
    const confidence = 0.5;
    const reasoning = `[Fallback Heuristic] Python backend was offline. Generated approximate prediction based on last AQI of ${baseAqi}.`;
    
    const prediction: ForecastOutput = {
      zone,
      predicted_aqi,
      horizon_hours: 24,
      confidence,
      reasoning,
    };

    await insertForecast(
      prediction,
      isWhatIf,
      isWhatIf ? { traffic_multiplier: trafficMultiplier, override_features: overrideFeatures } : null
    );

    await insertTimelineEntry({
      id: crypto.randomUUID(),
      agent_name: "forecast",
      zone,
      timestamp: now,
      action: `Generated Fallback AQI forecast: ${predicted_aqi} (Python offline)`,
      input_ref: null,
      output_json: prediction as any,
      conflict_flag: false,
      escalation_flag: true,
      confidence,
    });

    return prediction;
  }
}
