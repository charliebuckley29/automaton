import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * Thin proxy for Stripe webhooks.
 * Receives the raw webhook payload from Stripe, verifies the signature,
 * and forwards to the GCP backend for processing.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    console.error("NEXT_PUBLIC_API_URL not configured");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    // Forward the raw payload and signature to the GCP backend
    const response = await fetch(`${apiUrl}/webhooks/stripe`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "stripe-signature": signature,
      },
      body,
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Stripe webhook proxy error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
