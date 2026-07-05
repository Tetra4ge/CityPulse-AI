import { runPipeline } from "../src/lib/orchestrator";
import { db } from "../src/lib/db";
import { decisions } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// Ensure environment variables are loaded
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  console.log("=== Phase 3: Testing Explainability & Orchestration ===");
  const zone = "Zone-A";
  const threadId = crypto.randomUUID();
  
  try {
    const finalState = await runPipeline(zone, threadId);
    console.log("\nPipeline paused for approval!");

    // Simulate Human Approval
    console.log("Simulating Human Approval and Resuming Pipeline...");
    const { appGraph } = await import("../src/lib/orchestrator/graph");
    await appGraph.invoke(null, { configurable: { thread_id: threadId } });
    console.log("Pipeline finished successfully!");

    // Fetch the decision from DB to verify traceReport was saved
    const dbDecision = await db.query.decisions.findFirst({
      where: eq(decisions.id, threadId)
    });

    if (dbDecision) {
      console.log("\n--- TRACE REPORT FOUND IN DB ---");
      console.log(dbDecision.traceReport);
      console.log("--------------------------------");
    } else {
      console.log("\n⚠️ Trace Report was NOT saved to the database!");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

main();
