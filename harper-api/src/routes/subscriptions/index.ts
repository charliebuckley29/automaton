import { Router, Request, Response } from "express";
import { supabase } from "../../services/supabase.js";
import { stripe } from "../../services/stripe.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

// ---------------------------------------------------------------------------
// Pricing (amounts in minor units)
// ---------------------------------------------------------------------------

const GBP_PRICES: Record<string, number> = {
  growth: 49700,
  automation: 29700,
  fractional_director: 149700,
  franchise_group: 99700,
};

function getPrice(retainerType: string, currency: string): number | null {
  const gbp = GBP_PRICES[retainerType];
  if (gbp == null) return null;
  if (currency === "usd") return Math.round(gbp * 1.2);
  return gbp;
}

// ---------------------------------------------------------------------------
// POST /subscriptions/checkout
// Creates a Stripe subscription checkout session.
// ---------------------------------------------------------------------------

router.post("/checkout", requireAuth, async (req: Request, res: Response) => {
  try {
    const { business_id, retainer_type, currency = "gbp" } = req.body;

    if (!business_id || !retainer_type) {
      res.status(400).json({ error: "business_id and retainer_type are required" });
      return;
    }

    const normalizedCurrency = (currency as string).toLowerCase();
    if (!["gbp", "usd"].includes(normalizedCurrency)) {
      res.status(400).json({ error: "currency must be gbp or usd" });
      return;
    }

    const unitAmount = getPrice(retainer_type, normalizedCurrency);
    if (unitAmount == null) {
      res.status(400).json({
        error: "Invalid retainer_type. Must be one of: growth, automation, fractional_director, franchise_group",
      });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: normalizedCurrency,
            unit_amount: unitAmount,
            recurring: { interval: "month" },
            product_data: {
              name: `Harper ${retainer_type.replace(/_/g, " ")} retainer`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        business_id,
        user_id: req.user!.id,
        retainer_type,
        type: "subscription",
      },
      success_url: `${process.env.FRONTEND_URL ?? "https://app.harper.ai"}/subscriptions?success=true`,
      cancel_url: `${process.env.FRONTEND_URL ?? "https://app.harper.ai"}/subscriptions?cancelled=true`,
    });

    res.json({ checkout_url: session.url });
  } catch (err) {
    console.error("[subscriptions/checkout] Error:", err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// ---------------------------------------------------------------------------
// GET /subscriptions/active
// Returns the authenticated user's active subscriptions.
// ---------------------------------------------------------------------------

router.get("/active", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get businesses the user is a member of
    const { data: memberships, error: memError } = await supabase
      .from("business_members")
      .select("business_id")
      .eq("user_id", userId);

    if (memError) {
      console.error("[subscriptions/active] membership query error:", memError);
      res.status(500).json({ error: "Failed to fetch memberships" });
      return;
    }

    const businessIds = (memberships ?? []).map((m) => m.business_id);

    if (businessIds.length === 0) {
      res.json({ subscriptions: [] });
      return;
    }

    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("*, businesses(id, name)")
      .in("business_id", businessIds)
      .in("status", ["active", "past_due", "paused"]);

    if (subError) {
      console.error("[subscriptions/active] subscription query error:", subError);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
      return;
    }

    res.json({ subscriptions: subscriptions ?? [] });
  } catch (err) {
    console.error("[subscriptions/active] Error:", err);
    res.status(500).json({ error: "Failed to fetch active subscriptions" });
  }
});

// ---------------------------------------------------------------------------
// POST /subscriptions/cancel
// Cancels a subscription at the end of the current billing period.
// ---------------------------------------------------------------------------

router.post("/cancel", requireAuth, async (req: Request, res: Response) => {
  try {
    const { subscription_id } = req.body;
    if (!subscription_id) {
      res.status(400).json({ error: "subscription_id is required" });
      return;
    }

    // Verify ownership
    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("id, stripe_subscription_id, user_id")
      .eq("id", subscription_id)
      .single();

    if (subError || !sub) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }

    if (sub.user_id !== req.user!.id) {
      res.status(403).json({ error: "You do not own this subscription" });
      return;
    }

    // Cancel at period end in Stripe
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Update local DB
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("id", sub.id);

    if (updateError) {
      console.error("[subscriptions/cancel] DB update error:", updateError);
    }

    res.json({ success: true, message: "Subscription will cancel at end of billing period" });
  } catch (err) {
    console.error("[subscriptions/cancel] Error:", err);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

// ---------------------------------------------------------------------------
// POST /subscriptions/pause
// Pauses payment collection on a subscription.
// ---------------------------------------------------------------------------

router.post("/pause", requireAuth, async (req: Request, res: Response) => {
  try {
    const { subscription_id } = req.body;
    if (!subscription_id) {
      res.status(400).json({ error: "subscription_id is required" });
      return;
    }

    // Verify ownership
    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("id, stripe_subscription_id, user_id")
      .eq("id", subscription_id)
      .single();

    if (subError || !sub) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }

    if (sub.user_id !== req.user!.id) {
      res.status(403).json({ error: "You do not own this subscription" });
      return;
    }

    // Pause collection in Stripe
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      pause_collection: { behavior: "void" },
    });

    // Update local DB
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({ status: "paused" })
      .eq("id", sub.id);

    if (updateError) {
      console.error("[subscriptions/pause] DB update error:", updateError);
    }

    res.json({ success: true, message: "Subscription paused" });
  } catch (err) {
    console.error("[subscriptions/pause] Error:", err);
    res.status(500).json({ error: "Failed to pause subscription" });
  }
});

// ---------------------------------------------------------------------------
// POST /subscriptions/resume
// Resumes a paused subscription.
// ---------------------------------------------------------------------------

router.post("/resume", requireAuth, async (req: Request, res: Response) => {
  try {
    const { subscription_id } = req.body;
    if (!subscription_id) {
      res.status(400).json({ error: "subscription_id is required" });
      return;
    }

    // Verify ownership
    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("id, stripe_subscription_id, user_id")
      .eq("id", subscription_id)
      .single();

    if (subError || !sub) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }

    if (sub.user_id !== req.user!.id) {
      res.status(403).json({ error: "You do not own this subscription" });
      return;
    }

    // Remove pause_collection in Stripe
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      pause_collection: "",
    } as any);

    // Update local DB
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({ status: "active" })
      .eq("id", sub.id);

    if (updateError) {
      console.error("[subscriptions/resume] DB update error:", updateError);
    }

    res.json({ success: true, message: "Subscription resumed" });
  } catch (err) {
    console.error("[subscriptions/resume] Error:", err);
    res.status(500).json({ error: "Failed to resume subscription" });
  }
});

export default router;
