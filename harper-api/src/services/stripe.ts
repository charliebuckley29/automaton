import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing required environment variable: STRIPE_SECRET_KEY");
}

/**
 * Stripe server client – used for creating checkout sessions, managing
 * subscriptions, and verifying webhook signatures.
 */
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
  typescript: true,
});
