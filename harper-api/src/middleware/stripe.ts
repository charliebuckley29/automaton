import { Request, Response, NextFunction } from "express";
import express from "express";
import { stripe } from "../services/stripe.js";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!STRIPE_WEBHOOK_SECRET) {
  console.warn(
    "[stripe middleware] STRIPE_WEBHOOK_SECRET not set – webhook verification will fail",
  );
}

/**
 * Extend the Express Request to carry the verified Stripe event.
 */
declare global {
  namespace Express {
    interface Request {
      stripeEvent?: import("stripe").Stripe.Event;
    }
  }
}

/**
 * Two-part middleware stack for Stripe webhooks:
 * 1. Parse the raw body (required for signature verification).
 * 2. Verify the Stripe-Signature header and attach the event to req.
 */
export const stripeWebhookMiddleware = [
  // Raw body parser — must run *before* express.json()
  express.raw({ type: "application/json" }),

  // Signature verification
  (req: Request, res: Response, next: NextFunction): void => {
    const signature = req.headers["stripe-signature"] as string | undefined;

    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    if (!STRIPE_WEBHOOK_SECRET) {
      res.status(500).json({ error: "Stripe webhook secret not configured" });
      return;
    }

    try {
      const event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        signature,
        STRIPE_WEBHOOK_SECRET,
      );

      req.stripeEvent = event;
      next();
    } catch (err) {
      console.error("[stripe webhook] Signature verification failed:", err);
      res.status(400).json({ error: "Invalid signature" });
    }
  },
];
