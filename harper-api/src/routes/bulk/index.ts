import { Router, Request, Response } from "express";
import { supabase } from "../../services/supabase.js";
import { stripe } from "../../services/stripe.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

// ---------------------------------------------------------------------------
// Bulk credit pack pricing
// ---------------------------------------------------------------------------

const PACK_PRICING: Record<number, { gbp: number; usd: number }> = {
  3: { gbp: 9900, usd: 11900 },      // £99 / $119
  5: { gbp: 14900, usd: 17900 },      // £149 / $179
  10: { gbp: 24900, usd: 29900 },     // £249 / $299
  25: { gbp: 49900, usd: 59900 },     // £499 / $599
};

const WHITE_LABEL_ADDON: Record<number, { gbp: number; usd: number }> = {
  3: { gbp: 5000, usd: 6000 },
  5: { gbp: 5000, usd: 6000 },
  10: { gbp: 5000, usd: 6000 },
  25: { gbp: 5000, usd: 6000 },
};

// ---------------------------------------------------------------------------
// POST /bulk/checkout
// Create a Stripe checkout session for a bulk credit pack.
// ---------------------------------------------------------------------------

router.post("/checkout", requireAuth, async (req: Request, res: Response) => {
  const { pack_size, currency, white_label, white_label_config } = req.body as {
    pack_size: number;
    currency: "GBP" | "USD";
    white_label?: boolean;
    white_label_config?: { logo_url?: string; brand_colour?: string; agency_name?: string };
  };

  const pricing = PACK_PRICING[pack_size];
  if (!pricing) {
    res.status(400).json({ error: `Invalid pack size. Choose from: ${Object.keys(PACK_PRICING).join(", ")}` });
    return;
  }

  const curr = currency?.toUpperCase() === "USD" ? "usd" : "gbp";
  let amount = curr === "usd" ? pricing.usd : pricing.gbp;

  if (white_label) {
    const addon = WHITE_LABEL_ADDON[pack_size];
    amount += curr === "usd" ? addon.usd : addon.gbp;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: curr,
      line_items: [
        {
          price_data: {
            currency: curr,
            unit_amount: amount,
            product_data: {
              name: `Harper Report Pack — ${pack_size} credits${white_label ? " (White-Label)" : ""}`,
              description: `${pack_size} business intelligence reports${white_label ? " with your branding" : ""}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "bulk_credit_pack",
        pack_size: String(pack_size),
        user_id: req.user!.id,
        white_label: white_label ? "true" : "false",
        white_label_config: white_label_config ? JSON.stringify(white_label_config) : "",
      },
      success_url: `${process.env.FRONTEND_URL}/dashboard?bulk=success`,
      cancel_url: `${process.env.FRONTEND_URL}/agencies`,
    });

    res.json({ checkout_url: session.url });
  } catch (err) {
    console.error("[bulk/checkout] Error:", err);
    res.status(500).json({ error: "Checkout creation failed" });
  }
});

// ---------------------------------------------------------------------------
// GET /bulk/credits
// Get the user's current credit balance.
// ---------------------------------------------------------------------------

router.get("/credits", requireAuth, async (req: Request, res: Response) => {
  try {
    const { data: packs, error } = await supabase
      .from("bulk_credit_packs")
      .select("*")
      .eq("user_id", req.user!.id)
      .gt("credits_remaining", 0)
      .order("created_at", { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const totalCredits = (packs ?? []).reduce((sum, p) => sum + p.credits_remaining, 0);

    res.json({
      total_credits: totalCredits,
      packs: packs ?? [],
    });
  } catch (err) {
    console.error("[bulk/credits] Error:", err);
    res.status(500).json({ error: "Failed to fetch credits" });
  }
});

// ---------------------------------------------------------------------------
// POST /bulk/assign
// Assign a credit to a client email — creates a session for them.
// ---------------------------------------------------------------------------

router.post("/assign", requireAuth, async (req: Request, res: Response) => {
  const { client_email, client_name, business_name, pack_id } = req.body as {
    client_email: string;
    client_name?: string;
    business_name?: string;
    pack_id?: string;
  };

  if (!client_email) {
    res.status(400).json({ error: "client_email is required" });
    return;
  }

  try {
    // Find a pack with remaining credits
    let packQuery = supabase
      .from("bulk_credit_packs")
      .select("*")
      .eq("user_id", req.user!.id)
      .gt("credits_remaining", 0)
      .order("created_at", { ascending: true })
      .limit(1);

    if (pack_id) {
      packQuery = supabase
        .from("bulk_credit_packs")
        .select("*")
        .eq("id", pack_id)
        .eq("user_id", req.user!.id)
        .gt("credits_remaining", 0);
    }

    const { data: packs } = await packQuery;
    const pack = packs?.[0];

    if (!pack) {
      res.status(400).json({ error: "No credits remaining" });
      return;
    }

    // Create or find business
    const { data: business } = await supabase
      .from("businesses")
      .insert({
        name: business_name ?? `${client_name ?? client_email}'s Business`,
        business_type: "smb",
      })
      .select()
      .single();

    if (!business) {
      res.status(500).json({ error: "Failed to create business" });
      return;
    }

    // Create report session
    const { data: session, error: sessionError } = await supabase
      .from("report_sessions")
      .insert({
        business_id: business.id,
        report_type: "business_intelligence",
        status: "payment_complete",
        bulk_credit_id: pack.id,
        is_white_label: pack.is_white_label,
        white_label_config: pack.white_label_config,
        currency: pack.currency,
        amount_paid: 0,
      })
      .select()
      .single();

    if (sessionError || !session) {
      res.status(500).json({ error: "Failed to create session" });
      return;
    }

    // Decrement credit
    await supabase
      .from("bulk_credit_packs")
      .update({ credits_remaining: pack.credits_remaining - 1 })
      .eq("id", pack.id);

    // TODO: Send email to client with link to /interview/{sessionId}/intake

    res.json({
      message: "Credit assigned",
      session_id: session.id,
      intake_url: `${process.env.FRONTEND_URL}/interview/${session.id}/intake`,
      credits_remaining: pack.credits_remaining - 1,
    });
  } catch (err) {
    console.error("[bulk/assign] Error:", err);
    res.status(500).json({ error: "Credit assignment failed" });
  }
});

export default router;
