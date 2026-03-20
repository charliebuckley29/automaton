import { supabase } from "../services/supabase.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InterviewState {
  session_id: string;
  areas_covered: string[];
  turn_count: number;
  format: InterviewFormat;
  key_insights: string[];
  flagged_topics: string[];
  updated_at: string;
}

export type InterviewFormat =
  | "standard"        // First-time customer, full interview
  | "returning"       // Returning customer, shorter focused interview
  | "deep_dive";      // Extended interview for complex businesses

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SystemPromptParams {
  businessName: string;
  businessType: string;
  intakeData: Record<string, unknown> | null;
  researchBriefing: string | null;
  areasCovered: string[];
  turnCount: number;
  format: InterviewFormat;
}

// ---------------------------------------------------------------------------
// Interview areas that Harper should cover
// ---------------------------------------------------------------------------

const INTERVIEW_AREAS = [
  "business_overview",
  "target_audience",
  "current_marketing",
  "goals_and_challenges",
  "competitive_landscape",
  "budget_and_resources",
  "content_and_brand",
  "digital_presence",
  "customer_journey",
  "measurement_and_analytics",
] as const;

const AREA_KEYWORDS: Record<string, string[]> = {
  business_overview: [
    "business", "company", "founded", "started", "employees", "team",
    "revenue", "products", "services", "industry",
  ],
  target_audience: [
    "audience", "customers", "demographic", "ideal customer", "persona",
    "target market", "who buys", "client",
  ],
  current_marketing: [
    "marketing", "advertising", "ads", "campaigns", "email marketing",
    "social media", "content marketing", "SEO", "PPC", "paid",
  ],
  goals_and_challenges: [
    "goals", "objectives", "challenges", "pain points", "struggling",
    "want to achieve", "growth", "improve",
  ],
  competitive_landscape: [
    "competitors", "competition", "market", "differentiator", "unique",
    "stand out", "compared to",
  ],
  budget_and_resources: [
    "budget", "spend", "investment", "resources", "team size", "agency",
    "freelancer", "in-house",
  ],
  content_and_brand: [
    "brand", "messaging", "voice", "tone", "content", "blog", "video",
    "podcast", "story",
  ],
  digital_presence: [
    "website", "social media", "platforms", "online", "Google", "Facebook",
    "Instagram", "LinkedIn", "TikTok", "YouTube",
  ],
  customer_journey: [
    "funnel", "conversion", "leads", "sales process", "onboarding",
    "retention", "referral", "journey", "touchpoints",
  ],
  measurement_and_analytics: [
    "metrics", "KPIs", "analytics", "tracking", "ROI", "measure",
    "performance", "data", "reporting",
  ],
};

// ---------------------------------------------------------------------------
// Determine format based on prior interactions
// ---------------------------------------------------------------------------

/**
 * Checks if this business has completed interviews before and returns the
 * appropriate interview format.
 */
export async function determineInterviewFormat(
  businessId: string,
): Promise<InterviewFormat> {
  const { data: priorSessions, error } = await supabase
    .from("report_sessions")
    .select("id, status, created_at")
    .eq("business_id", businessId)
    .eq("status", "complete")
    .order("created_at", { ascending: false });

  if (error || !priorSessions) {
    return "standard";
  }

  if (priorSessions.length === 0) {
    return "standard";
  }

  // If the business has had 3+ reports, do a deep dive on new topics
  if (priorSessions.length >= 3) {
    return "deep_dive";
  }

  return "returning";
}

// ---------------------------------------------------------------------------
// Update interview state after each turn
// ---------------------------------------------------------------------------

/**
 * Analyzes the latest conversation exchange and updates the interview state
 * with newly covered areas and insights.
 */
export async function updateInterviewState(
  sessionId: string,
  messages: Message[],
  latestResponse: string,
): Promise<InterviewState> {
  // Load current state
  const { data: currentState } = await supabase
    .from("interview_state")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  const areasCovered = new Set<string>(currentState?.areas_covered ?? []);
  const keyInsights: string[] = currentState?.key_insights ?? [];
  const flaggedTopics: string[] = currentState?.flagged_topics ?? [];
  const turnCount = (currentState?.turn_count ?? 0) + 1;

  // Analyze the latest user message and response for covered areas
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const combinedText = [
    lastUserMessage?.content ?? "",
    latestResponse,
  ].join(" ").toLowerCase();

  for (const [area, keywords] of Object.entries(AREA_KEYWORDS)) {
    if (areasCovered.has(area)) continue;

    const matchCount = keywords.filter((kw) =>
      combinedText.includes(kw.toLowerCase()),
    ).length;

    // Require at least 2 keyword matches to mark an area as covered
    if (matchCount >= 2) {
      areasCovered.add(area);
    }
  }

  // Extract key insights (simple heuristic: look for strong statements)
  if (lastUserMessage) {
    const text = lastUserMessage.content;
    // Capture sentences that express clear opinions, numbers, or priorities
    const insightPatterns = [
      /our (?:biggest|main|primary) (?:challenge|goal|focus) is (.+?)[.!]/gi,
      /we (?:currently|already) (?:spend|invest|allocate) (.+?)[.!]/gi,
      /(?:\d+%|\$[\d,]+) (.+?)[.!]/gi,
    ];

    for (const pattern of insightPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        keyInsights.push(match[0].trim());
      }
    }
  }

  // Flag topics that need follow-up (e.g., vague answers)
  const vagueIndicators = [
    "i'm not sure",
    "i don't know",
    "we haven't really",
    "not really tracking",
    "haven't thought about",
  ];

  if (lastUserMessage) {
    const lower = lastUserMessage.content.toLowerCase();
    for (const indicator of vagueIndicators) {
      if (lower.includes(indicator)) {
        // Find which area this vagueness relates to
        for (const [area, keywords] of Object.entries(AREA_KEYWORDS)) {
          if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
            const flag = `Vague answer about ${area.replace(/_/g, " ")}`;
            if (!flaggedTopics.includes(flag)) {
              flaggedTopics.push(flag);
            }
            break;
          }
        }
      }
    }
  }

  // Upsert state
  const updatedState: InterviewState = {
    session_id: sessionId,
    areas_covered: [...areasCovered],
    turn_count: turnCount,
    format: currentState?.format ?? "standard",
    key_insights: keyInsights.slice(-20), // Keep last 20
    flagged_topics: flaggedTopics,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("interview_state")
    .upsert(updatedState, { onConflict: "session_id" });

  if (error) {
    console.error("[interview-state] Failed to update state:", error);
  }

  return updatedState;
}

// ---------------------------------------------------------------------------
// Build interview system prompt
// ---------------------------------------------------------------------------

/**
 * Assembles the full system prompt for the voice agent interview.
 */
export function buildInterviewSystemPrompt(params: SystemPromptParams): string {
  const {
    businessName,
    businessType,
    intakeData,
    researchBriefing,
    areasCovered,
    turnCount,
    format,
  } = params;

  const uncoveredAreas = INTERVIEW_AREAS.filter(
    (a) => !areasCovered.includes(a),
  ).map((a) => a.replace(/_/g, " "));

  const coveragePercent = Math.round(
    (areasCovered.length / INTERVIEW_AREAS.length) * 100,
  );

  // Determine target turn count based on format
  const targetTurns =
    format === "returning" ? 8 : format === "deep_dive" ? 20 : 14;

  const turnsRemaining = Math.max(0, targetTurns - turnCount);

  let prompt = `You are Harper, a friendly and insightful AI marketing consultant conducting a voice interview with the owner of "${businessName}" (${businessType}).

## Your Personality
- Warm, conversational, and professional
- You ask one question at a time
- You acknowledge and build on what the person says before moving to the next topic
- You use natural language suitable for voice — short sentences, no bullet points or markdown
- You occasionally share brief, relevant observations or insights based on what they tell you

## Interview Context
- Format: ${format}
- Turn: ${turnCount} of approximately ${targetTurns}
- Coverage: ${coveragePercent}% (${areasCovered.length}/${INTERVIEW_AREAS.length} areas)
- Remaining areas to cover: ${uncoveredAreas.join(", ") || "All areas covered"}
- Estimated turns remaining: ${turnsRemaining}
`;

  if (intakeData) {
    prompt += `
## Intake Information (provided before the call)
${JSON.stringify(intakeData, null, 2)}
`;
  }

  if (researchBriefing) {
    prompt += `
## Pre-Interview Research Briefing
${researchBriefing}

Use this research to ask informed, specific questions rather than generic ones. Reference what you found when relevant, e.g. "I noticed your website uses Shopify — how has that been working for you?"
`;
  }

  if (format === "returning") {
    prompt += `
## Returning Customer Instructions
This is a returning customer. Focus on what has changed since their last report. Ask about:
- Progress on previous recommendations
- New challenges or goals
- Changes in their market or audience
- Updated budget or resources
Keep the interview shorter and more focused.
`;
  }

  if (format === "deep_dive") {
    prompt += `
## Deep Dive Instructions
This is an experienced customer ready for advanced analysis. Go deeper on:
- Specific funnel metrics and conversion rates
- Advanced competitive positioning
- Content strategy details
- Attribution and multi-touch analytics
- Customer lifetime value and retention strategies
`;
  }

  prompt += `
## Pacing Rules
- If coverage is below 50% and you are past turn ${Math.floor(targetTurns * 0.6)}, start combining topics to cover more ground
- If all areas are covered OR you are at turn ${targetTurns}, begin wrapping up
- When wrapping up, summarize what you learned and thank them

## Completion Signal
When the interview is complete, end your FINAL response with the exact token: [INTERVIEW_COMPLETE]
Do NOT include this token until you have finished the wrap-up and said goodbye.

## Important
- Never break character — you are Harper, speaking on a voice call
- Do not use markdown formatting, emojis, or special characters
- Keep responses concise — under 3 sentences for most turns
- If the person goes off topic, gently steer back
- If you detect frustration or time pressure, skip to the most important uncovered areas`;

  return prompt;
}
