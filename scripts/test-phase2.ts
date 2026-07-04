import { forecast, forecastWhatIf } from "../src/lib/agents/forecast-agent";
import { triage } from "../src/lib/agents/triage-agent";
import { queryTimeline, insertComplaint } from "../src/lib/db/bigquery-client";
import type { IngestionOutput } from "../src/lib/types/agent-schemas";

async function runTests() {
  console.log("=== Starting Phase 2 Agents & GPU Service Integration Tests ===\n");

  console.log("1. Running Forecast Agent (Normal)...");
  const normForecast = await forecast("Zone-A");
  console.log("   Zone: ", normForecast.zone);
  console.log("   Predicted AQI: ", normForecast.predicted_aqi);
  console.log("   Confidence: ", normForecast.confidence);
  console.log("   Reasoning: ", normForecast.reasoning);

  console.log("\n2. Running Forecast Agent (What-If: traffic=1.5)...");
  const whatifForecast = await forecastWhatIf("Zone-A", 1.5);
  console.log("   What-If Predicted AQI: ", whatifForecast.predicted_aqi);
  console.log("   Reasoning: ", whatifForecast.reasoning);
  if (whatifForecast.predicted_aqi <= normForecast.predicted_aqi) {
    console.warn("   [Warning] What-if AQI was not higher than normal AQI. Check prediction scaling if necessary.");
  }

  console.log("\n3. Seeding dense citizen complaints to trigger DBSCAN hotspot clustering...");
  const timestamp = new Date().toISOString();
  
  // Seed 5 complaints closely clustered in Zone-A to trigger DBSCAN (min_samples=2, eps=0.005)
  // Our coordinate offsetting logic uses string hashes to introduce deterministic coordinate shifts,
  // which will naturally put them very close (within 0.008 range).
  const complaintsToSeed = [
    "Severe coughing and heavy smoke near the central shopping complex.",
    "Very thick smog, coughing and having high breathing difficulty CP.",
    "Smells like chemicals in the main market, throat is burning.",
    "Hard to breathe near the central park, heavy gray haze is visible.",
    "Visibility dropped near Connaught Place blocks, traffic is slowed down."
  ];

  for (const text of complaintsToSeed) {
    const record: IngestionOutput = {
      source: "citizen_reports",
      zone: "Zone-A",
      timestamp,
      payload: {
        raw_text: text,
        category: "respiratory",
        severity: "high",
        is_simulated: true,
      },
      status: "ok",
      confidence_penalty: 0.0,
    };
    await insertComplaint(record);
  }
  console.log(`   Successfully seeded ${complaintsToSeed.length} clustered complaints into history.`);

  console.log("\n4. Running Triage Agent...");
  const triageResult = await triage("Zone-A");
  console.log("   Complaint Count Today: ", triageResult.complaint_count);
  console.log("   Trend vs Yesterday: ", triageResult.trend_vs_yesterday);
  console.log("   Severity Signal: ", triageResult.severity_signal);
  console.log("   Hotspot Detected: ", triageResult.hotspot_detected);
  console.log("   Summary: ", triageResult.summary);

  if (!triageResult.hotspot_detected) {
    throw new Error("DBSCAN failed to detect a hotspot from clustered reports!");
  }

  console.log("\n5. Verifying Triage Agent escalation trigger...");
  const timeline = await queryTimeline("Zone-A", 5);
  const triageEscalation = timeline.find(
    (t) => t.agent_name === "triage" && t.escalation_flag === true
  );

  if (triageEscalation) {
    console.log("   Verified: Critical complaint spike successfully escalated in timeline!");
    console.log("   Escalation Action: ", triageEscalation.action);
    console.log("   Escalation Flag: ", triageEscalation.escalation_flag);
  } else {
    throw new Error("No triage escalation log found! Spike did not trigger escalation.");
  }

  console.log("\n=== All Phase 2 Agents & GPU Service Integration Tests Passed Successfully! ===");
}

runTests().catch((err) => {
  console.error("\n*** Test execution failed: ***", err);
  process.exit(1);
});
