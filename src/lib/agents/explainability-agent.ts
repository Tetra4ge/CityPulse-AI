import { generateContent, isLLMAvailable } from "../ai-client";
import { 
  ForecastOutput, 
  TriageOutput, 
  ResourceOutput, 
  DecisionOutput, 
  ReflectionOutput,
  ExplainabilityOutput 
} from "../types/agent-schemas";

export async function explain(
  forecastResult: ForecastOutput,
  triageResult: TriageOutput,
  resourceResult: ResourceOutput,
  decisionResult: DecisionOutput,
  reflectionResult: ReflectionOutput,
  zone: string
): Promise<ExplainabilityOutput> {
  console.log(`[Explainability Agent] Generating trace report for zone: ${zone}`);

  if (!isLLMAvailable()) {
    throw new Error("No LLM API key configured");
  }

  const contextData = {
    zone,
    inputs: {
      forecast: forecastResult,
      triage: triageResult,
      resource: resourceResult
    },
    outputs: {
      decision: decisionResult,
      reflection: reflectionResult
    }
  };

  const prompt = `
    System Role: You are the CityPulse Explainability Agent.
    Objective: Create a transparent, human-readable "Trace Report" that explains EXACTLY how the AI arrived at the current decision. 
    Constraints: 
    - The output MUST be valid JSON.
    - Do not hallucinate data; use only the context provided.
    - Return a JSON object with 'trace_report' (a detailed 3-4 sentence explanation) and 'key_metrics' (an array of 3-4 key data points that drove the decision).

    Analyze the following LangGraph state context and generate the trace:
    ${JSON.stringify(contextData, null, 2)}
  `;

  try {
    const result = await generateContent(prompt, { jsonMode: true, temperature: 0.1 });
    const object = JSON.parse(result.text);
    return object as ExplainabilityOutput;
  } catch (err) {
    console.error("LLM failed to generate explainability output:", err);
    
    // Fallback if API fails
    return {
      trace_report: `[Fallback Trace] Decision reached Risk Level: ${decisionResult.risk_level}. Forecast AQI: ${forecastResult.predicted_aqi}. Resource Bottlenecks: ${resourceResult.bottlenecks.join(", ") || "None"}.`,
      key_metrics: [
        `AQI: ${forecastResult.predicted_aqi}`, 
        `Severity: ${triageResult.severity_signal}`
      ],
      _mock: true
    };
  }
}
