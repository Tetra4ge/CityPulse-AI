import { reflect } from "../src/lib/agents/reflection-agent";
import { notify } from "../src/lib/agents/notification-agent";
import { decide } from "../src/lib/agents/decision-agent";
import { insertDecision } from "../src/lib/db/bigquery-client";
import { sqlite } from "../src/lib/db/index";
import type { ForecastOutput, TriageOutput } from "../src/lib/types/agent-schemas";

async function runPhase4Tests() {
  console.log("=== Starting Phase 4 Oversight Spine Tests ===\n");

  // 1. Create a dummy decision
  const fakeForecast: ForecastOutput = {
    zone: "Zone-D", predicted_aqi: 220, horizon_hours: 24, confidence: 0.6, reasoning: "High pollution expected."
  };
  const fakeTriage: TriageOutput = {
    zone: "Zone-D", complaint_count: 5, trend_vs_yesterday: "up", severity_signal: "high", hotspot_detected: false, summary: "Complaints incoming."
  };
  const fakeResource = {
    resource_risk_score: 0.8, bottlenecks: [], analysis: "Normal", data_stale: false
  };
  
  console.log("1. Generating Decision Agent Output...");
  const decision = await decide(fakeForecast, fakeTriage, fakeResource, "Zone-D");
  
  // Insert it manually so we can test the reflection/approval flows which rely on the DB
  const decisionId = await insertDecision({ ...decision });
  console.log("   Generated Decision ID:", decisionId);

  // 2. Run Reflection
  console.log("\n2. Executing Reflection Agent...");
  const reflection = await reflect(decision, fakeForecast, fakeTriage, decisionId);
  console.log("   Requires Human Review:", reflection.requires_human_review);
  console.log("   Flags:", reflection.flags);
  console.log("   Notes:", reflection.notes);

  // 3. Test Structural Block (Dispatch BEFORE Approval)
  console.log("\n3. Testing Structural Precondition (Dispatch BEFORE Approval)...");
  try {
    await notify(decisionId);
    throw new Error("FAILED: Notification dispatched without approval!");
  } catch (err: any) {
    if (err.message.includes("Forbidden")) {
      console.log("   SUCCESS: Dispatch blocked correctly. Error:", err.message);
    } else {
      throw err;
    }
  }

  // 4. Manually Approve
  console.log("\n4. Simulating Human Approval...");
  const timestamp = new Date().toISOString();
  sqlite.prepare(`
    UPDATE decisions 
    SET approval_status = 'approved', reviewer_id = 'test_human', reviewed_at = ?
    WHERE id = ?
  `).run(timestamp, decisionId);
  console.log("   Decision approved by 'test_human'.");

  // 5. Test Structural Block (Dispatch AFTER Approval)
  console.log("\n5. Testing Notification Dispatch (AFTER Approval)...");
  const notifications = await notify(decisionId);
  console.log(`   SUCCESS: Dispatched ${notifications.length} simulated notifications.`);
  console.log(`   Sample: "${notifications[0].message}"`);

  console.log("\n=== Phase 4 Tests Passed Successfully! ===");
}

runPhase4Tests().catch((err) => {
  console.error("\n*** Test execution failed: ***", err);
  process.exit(1);
});
