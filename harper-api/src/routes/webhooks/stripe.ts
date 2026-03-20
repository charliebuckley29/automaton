import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { supabase } from "../../services/supabase.js";
import { stripeWebhookMiddleware } from "../../middleware/stripe.js";

const router = Router();

// ---------------------------------------------------------------------------
// POST /webhooks/stripe
// ---------------------------------------------------------------------------

router.post("/", ...stripeWebhookMiddleware, async (req: Request, res: Response) => {
  const event = req.stripeEvent!;

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`[stripe webhook] Unhandled event type: ${event.type}`);
    }

    // Always acknowledge receipt — Stripe retries on non-2xx
    res.json({ received: true });
  } catch (err) {
    console.error(`[stripe webhook] Error handling ${event.type}:`, err);
    // Still return 200 to prevent Stripe from retrying indefinitely.
    // The error is logged and can be investigated manually.
    res.json({ received: true, error: "Handler failed — logged for review" });
  }
});

// ---------------------------------------------------------------------------
// checkout.session.completed
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const customerId = session.customer as string | null;
  const customerEmail = session.customer_details?.email ?? session.customer_email;
  const sessionMetadata = session.metadata ?? {};

  // Idempotency: check if we already processed this checkout
  const { data: existing } = await supabase
    .from("report_sessions")
    .select("id")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  if (existing) {
    console.log(
      `[stripe webhook] checkout.session.completed already processed: ${session.id}`,
    );
    return;
  }

  // ------------------------------------------------------------------
  // Ensure business record exists
  // ------------------------------------------------------------------

  let businessId = sessionMetadata.business_id;

  if (!businessId) {
    // Create a new business from the checkout metadata
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .insert({
        name: sessionMetadata.business_name ?? "Unknown Business",
        website_url: sessionMetadata.website_url ?? null,
        type: sessionMetadata.business_type ?? "unknown",
        contact_email: customerEmail,
        stripe_customer_id: customerId,
      })
      .select()
      .single();

    if (bizError || !business) {
      throw new Error(
        `Failed to create business record: ${bizError?.message ?? "unknown error"}`,
      );
    }

    businessId = business.id;
  } else {
    // Update existing business with Stripe customer ID if not set
    await supabase
      .from("businesses")
      .update({ stripe_customer_id: customerId })
      .eq("id", businessId)
      .is("stripe_customer_id", null);
  }

  // ------------------------------------------------------------------
  // Create report session
  // ------------------------------------------------------------------

  const { error: sessionError } = await supabase
    .from("report_sessions")
    .insert({
      business_id: businessId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string | null,
      customer_email: customerEmail,
      status: "paid",
      intake_data: sessionMetadata.intake_data
        ? JSON.parse(sessionMetadata.intake_data)
        : null,
      amount_paid: session.amount_total,
      currency: session.currency,
    });

  if (sessionError) {
    throw new Error(
      `Failed to create report session: ${sessionError.message}`,
    );
  }

  console.log(
    `[stripe webhook] Created report session for checkout ${session.id} (business: ${businessId})`,
  );
}

// ---------------------------------------------------------------------------
// payment_intent.payment_failed
// ---------------------------------------------------------------------------

async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent,
): Promise<void> {
  const failureMessage =
    paymentIntent.last_payment_error?.message ?? "Unknown failure reason";

  console.error(
    `[stripe webhook] Payment failed for PI ${paymentIntent.id}: ${failureMessage}`,
  );

  // Log to a payment_events table for auditing
  await supabase
    .from("payment_events")
    .insert({
      stripe_payment_intent_id: paymentIntent.id,
      event_type: "payment_failed",
      details: {
        failure_message: failureMessage,
        failure_code: paymentIntent.last_payment_error?.code ?? null,
        customer_id: paymentIntent.customer as string | null,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    })
    .then(({ error }) => {
      if (error) {
        // Non-fatal: we already logged the error above
        console.error("[stripe webhook] Failed to log payment event:", error);
      }
    });
}

// ---------------------------------------------------------------------------
// customer.subscription.deleted
// ---------------------------------------------------------------------------

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  const customerId = subscription.customer as string;

  // Idempotency: only update if currently active
  const { data: business } = await supabase
    .from("businesses")
    .select("id, subscription_status")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!business) {
    console.warn(
      `[stripe webhook] No business found for customer ${customerId} during subscription deletion`,
    );
    return;
  }

  if (business.subscription_status === "canceled") {
    console.log(
      `[stripe webhook] Subscription already marked canceled for business ${business.id}`,
    );
    return;
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      subscription_status: "canceled",
      subscription_ended_at: new Date().toISOString(),
    })
    .eq("id", business.id);

  if (error) {
    throw new Error(
      `Failed to update subscription status for business ${business.id}: ${error.message}`,
    );
  }

  console.log(
    `[stripe webhook] Subscription canceled for business ${business.id} (customer: ${customerId})`,
  );
}

export default router;
