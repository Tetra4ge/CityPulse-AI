import { generateContent, isLLMAvailable } from "../ai-client";
import { db } from "../db";
import { learnedHeuristics } from "../db/schema";
import crypto from "crypto";

export async function learnFromFeedback(
  zone: string,
  decisionId: string,
  originalRisk: string,
  humanFeedback: string,
  contextData: any
): Promise<string> {
  console.log(`[Learning Agent] Processing feedback for decision ${decisionId}`);

  if (!isLLMAvailable()) {
    throw new Error("No LLM API key configured");
  }

  const prompt = `
    System Role: You are the CityPulse Feedback & Learning Agent.
    Objective: Extract a reusable policy rule (heuristic) from human feedback.
    
    Context of Rejected Decision:
    - Zone: ${zone}
    - Original Computed Risk: ${originalRisk}
    - Data Context: ${JSON.stringify(contextData)}
    
    Human Feedback: "${humanFeedback}"
    
    Instruction:
    Synthesize a single, clear, 1-2 sentence rule that the Decision Agent MUST follow in the future based on this feedback. 
    Make it generalized (e.g. "If AQI is below X and hospital beds are above Y, risk must not exceed Medium.")
    Do not include markdown or conversational text. Just output the rule.
  `;

  try {
    const result = await generateContent(prompt, { temperature: 0.1 });
    const extractedRule = result.text;

    // Store the learned heuristic in the database
    await db.insert(learnedHeuristics).values({
      id: crypto.randomUUID(),
      zone,
      decisionId,
      originalRisk,
      humanFeedback,
      extractedRule
    });

    console.log(`[Learning Agent] New rule stored: ${extractedRule}`);
    return extractedRule;
  } catch (err) {
    console.error("LLM failed to generate heuristic:", err);
    throw err;
  }
}
