import { createOpenAI } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";

// Provider-agnostic, OpenAI-compatible. Defaults to Groq (open Llama, fast, Vercel-friendly).
// Swap providers with env only: AI_BASE_URL / AI_MODEL / AI_API_KEY (e.g. Together, OpenRouter,
// or a local Ollama at http://localhost:11434/v1 in dev). Server-only — the key never ships to a client.

export class AINotConfiguredError extends Error {
  constructor() {
    super("AI not configured");
    this.name = "AINotConfiguredError";
  }
}

export const isAIConfigured = () => !!process.env.AI_API_KEY;

const MODEL = process.env.AI_MODEL || "llama-3.1-8b-instant";

function model() {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new AINotConfiguredError();
  const baseURL = process.env.AI_BASE_URL || "https://api.groq.com/openai/v1";
  return createOpenAI({ apiKey, baseURL })(MODEL);
}

export async function aiGenerate(opts: {
  system?: string;
  prompt: string;
  maxOutputTokens?: number;
}): Promise<string> {
  const { text } = await generateText({
    model: model(),
    system: opts.system,
    prompt: opts.prompt,
    temperature: 0.4,
    maxOutputTokens: opts.maxOutputTokens ?? 900,
  });
  return text;
}

/** Returns a streaming text/plain Response for the client to read incrementally. */
export function aiStreamResponse(opts: {
  system?: string;
  prompt: string;
  maxOutputTokens?: number;
}): Response {
  const result = streamText({
    model: model(),
    system: opts.system,
    prompt: opts.prompt,
    temperature: 0.5,
    maxOutputTokens: opts.maxOutputTokens ?? 700,
  });
  return result.toTextStreamResponse();
}
