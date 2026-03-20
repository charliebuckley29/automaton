import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error("Missing required environment variable: ANTHROPIC_API_KEY");
}

const anthropic = new Anthropic({ apiKey });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Message {
  role: "user" | "assistant";
  content: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a single interview response (voice agent turn).
 * Uses Opus for nuanced conversation. Kept short for voice latency.
 */
export async function generateInterviewResponse(
  systemPrompt: string,
  messages: Message[],
): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-5-20250514",
    max_tokens: 300,
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

/**
 * Generate the full report analysis from transcript + research.
 * Uses Opus for high-quality strategic analysis.
 */
export async function generateReportAnalysis(
  systemPrompt: string,
  messages: Message[],
): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-5-20250514",
    max_tokens: 8000,
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

/**
 * Generate the agent briefing document from research data.
 */
export async function generateBriefing(systemPrompt: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-5-20250514",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: "user", content: "Generate the briefing." }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

/**
 * Lightweight social media / online-presence analysis.
 */
export async function generateSocialAnalysis(prompt: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

/**
 * Scorecard / quick-evaluation analysis.
 */
export async function generateScorecardAnalysis(
  prompt: string,
): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}
