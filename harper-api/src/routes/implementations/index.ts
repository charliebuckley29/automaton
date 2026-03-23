import { Router, Request, Response } from "express";
import { supabase } from "../../services/supabase.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

// ---------------------------------------------------------------------------
// POST /implementations/request
// Request Harper to implement a tool recommendation.
// ---------------------------------------------------------------------------

router.post("/request", requireAuth, async (req: Request, res: Response) => {
  try {
    const { recommendation_id, notes } = req.body;
    const userId = req.user!.id;

    if (!recommendation_id) {
      res.status(400).json({ error: "recommendation_id is required" });
      return;
    }

    // Fetch the recommendation
    const { data: recommendation, error: recError } = await supabase
      .from("tool_recommendations")
      .select("id, business_id, tool_name, tool_category, harper_can_implement, implementation_product")
      .eq("id", recommendation_id)
      .single();

    if (recError || !recommendation) {
      res.status(404).json({ error: "Recommendation not found" });
      return;
    }

    // Verify user is a member of the business
    const { data: membership, error: memError } = await supabase
      .from("business_members")
      .select("business_id")
      .eq("business_id", recommendation.business_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (memError || !membership) {
      res.status(403).json({ error: "You do not have access to this business" });
      return;
    }

    // Verify Harper can implement this tool
    if (!recommendation.harper_can_implement) {
      res.status(400).json({ error: "This recommendation is not eligible for Harper implementation" });
      return;
    }

    // Create a business_interaction record
    const { data: interaction, error: intError } = await supabase
      .from("business_interactions")
      .insert({
        business_id: recommendation.business_id,
        user_id: userId,
        interaction_type: "project",
        reference_id: recommendation.id,
        summary: `Implementation request: ${recommendation.tool_name}`,
        key_findings: notes ? { notes } : null,
        new_intelligence: {
          tool_name: recommendation.tool_name,
          tool_category: recommendation.tool_category,
          implementation_product: recommendation.implementation_product,
          status: "requested",
        },
      })
      .select()
      .single();

    if (intError || !interaction) {
      console.error("[implementations/request] Error creating interaction:", intError);
      res.status(500).json({ error: "Failed to create implementation request" });
      return;
    }

    res.json({ interaction });
  } catch (err) {
    console.error("[implementations/request] Error:", err);
    res.status(500).json({ error: "Failed to create implementation request" });
  }
});

// ---------------------------------------------------------------------------
// GET /implementations/list
// Get all implementation requests for user's businesses.
// ---------------------------------------------------------------------------

router.get("/list", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get businesses the user is a member of
    const { data: memberships, error: memError } = await supabase
      .from("business_members")
      .select("business_id")
      .eq("user_id", userId);

    if (memError) {
      console.error("[implementations/list] membership query error:", memError);
      res.status(500).json({ error: "Failed to fetch memberships" });
      return;
    }

    const businessIds = (memberships ?? []).map((m) => m.business_id);

    if (businessIds.length === 0) {
      res.json({ implementations: [] });
      return;
    }

    // Query business_interactions that are projects, joined with tool_recommendations
    const { data: interactions, error: intError } = await supabase
      .from("business_interactions")
      .select("id, business_id, summary, key_findings, new_intelligence, created_at, updated_at, reference_id, tool_recommendations(id, tool_name, tool_category, status)")
      .eq("interaction_type", "project")
      .in("business_id", businessIds)
      .order("created_at", { ascending: false });

    if (intError) {
      console.error("[implementations/list] query error:", intError);
      res.status(500).json({ error: "Failed to fetch implementations" });
      return;
    }

    res.json({ implementations: interactions ?? [] });
  } catch (err) {
    console.error("[implementations/list] Error:", err);
    res.status(500).json({ error: "Failed to fetch implementations" });
  }
});

// ---------------------------------------------------------------------------
// PATCH /implementations/:id/status
// Update implementation status (admin only).
// ---------------------------------------------------------------------------

router.patch("/:id/status", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user!.id;

    if (!status) {
      res.status(400).json({ error: "status is required" });
      return;
    }

    // Validate admin via profiles.is_admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (profileError || !profile || !profile.is_admin) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    // Build the update payload
    const updatePayload: Record<string, unknown> = {
      summary: notes ? `Implementation request - ${status}` : undefined,
      new_intelligence: { status },
    };

    if (notes) {
      updatePayload.key_findings = { notes, updated_by: userId, updated_at: new Date().toISOString() };
    }

    // Remove undefined fields
    Object.keys(updatePayload).forEach((key) => {
      if (updatePayload[key] === undefined) delete updatePayload[key];
    });

    const { data: updated, error: updateError } = await supabase
      .from("business_interactions")
      .update(updatePayload)
      .eq("id", id)
      .eq("interaction_type", "project")
      .select()
      .single();

    if (updateError || !updated) {
      console.error("[implementations/:id/status] update error:", updateError);
      res.status(404).json({ error: "Implementation request not found" });
      return;
    }

    res.json({ interaction: updated });
  } catch (err) {
    console.error("[implementations/:id/status] Error:", err);
    res.status(500).json({ error: "Failed to update implementation status" });
  }
});

export default router;
