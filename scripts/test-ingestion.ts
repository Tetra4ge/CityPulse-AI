import { ingestWithRetry } from "../src/lib/agents/ingestion-agent";
import {
  queryComplaintsHistory,
  queryTimeline,
} from "../src/lib/db/bigquery-client";
import fs from "fs";

async function runTests() {
  console.log("=== Starting Phase 1 Ingestion Agent Integration Tests ===\n");

  // Clear existing databases if wanted or just work on top of current db
  console.log("1. Running normal ingestion for AQI (Zone-A)...");
  const aqiRecord = await ingestWithRetry("aqi", "Zone-A");
  console.log("   AQI Value: ", (aqiRecord.payload as any).aqi_value);
  console.log("   Raw Payload URI: ", (aqiRecord.payload as any).raw_payload_uri);
  console.log("   Status: ", aqiRecord.status);
  console.log("   Confidence Penalty: ", aqiRecord.confidence_penalty);
  if (aqiRecord.status !== "ok") throw new Error("Normal AQI ingestion status should be 'ok'");

  // Verify that raw payload file actually exists
  const rawUri = (aqiRecord.payload as any).raw_payload_uri;
  if (rawUri.startsWith("file:///")) {
    const rawPath = rawUri.replace("file:///", "");
    if (fs.existsSync(rawPath)) {
      console.log("   Verified: Raw payload file exists on disk at " + rawPath);
    } else {
      throw new Error(`Raw payload file not found at: ${rawPath}`);
    }
  }

  console.log("\n2. Running normal ingestion for Weather (Zone-A)...");
  const weatherRecord = await ingestWithRetry("weather", "Zone-A");
  console.log("   Temperature: ", (weatherRecord.payload as any).temperature_c, "°C");
  console.log("   Humidity: ", (weatherRecord.payload as any).humidity_pct, "%");
  console.log("   Wind Speed: ", (weatherRecord.payload as any).wind_kph, "km/h");
  console.log("   Status: ", weatherRecord.status);
  if (weatherRecord.status !== "ok") throw new Error("Normal weather ingestion status should be 'ok'");

  console.log("\n3. Testing high AQI citizen complaint simulation...");
  // Let's manually trigger a complaint simulation by temporarily seeding a high AQI and verifying
  // the simulator generates complaints. Wait, our simulator is already run inside ingest if aqi > 100.
  // Delhi CP (Zone-A) AQI can easily be > 100, let's query complains history for Zone-A
  const complaints = await queryComplaintsHistory("Zone-A");
  console.log(`   Found ${complaints.length} simulated complaints for Zone-A in history.`);
  if (complaints.length > 0) {
    console.log("   Sample complaint: ", complaints[0].payload.raw_text);
    console.log("   Sample severity: ", complaints[0].payload.severity);
    console.log("   Sample category: ", complaints[0].payload.category);
    console.log("   Sample is_simulated: ", complaints[0].payload.is_simulated);
  }

  console.log("\n4. Testing Ingestion Failure / Degraded Path Fallback...");
  // Enable forced failures
  process.env.FORCE_INGESTION_FAILURE = "true";

  console.log("   Attempting AQI Ingestion with retry (forcing failure)...");
  const degradedRecord = await ingestWithRetry("aqi", "Zone-A", 3);
  console.log("   Degraded Record AQI Value: ", (degradedRecord.payload as any).aqi_value);
  console.log("   Degraded Record Status: ", degradedRecord.status);
  console.log("   Degraded Record Confidence Penalty: ", degradedRecord.confidence_penalty);

  if (degradedRecord.status !== "stale") {
    throw new Error(`Degraded AQI record status should be 'stale', got: ${degradedRecord.status}`);
  }
  if (degradedRecord.confidence_penalty !== 0.5) {
    throw new Error(`Degraded confidence penalty should be 0.5, got: ${degradedRecord.confidence_penalty}`);
  }

  // Disable forced failures
  process.env.FORCE_INGESTION_FAILURE = "false";

  console.log("\n5. Verifying direct escalation to decision timeline log...");
  const timeline = await queryTimeline("Zone-A", 5);
  const escalation = timeline.find((t) => t.escalation_flag === true);
  if (escalation) {
    console.log("   Verified escalation log found!");
    console.log("   Escalation Action: ", escalation.action);
    console.log("   Agent: ", escalation.agent_name);
    console.log("   Escalation Flag: ", escalation.escalation_flag);
  } else {
    throw new Error("Escalation log not found in timeline!");
  }

  console.log("\n=== All Ingestion Agent Integration Tests Passed Successfully! ===");
}

runTests().catch((err) => {
  console.error("\n*** Test execution failed: ***", err);
  process.exit(1);
});
