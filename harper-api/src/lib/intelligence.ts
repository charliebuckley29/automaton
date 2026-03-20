/**
 * Business intelligence functions.
 * updateBusinessIntelligence() — called after every report completion.
 * determineInterviewFormat() — determines the interview style for returning businesses.
 */

import { supabase } from "../services/supabase.js";
import { generateReportAnalysis } from "../services/claude.js";
import { buildIntelligenceUpdatePrompt } from "../prompts/intelligence.js";

export type InterviewFormat = "first_time" | "progress" | "deeper_dive" | "focused";

interface InterviewFormatResult {
  format: InterviewFormat;
  openingLine: string;
  primaryFocus?: string;
}

/**
 * Determines the interview format for a business session.
 * Per Section 5.2 of the architecture doc.
 */
export async function determineInterviewFormat(
  businessId: string,
  reportType?: string,
): Promise<InterviewFormatResult> {
  // Load prior completed sessions
  const { data: priorSessions } = await supabase
    .from("report_sessions")
    .select("id, report_type, created_at")
    .eq("business_id", businessId)
    .eq("status", "complete")
    .order("created_at", { ascending: false });

  if (!priorSessions || priorSessions.length === 0) {
    return {
      format: "first_time",
      openingLine: "",
    };
  }

  // Load the most recent report's analysis
  const lastSession = priorSessions[0];
  const { data: lastReport } = await supabase
    .from("reports")
    .select("report_json, score_overall, recommended_next_step, created_at")
    .eq("session_id", lastSession.id)
    .maybeSingle();

  // Load intelligence record for unresolved threads
  const { data: intel } = await supabase
    .from("business_intelligence")
    .select("recommendations_made, recommendations_acted_on, known_pain_points, next_best_action")
    .eq("business_id", businessId)
    .maybeSingle();

  const daysSinceLastReport = lastReport
    ? Math.floor(
        (Date.now() - new Date(lastReport.created_at).getTime()) / (1000 * 60 * 60 * 24),
      )
    : 999;

  // Focused: specific product purchased or explicit focus area
  if (reportType === "tech_stack_audit") {
    return {
      format: "focused",
      primaryFocus: "technology and tools",
      openingLine:
        "You've got your background on file — let's go straight into your tech stack and how your systems are working together.",
    };
  }

  if (reportType === "franchise_intelligence") {
    return {
      format: "focused",
      primaryFocus: "franchise operations and multi-location consistency",
      openingLine:
        "You've got your background on file — let's go straight into how things are working across your locations.",
    };
  }

  // Deeper dive: significant unresolved thread from last time
  const unresolvedPainPoints = (intel?.known_pain_points as Array<{ point: string; resolved: boolean }> ?? [])
    .filter((p) => !p.resolved);

  const recommendations = intel?.recommendations_made as Array<{ rec: string; status: string }> ?? [];
  const unresolvedRecs = recommendations.filter(
    (r) => r.status !== "acted_on" && r.status !== "declined",
  );

  if (unresolvedPainPoints.length >= 2 || unresolvedRecs.length >= 3) {
    const focusTopic = unresolvedPainPoints[0]?.point ?? unresolvedRecs[0]?.rec ?? "key areas";
    return {
      format: "deeper_dive",
      primaryFocus: focusTopic,
      openingLine: `When we spoke last time, you mentioned ${focusTopic} — I want to start there and go deeper on it.`,
    };
  }

  // Progress: 60+ days since last report, returning for an update
  if (daysSinceLastReport >= 60) {
    const months = Math.floor(daysSinceLastReport / 30);
    return {
      format: "progress",
      openingLine: `Welcome back. It's been about ${months} month${months !== 1 ? "s" : ""} since your last report. Let's start with what's changed.`,
    };
  }

  // Default for recent returning: shorter progress check
  return {
    format: "progress",
    openingLine:
      "Welcome back. Let's start with what you've acted on since last time and what's changed.",
  };
}

/**
 * Updates the business intelligence record after a report is completed.
 * This is the core "memory" function — it compounds intelligence over time.
 */
export async function updateBusinessIntelligence(params: {
  businessId: string;
  userId: string;
  interactionType: string;
  interactionData: Record<string, unknown>;
}): Promise<void> {
  const { businessId, userId, interactionType, interactionData } = params;

  try {
    // 1. Load existing intelligence
    const { data: existingIntel } = await supabase
      .from("business_intelligence")
      .select("*")
      .eq("business_id", businessId)
      .maybeSingle();

    // 2. Load recent interactions
    const { data: recentInteractions } = await supabase
      .from("business_interactions")
      .select("interaction_type, summary, key_findings, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(10);

    // 3. Call Claude to reconcile intelligence
    const systemPrompt = buildIntelligenceUpdatePrompt({
      existingIntelligence: existingIntel,
      recentInteractions: recentInteractions ?? [],
      newInteractionType: interactionType,
      newInteractionData: interactionData,
    });

    const raw = await generateReportAnalysis(systemPrompt, [
      {
        role: "user",
        content: "Update the intelligence record with this new interaction data. Return JSON only.",
      },
    ]);

    // 4. Parse response
    let update: Record<string, unknown>;
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();
      update = JSON.parse(jsonStr);
    } catch {
      console.error("[intelligence] Failed to parse Claude response for business:", businessId);
      return;
    }

    const fieldsToUpdate = (update.fields_to_update ?? {}) as Record<string, unknown>;

    // 5. Upsert intelligence record
    const record = {
      business_id: businessId,
      ...fieldsToUpdate,
      icp_fit_score: update.icp_fit_score as number | undefined,
      priority_segment: update.priority_segment as string | undefined,
      next_best_action: update.next_best_action as string | undefined,
      next_best_action_reason: update.next_best_action_reason as string | undefined,
      updated_at: new Date().toISOString(),
    };

    if (existingIntel) {
      await supabase
        .from("business_intelligence")
        .update(record)
        .eq("business_id", businessId);
    } else {
      await supabase.from("business_intelligence").insert(record);
    }

    // 6. Update business summary
    await supabase
      .from("businesses")
      .update({
        intelligence_summary: update.intelligence_summary as string,
        last_intelligence_update: new Date().toISOString(),
      })
      .eq("id", businessId);

    // 7. Log interaction
    await supabase.from("business_interactions").insert({
      business_id: businessId,
      user_id: userId,
      interaction_type: interactionType,
      summary: update.new_interaction_summary as string,
      key_findings: update.new_intelligence_added,
      new_intelligence: update,
    });

    console.log(`[intelligence] Updated intelligence for business ${businessId}`);
  } catch (err) {
    console.error("[intelligence] updateBusinessIntelligence error:", err);
  }
}
