import { Router, Request, Response } from "express";
import { supabase } from "../../services/supabase.js";
import { generateReportAnalysis } from "../../services/claude.js";
import { buildIntelligenceUpdatePrompt } from "../../prompts/intelligence.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

// ---------------------------------------------------------------------------
// POST /intelligence/update
// Called after every report completion to update the business intelligence record.
// ---------------------------------------------------------------------------

router.post("/update", requireAuth, async (req: Request, res: Response) => {
  const { business_id, interaction_type, interaction_data } = req.body as {
    business_id: string;
    interaction_type: string;
    interaction_data: Record<string, unknown>;
  };

  if (!business_id || !interaction_type || !interaction_data) {
    res.status(400).json({
      error: "business_id, interaction_type, and interaction_data are required",
    });
    return;
  }

  try {
    // 1. Load existing intelligence record
    const { data: existingIntel } = await supabase
      .from("business_intelligence")
      .select("*")
      .eq("business_id", business_id)
      .maybeSingle();

    // 2. Load recent interactions
    const { data: recentInteractions } = await supabase
      .from("business_interactions")
      .select("*")
      .eq("business_id", business_id)
      .order("created_at", { ascending: false })
      .limit(10);

    // 3. Build prompt and call Claude
    const systemPrompt = buildIntelligenceUpdatePrompt({
      existingIntelligence: existingIntel,
      recentInteractions: recentInteractions ?? [],
      newInteractionType: interaction_type,
      newInteractionData: interaction_data,
    });

    const raw = await generateReportAnalysis(systemPrompt, [
      {
        role: "user",
        content: "Analyze this interaction and update the business intelligence record. Return JSON only.",
      },
    ]);

    // 4. Parse Claude's response
    let update: Record<string, unknown>;
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();
      update = JSON.parse(jsonStr);
    } catch {
      console.error("[intelligence/update] Failed to parse Claude response");
      res.status(500).json({ error: "Failed to parse intelligence update" });
      return;
    }

    const fieldsToUpdate = (update.fields_to_update ?? {}) as Record<string, unknown>;

    // 5. Upsert intelligence record
    const intelligenceRecord = {
      business_id,
      ...fieldsToUpdate,
      updated_at: new Date().toISOString(),
    };

    if (existingIntel) {
      await supabase
        .from("business_intelligence")
        .update(intelligenceRecord)
        .eq("business_id", business_id);
    } else {
      await supabase
        .from("business_intelligence")
        .insert(intelligenceRecord);
    }

    // 6. Update business summary fields
    await supabase
      .from("businesses")
      .update({
        intelligence_summary: update.intelligence_summary as string,
        last_intelligence_update: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", business_id);

    // 7. Log the interaction
    await supabase.from("business_interactions").insert({
      business_id,
      user_id: req.user!.id,
      interaction_type,
      summary: update.new_interaction_summary as string,
      key_findings: update.new_intelligence_added,
      new_intelligence: update,
    });

    // 8. Update ICP fit score and priority segment
    if (update.icp_fit_score !== undefined || update.priority_segment) {
      const intelUpdate: Record<string, unknown> = {};
      if (update.icp_fit_score !== undefined) {
        intelUpdate.icp_fit_score = update.icp_fit_score;
      }
      if (update.priority_segment) {
        intelUpdate.priority_segment = update.priority_segment;
      }
      if (update.next_best_action) {
        intelUpdate.next_best_action = update.next_best_action;
        intelUpdate.next_best_action_reason = update.next_best_action_reason;
      }

      await supabase
        .from("business_intelligence")
        .update(intelUpdate)
        .eq("business_id", business_id);
    }

    res.json({
      message: "Intelligence updated",
      intelligence_summary: update.intelligence_summary,
      new_intelligence: update.new_intelligence_added,
      priority_segment: update.priority_segment,
      next_best_action: update.next_best_action,
    });
  } catch (err) {
    console.error("[intelligence/update] Error:", err);
    res.status(500).json({ error: "Intelligence update failed" });
  }
});

// ---------------------------------------------------------------------------
// GET /intelligence/:businessId
// Retrieve the current intelligence record for a business.
// ---------------------------------------------------------------------------

router.get("/:businessId", requireAuth, async (req: Request, res: Response) => {
  const { businessId } = req.params;

  try {
    const { data: intel, error } = await supabase
      .from("business_intelligence")
      .select("*")
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    if (!intel) {
      res.json({ message: "No intelligence record yet", data: null });
      return;
    }

    res.json({ data: intel });
  } catch (err) {
    console.error("[intelligence/get] Error:", err);
    res.status(500).json({ error: "Failed to retrieve intelligence" });
  }
});

export default router;
