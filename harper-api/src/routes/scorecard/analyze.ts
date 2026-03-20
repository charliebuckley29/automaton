import { Router, Request, Response } from "express";
import { supabase } from "../../services/supabase.js";
import { generateScorecardAnalysis } from "../../services/claude.js";
import { syncContact } from "../../services/airtable.js";

const router = Router();

// ---------------------------------------------------------------------------
// POST /scorecard/analyze
// Free lead magnet: 15-question scorecard → instant score + 3 recommendations.
// No auth required — this is the top of funnel.
// ---------------------------------------------------------------------------

router.post("/analyze", async (req: Request, res: Response) => {
  const {
    email,
    full_name,
    business_name,
    business_type,
    country,
    answers,
    utm_source,
    utm_medium,
    utm_campaign,
  } = req.body as {
    email: string;
    full_name?: string;
    business_name?: string;
    business_type?: string;
    country?: string;
    answers: Record<string, unknown>;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };

  if (!email || !answers) {
    res.status(400).json({ error: "email and answers are required" });
    return;
  }

  try {
    // 1. Generate scorecard analysis via Claude Haiku
    const prompt = buildScorecardPrompt(answers, business_type);
    const raw = await generateScorecardAnalysis(prompt);

    let analysis: {
      overall_score: number;
      category_scores: Record<string, number>;
      recommendations: Array<{
        title: string;
        description: string;
        impact: string;
      }>;
      headline: string;
      summary: string;
    };

    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();
      analysis = JSON.parse(jsonStr);
    } catch {
      console.error("[scorecard] Failed to parse analysis");
      res.status(500).json({ error: "Scorecard analysis failed" });
      return;
    }

    // 2. Create or update lead record
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    let leadId: string;

    if (existingLead) {
      await supabase
        .from("leads")
        .update({
          full_name,
          business_name,
          business_type,
          country,
          scorecard_score: analysis.overall_score,
          scorecard_answers: { answers, analysis },
          utm_source,
          utm_medium,
          utm_campaign,
        })
        .eq("id", existingLead.id);
      leadId = existingLead.id;
    } else {
      const { data: newLead, error: leadError } = await supabase
        .from("leads")
        .insert({
          email,
          full_name,
          business_name,
          business_type,
          country,
          scorecard_score: analysis.overall_score,
          scorecard_answers: { answers, analysis },
          utm_source,
          utm_medium,
          utm_campaign,
          status: "new",
        })
        .select()
        .single();

      if (leadError || !newLead) {
        console.error("[scorecard] Failed to create lead:", leadError);
        res.status(500).json({ error: "Failed to save scorecard" });
        return;
      }
      leadId = newLead.id;
    }

    // 3. Sync to Airtable CRM (non-blocking)
    syncContact({
      email,
      fullName: full_name,
      businessName: business_name,
      businessType: business_type,
      country,
      source: "scorecard",
      status: "Lead",
    }).catch((err) => console.error("[scorecard] Airtable sync failed:", err));

    // 4. Trigger email sequence via internal endpoint (non-blocking)
    fetch(`${process.env.API_BASE_URL ?? "http://localhost:8080"}/email/scorecard-completed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: leadId }),
    }).catch((err) => console.error("[scorecard] Email trigger failed:", err));

    // 5. Return results immediately
    res.json({
      score: analysis.overall_score,
      category_scores: analysis.category_scores,
      recommendations: analysis.recommendations.slice(0, 3),
      headline: analysis.headline,
      summary: analysis.summary,
      lead_id: leadId,
    });
  } catch (err) {
    console.error("[scorecard/analyze] Error:", err);
    res.status(500).json({ error: "Scorecard analysis failed" });
  }
});

// ---------------------------------------------------------------------------
// Scorecard prompt builder
// ---------------------------------------------------------------------------

function buildScorecardPrompt(
  answers: Record<string, unknown>,
  businessType?: string,
): string {
  return `You are Harper Automation's AI readiness scorecard engine.

A ${businessType ?? "small business"} owner has completed a 15-question self-assessment.
Analyze their answers and provide an honest, specific score with actionable recommendations.

═══════════════════════════════════════
SCORECARD ANSWERS:
${JSON.stringify(answers, null, 2)}
═══════════════════════════════════════

Return JSON only:
{
  "overall_score": 0-100,
  "category_scores": {
    "digital_presence": 0-100,
    "operations": 0-100,
    "marketing": 0-100,
    "ai_readiness": 0-100,
    "growth_potential": 0-100
  },
  "recommendations": [
    {
      "title": "Short action title",
      "description": "2-3 sentences explaining what to do and why, specific to their answers",
      "impact": "What they can expect if they act on this"
    }
  ],
  "headline": "One punchy sentence summarising their situation — be honest, not flattering",
  "summary": "3-4 sentence honest assessment of where they stand"
}

Be direct. If their score is low, say so. Generic recommendations are a failure — every recommendation must reference something from their answers.`;
}

export default router;
