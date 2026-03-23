import { Router, Request, Response } from "express";
import { supabase } from "../../services/supabase.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

// ---------------------------------------------------------------------------
// GET /agency/dashboard
// Returns agency dashboard data: packs, credits, recent sessions.
// ---------------------------------------------------------------------------

router.get("/dashboard", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get all bulk credit packs for user
    const { data: packs, error: packsError } = await supabase
      .from("bulk_credit_packs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (packsError) {
      console.error("[agency/dashboard] packs query error:", packsError);
      res.status(500).json({ error: "Failed to fetch credit packs" });
      return;
    }

    const packList = packs ?? [];
    const packIds = packList.map((p) => p.id);

    let sessions: any[] = [];

    if (packIds.length > 0) {
      const { data: sessionData, error: sessError } = await supabase
        .from("report_sessions")
        .select("*")
        .in("bulk_credit_id", packIds)
        .order("created_at", { ascending: false });

      if (sessError) {
        console.error("[agency/dashboard] sessions query error:", sessError);
      } else {
        sessions = sessionData ?? [];
      }
    }

    const totalCredits = packList.reduce((sum, p) => sum + (p.pack_size ?? 0), 0);
    const totalUsed = packList.reduce(
      (sum, p) => sum + ((p.pack_size ?? 0) - (p.credits_remaining ?? 0)),
      0,
    );

    res.json({
      total_credits: totalCredits,
      total_used: totalUsed,
      packs: packList,
      recent_sessions: sessions.slice(0, 50),
    });
  } catch (err) {
    console.error("[agency/dashboard] Error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// ---------------------------------------------------------------------------
// PUT /agency/white-label
// Update white-label configuration on a bulk credit pack.
// ---------------------------------------------------------------------------

router.put("/white-label", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { pack_id, config } = req.body;

    if (!pack_id || !config) {
      res.status(400).json({ error: "pack_id and config are required" });
      return;
    }

    const { logo_url, brand_colour, agency_name } = config;

    // Verify the pack belongs to the user
    const { data: pack, error: packError } = await supabase
      .from("bulk_credit_packs")
      .select("id, user_id")
      .eq("id", pack_id)
      .single();

    if (packError || !pack) {
      res.status(404).json({ error: "Credit pack not found" });
      return;
    }

    if (pack.user_id !== userId) {
      res.status(403).json({ error: "You do not own this credit pack" });
      return;
    }

    // Update white-label config
    const { data: updated, error: updateError } = await supabase
      .from("bulk_credit_packs")
      .update({
        white_label_config: {
          logo_url: logo_url ?? null,
          brand_colour: brand_colour ?? null,
          agency_name: agency_name ?? null,
        },
      })
      .eq("id", pack_id)
      .select()
      .single();

    if (updateError) {
      console.error("[agency/white-label] update error:", updateError);
      res.status(500).json({ error: "Failed to update white-label config" });
      return;
    }

    res.json({ pack: updated });
  } catch (err) {
    console.error("[agency/white-label] Error:", err);
    res.status(500).json({ error: "Failed to update white-label config" });
  }
});

// ---------------------------------------------------------------------------
// GET /agency/usage
// Credit usage history — report sessions linked to user's bulk credit packs.
// ---------------------------------------------------------------------------

router.get("/usage", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get all bulk credit packs for user
    const { data: packs, error: packsError } = await supabase
      .from("bulk_credit_packs")
      .select("id")
      .eq("user_id", userId);

    if (packsError) {
      console.error("[agency/usage] packs query error:", packsError);
      res.status(500).json({ error: "Failed to fetch credit packs" });
      return;
    }

    const packIds = (packs ?? []).map((p) => p.id);

    if (packIds.length === 0) {
      res.json({ usage: [] });
      return;
    }

    const { data: sessions, error: sessError } = await supabase
      .from("report_sessions")
      .select("id, customer_email, status, created_at, bulk_credit_id, business_id, businesses(name)")
      .in("bulk_credit_id", packIds)
      .order("created_at", { ascending: true });

    if (sessError) {
      console.error("[agency/usage] sessions query error:", sessError);
      res.status(500).json({ error: "Failed to fetch usage data" });
      return;
    }

    res.json({ usage: sessions ?? [] });
  } catch (err) {
    console.error("[agency/usage] Error:", err);
    res.status(500).json({ error: "Failed to fetch usage data" });
  }
});

export default router;
