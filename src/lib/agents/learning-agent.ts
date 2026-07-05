import { GoogleGenerativeAI } from "@google/generative-ai";
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenerativeAI(apiKey);
  const model = ai.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.1
    }
  });

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
    const result = await model.generateContent(prompt);
    const extractedRule = (await result.response).text().trim();

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
    console.error("Gemini failed to generate heuristic:", err);
    throw err;
  }
}
