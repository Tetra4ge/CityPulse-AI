/**
 * CityPulse AI — Centralized AI Client
 *
 * Provides a unified LLM interface that supports:
 *   1. OpenRouter (if OPENROUTER_API_KEY is set) — OpenAI-compatible API
 *   2. Google Gemini (if GEMINI_API_KEY is set) — Direct Google AI SDK
 *
 * All agents should use `generateContent()` from this module
 * instead of importing GoogleGenerativeAI directly.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

interface GenerateOptions {
  /** If true, instructs the model to return JSON */
  jsonMode?: boolean;
  /** Temperature for generation (0.0 - 2.0) */
  temperature?: number;
}

interface GenerateResult {
  text: string;
  provider: "openrouter" | "gemini" | "none";
}

/**
 * Check which LLM provider is available.
 * Priority: OpenRouter > Gemini
 */
function getProvider(): "openrouter" | "gemini" | "none" {
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "none";
}

/**
 * Generate content using the configured LLM provider.
 * Tries OpenRouter first (if key is set), then falls back to Gemini.
 */
export async function generateContent(
  prompt: string,
  options: GenerateOptions = {}
): Promise<GenerateResult> {
  const provider = getProvider();

  if (provider === "none") {
    throw new Error(
      "No LLM API key configured. Set either OPENROUTER_API_KEY or GEMINI_API_KEY in your .env.local file."
    );
  }

  if (provider === "openrouter") {
    return generateWithOpenRouter(prompt, options);
  }

  return generateWithGemini(prompt, options);
}

/**
 * Generate content via OpenRouter (OpenAI-compatible API).
 */
async function generateWithOpenRouter(
  prompt: string,
  options: GenerateOptions
): Promise<GenerateResult> {
  const apiKey = process.env.OPENROUTER_API_KEY!;
  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";

  const body: any = {
    model,
    messages: [{ role: "user", content: prompt }],
  };

  if (options.temperature !== undefined) {
    body.temperature = options.temperature;
  }

  if (options.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://citypulse-ai.app",
      "X-Title": "CityPulse AI",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim() || "";

  return { text, provider: "openrouter" };
}

/**
 * Generate content via Google Gemini (direct SDK).
 */
async function generateWithGemini(
  prompt: string,
  options: GenerateOptions
): Promise<GenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  const ai = new GoogleGenerativeAI(apiKey);

  const generationConfig: any = {};
  if (options.jsonMode) {
    generationConfig.responseMimeType = "application/json";
  }
  if (options.temperature !== undefined) {
    generationConfig.temperature = options.temperature;
  }

  const model = ai.getGenerativeModel({
    model: modelName,
    ...(Object.keys(generationConfig).length > 0 ? { generationConfig } : {}),
  });

  const result = await model.generateContent(prompt);
  const text = (await result.response).text().trim();

  return { text, provider: "gemini" };
}

/**
 * Check if any LLM provider is available.
 */
export function isLLMAvailable(): boolean {
  return getProvider() !== "none";
}

/**
 * Get the name of the active LLM provider for logging.
 */
export function getActiveProvider(): string {
  const provider = getProvider();
  if (provider === "openrouter") {
    return `OpenRouter (${process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free"})`;
  }
  if (provider === "gemini") {
    return `Gemini (${process.env.GEMINI_MODEL || "gemini-2.0-flash"})`;
  }
  return "None";
}
