/**
 * Agent briefing generation prompt.
 * Called after research completes, before interview begins.
 */

interface BriefingPromptParams {
  intakeData: Record<string, unknown>;
  websiteAnalysis: Record<string, unknown> | null;
  socialAnalysis: Record<string, unknown> | null;
  seoData: Record<string, unknown> | null;
  techStack: Record<string, unknown> | null;
  priorHistory: string;
}

export function buildBriefingPrompt(params: BriefingPromptParams): string {
  return `You are preparing a pre-interview briefing for the Harper voice agent.
The agent will use this to conduct an intelligent, specific interview
rather than starting from zero.

Write it like a consultant's pre-meeting notes: concise, specific,
flagging what to probe and what to watch for.

════════════════════════════
INTAKE FORM DATA:
${JSON.stringify(params.intakeData, null, 2)}
════════════════════════════
WEBSITE ANALYSIS:
${params.websiteAnalysis ? JSON.stringify(params.websiteAnalysis, null, 2) : 'Not available'}
════════════════════════════
SOCIAL ANALYSIS:
${params.socialAnalysis ? JSON.stringify(params.socialAnalysis, null, 2) : 'Not available'}
════════════════════════════
SEO DATA:
${params.seoData ? JSON.stringify(params.seoData, null, 2) : 'Not available'}
════════════════════════════
TECH STACK:
${params.techStack ? JSON.stringify(params.techStack, null, 2) : 'Not available'}
════════════════════════════
PRIOR HISTORY (if returning):
${params.priorHistory || 'First-time client — no prior interactions.'}
════════════════════════════

Return JSON only:
{
  "business_snapshot": "3–4 sentences. What this business is and where it stands.",

  "what_we_know": {
    "strengths": ["specific strength from research"],
    "concerns": ["specific concern"],
    "gaps": ["something notably absent"]
  },

  "digital_presence_summary": "2–3 honest sentences",
  "website_verdict": "1–2 honest sentences",
  "social_verdict": "1–2 honest sentences",
  "seo_verdict": "1–2 honest sentences",

  "things_to_probe": [
    {
      "topic": "what to probe",
      "why": "what we noticed",
      "suggested_question": "a specific question, not generic"
    }
  ],

  "assumed_context": {
    "tech_awareness": "low | medium | high",
    "marketing_sophistication": "low | medium | high",
    "ai_familiarity": "low | medium | high",
    "budget_sensitivity": "cost-conscious | pragmatic | budget-not-primary"
  },

  "watch_for": [
    "something to navigate carefully — e.g. bad prior agency experience mentioned"
  ],

  "interview_questions_bank": [
    {
      "area": "website | socials | seo | operations | marketing | goals | budget | ai",
      "question": "specific question from research findings",
      "context": "why this question, what we noticed"
    }
  ],

  "hypothesised_biggest_opportunity": "Based on research alone — to be validated in interview",

  "opening_line": "Specific first thing the agent should say, referencing something from research"
}`;
}
