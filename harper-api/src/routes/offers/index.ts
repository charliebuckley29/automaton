import { Router, Request, Response } from "express";
import { supabase } from "../../services/supabase.js";
import { stripe } from "../../services/stripe.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

// ---------------------------------------------------------------------------
// GET /offers/active
// Public — returns current active offer for landing page display.
// Called server-side by Next.js (force-dynamic) on /reports page.
// ---------------------------------------------------------------------------

router.get("/active", async (_req: Request, res: Response) => {
  try {
    const now = new Date().toISOString();

    const { data: offer, error } = await supabase
      .from("active_offers")
      .select("*")
      .eq("active", true)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[offers/active] Error:", error);
      res.json({ offer: null });
      return;
    }

    // Check redemption limits
    if (offer && offer.max_redemptions && offer.current_redemptions >= offer.max_redemptions) {
      res.json({ offer: null });
      return;
    }

    res.json({ offer });
  } catch (err) {
    console.error("[offers/active] Error:", err);
    res.json({ offer: null });
  }
});

// ---------------------------------------------------------------------------
// POST /offers/create
// Admin-only — create a new flash offer with Stripe coupon + promo code.
// ---------------------------------------------------------------------------

router.post("/create", requireAuth, async (req: Request, res: Response) => {
  const {
    offer_code,
    offer_type,
    display_name,
    percent_off,
    duration_hours,
    max_redemptions,
    original_price_gbp,
    original_price_usd,
  } = req.body as {
    offer_code: string;
    offer_type: string;
    display_name: string;
    percent_off: number;
    duration_hours: number;
    max_redemptions?: number;
    original_price_gbp: number;
    original_price_usd: number;
  };

  if (!offer_code || !percent_off) {
    res.status(400).json({ error: "offer_code and percent_off are required" });
    return;
  }

  // Check admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", req.user!.id)
    .single();

  if (!profile?.is_admin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  try {
    // 1. Create Stripe coupon
    const coupon = await stripe.coupons.create({
      percent_off,
      duration: "once",
      redeem_by: Math.floor(Date.now() / 1000) + duration_hours * 3600,
      metadata: { campaign: offer_code, offer_type },
    });

    // 2. Create Stripe promo code
    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: offer_code.toUpperCase(),
      ...(max_redemptions && { max_redemptions }),
    });

    // 3. Calculate offer prices
    const offerPriceGbp = Math.round(original_price_gbp * (1 - percent_off / 100));
    const offerPriceUsd = Math.round(original_price_usd * (1 - percent_off / 100));

    // 4. Store in Supabase
    const { data: offer, error } = await supabase
      .from("active_offers")
      .insert({
        offer_code: offer_code.toUpperCase(),
        offer_type: offer_type ?? "flash",
        display_name: display_name ?? `${percent_off}% off`,
        original_price_gbp,
        offer_price_gbp: offerPriceGbp,
        original_price_usd,
        offer_price_usd: offerPriceUsd,
        stripe_coupon_id: coupon.id,
        stripe_promo_code: promoCode.code,
        active: true,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + duration_hours * 3600 * 1000).toISOString(),
        max_redemptions: max_redemptions ?? null,
        current_redemptions: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("[offers/create] DB error:", error);
      res.status(500).json({ error: "Failed to create offer" });
      return;
    }

    res.json({ message: "Offer created", offer });
  } catch (err) {
    console.error("[offers/create] Error:", err);
    res.status(500).json({ error: "Offer creation failed" });
  }
});

// ---------------------------------------------------------------------------
// PATCH /offers/:offerId/toggle
// Admin-only — toggle offer active/inactive.
// ---------------------------------------------------------------------------

router.patch("/:offerId/toggle", requireAuth, async (req: Request, res: Response) => {
  const { offerId } = req.params;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", req.user!.id)
    .single();

  if (!profile?.is_admin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  try {
    const { data: offer } = await supabase
      .from("active_offers")
      .select("active")
      .eq("id", offerId)
      .single();

    if (!offer) {
      res.status(404).json({ error: "Offer not found" });
      return;
    }

    const { error } = await supabase
      .from("active_offers")
      .update({ active: !offer.active })
      .eq("id", offerId);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ message: `Offer ${!offer.active ? "activated" : "deactivated"}` });
  } catch (err) {
    console.error("[offers/toggle] Error:", err);
    res.status(500).json({ error: "Toggle failed" });
  }
});

export default router;
