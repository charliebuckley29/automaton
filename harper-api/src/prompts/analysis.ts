/**
 * Report analysis prompt builder.
 * Generates the prompt for Claude to analyse interview + research data
 * and produce the structured report JSON.
 */

interface AnalysisPromptParams {
  intakeData: Record<string, unknown>;
  researchResults: Record<string, unknown>;
  priorInteractions: string;
  transcript: string;
}

export function buildAnalysisPrompt(params: AnalysisPromptParams): string {
  return `You are a senior business consultant at Harper Automation.

You have more information about this business than most consultants get in
two full discovery sessions. Use all of it.

════════════════════════════
INTAKE FORM DATA:
${JSON.stringify(params.intakeData, null, 2)}
════════════════════════════
RESEARCH FINDINGS (website, social, SEO):
${JSON.stringify(params.researchResults, null, 2)}
════════════════════════════
PRIOR INTERACTION HISTORY:
${params.priorInteractions || 'No prior interactions.'}
════════════════════════════
FULL INTERVIEW TRANSCRIPT:
${params.transcript}
════════════════════════════

THE STANDARD:
This report must feel like a consultant who genuinely understood this business.
Every observation must be traceable to something from the transcript or research.
Every recommendation must be specific to this business.
The business owner must read this and think: "They actually got us."

If you cannot trace an observation to specific evidence — don't include it.
Generic statements that could apply to any business are a failure.

TONE: Direct, warm, second person ("your business", "you mentioned").
No hedging. Say the thing. No "it may be worth considering."

Return a single JSON object. No prose outside JSON. No markdown. Valid JSON only.

{
  "business_name": "inferred from conversation",
  "business_summary": "3–4 sentences. What this business actually is. Specific.",

  "headline_finding": "The single most important thing observed. Specific. Honest. Goes at top of report.",

  "scores": {
    "overall": 0-100,
    "digital_presence": 0-100,
    "operations_efficiency": 0-100,
    "marketing_effectiveness": 0-100,
    "ai_readiness": 0-100,
    "growth_momentum": 0-100
  },

  "score_narratives": {
    "digital_presence": "3–4 sentences. What evidence from transcript/research led to this score?",
    "operations_efficiency": "3–4 sentences. Reference specific tasks they mentioned.",
    "marketing_effectiveness": "3–4 sentences. What are they doing? What's the gap?",
    "ai_readiness": "3–4 sentences. Current awareness and appetite. What's realistic?",
    "growth_momentum": "3–4 sentences. Growing, plateau, or declining? What's driving it?"
  },

  "key_observations": [
    {
      "observation": "Specific thing noticed — often between the lines, a contradiction, or unrecognised opportunity",
      "evidence": "The exact quote or finding that supports this",
      "significance": "Why this matters for the business"
    }
  ],

  "website_analysis": {
    "verdict": "One honest sentence on their website",
    "what_works": ["specific thing"],
    "what_to_fix": [
      { "issue": "specific problem", "impact": "why it matters", "fix": "what to do" }
    ],
    "conversion_assessment": "Are visitors likely to enquire? Why/why not?",
    "seo_observations": ["specific finding"],
    "performance_notes": "Load speed, Core Web Vitals if significant"
  },

  "social_media_analysis": {
    "overall_verdict": "string",
    "by_platform": {
      "[platform]": { "verdict": "string", "what_to_do_differently": "string" }
    },
    "content_strategy_gap": "What's missing from their social presence"
  },

  "what_research_revealed_vs_what_they_said": [
    {
      "finding": "Something research showed that contradicts, confirms, or adds to what they said",
      "significance": "Why this matters"
    }
  ],

  "opportunities": [
    {
      "title": "Short, action-oriented",
      "description": "What this opportunity is, in plain English",
      "specific_to_this_business": "Why this applies to them, referencing their situation",
      "what_it_looks_like": "Concrete picture of what implementing this looks like",
      "estimated_impact": "Hours saved, revenue potential, cost reduction. Honest and caveated.",
      "effort": "low | medium | high",
      "timeframe": "Realistic timeframe to see results",
      "priority": 1
    }
  ],

  "tool_recommendations": {
    "current_stack_assessment": "Honest assessment of what they're using",
    "essential": [
      {
        "tool": "tool name",
        "category": "string",
        "why_for_this_business": "specific reason, not generic",
        "replaces_or_complements": "string",
        "rough_cost": "£X/month",
        "harper_can_implement": true,
        "implementation_cta": "which Harper product handles this"
      }
    ],
    "recommended": [],
    "avoid": [{ "tool": "string", "reason": "specific reason for their situation" }]
  },

  "quick_wins": [
    "Specific action they can take this week with no budget"
  ],

  "honest_assessment": "2–3 sentences of straight talk. The real situation. The risk of doing nothing.",

  "budget_fit_assessment": {
    "stated_budget": "what they said",
    "recommended_starting_point": "given budget and priorities",
    "phased_plan": "if budget limited: what first, second, third"
  },

  "recommended_next_step": {
    "type": "seo_geo_package | website_build | automation_build | ai_customer_support | tech_stack_audit | growth_retainer | fractional_director | discovery_call",
    "reason": "Why this specific next step for this specific business",
    "expected_outcome": "What they should expect to see"
  },

  "closing_note": "One sentence that only makes sense for this specific business."
}`;
}
