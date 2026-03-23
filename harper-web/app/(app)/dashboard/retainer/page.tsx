"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Subscription {
  id: string;
  business_id: string;
  retainer_type: string;
  status: string;
  monthly_amount: number;
  currency: "GBP" | "USD";
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  businesses: {
    id: string;
    name: string;
  } | null;
}

interface Implementation {
  id: string;
  interaction_type: string;
  summary: string | null;
  key_findings: Record<string, unknown> | null;
  created_at: string;
  status?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RETAINER_LABELS: Record<string, string> = {
  growth: "Growth Retainer",
  automation: "Automation Retainer",
  fractional_director: "Fractional Director",
  franchise_group: "Franchise Group",
};

const RETAINER_TIERS = [
  {
    type: "automation",
    label: "Automation",
    price: "£297/mo",
    description:
      "Workflow audits, up to 3 automation builds per month, integration setup, monitoring & monthly reports.",
  },
  {
    type: "growth",
    label: "Growth",
    price: "£497/mo",
    description:
      "Quarterly diagnostic, priority implementation, dedicated growth strategist, tool setup & monthly reports.",
  },
  {
    type: "franchise_group",
    label: "Franchise Group",
    price: "£997/mo",
    description:
      "Multi-location diagnostics, benchmarking, central dashboard & location-level reporting.",
  },
  {
    type: "fractional_director",
    label: "Fractional Director",
    price: "£1,497/mo",
    description:
      "Everything in Growth plus weekly strategy calls, board-ready reports, full team access & unlimited implementations.",
  },
];

const PLAN_FEATURES: Record<string, string[]> = {
  growth: [
    "Quarterly diagnostic review",
    "Priority implementation queue",
    "Dedicated growth strategist",
    "Tool setup & configuration",
    "Monthly performance reports",
  ],
  automation: [
    "Workflow audit & mapping",
    "Automation builds (up to 3/mo)",
    "Integration setup & testing",
    "Ongoing monitoring & alerts",
    "Monthly performance reports",
  ],
  fractional_director: [
    "Everything in Growth",
    "Weekly strategy calls",
    "Board-ready reports & decks",
    "Full team access",
    "Unlimited implementations",
  ],
  franchise_group: [
    "Multi-location diagnostics",
    "Cross-location benchmarking",
    "Central management dashboard",
    "Location-level reporting",
  ],
};

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-score-green/10 text-score-green" },
  trialing: { label: "Trial", cls: "bg-score-amber/10 text-score-amber" },
  past_due: { label: "Past Due", cls: "bg-score-red/10 text-score-red" },
  cancelled: { label: "Cancelled", cls: "bg-score-red/10 text-score-red" },
  paused: { label: "Paused", cls: "bg-score-amber/10 text-score-amber" },
};

const IMPL_STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  requested: { label: "Requested", cls: "bg-score-amber/10 text-score-amber" },
  scoping: { label: "Scoping", cls: "bg-score-amber/10 text-score-amber" },
  in_progress: {
    label: "In Progress",
    cls: "bg-harper-gold/10 text-harper-gold",
  },
  complete: { label: "Complete", cls: "bg-score-green/10 text-score-green" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function deriveStatus(impl: Implementation): string {
  if (impl.key_findings && typeof impl.key_findings === "object") {
    const status = (impl.key_findings as Record<string, unknown>).status;
    if (typeof status === "string") return status;
  }
  return "requested";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RetainerPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [implementations, setImplementations] = useState<Implementation[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // ---- Fetch data ----------------------------------------------------------

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch subscriptions joined with businesses
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*, businesses(id, name)")
        .order("created_at", { ascending: false })
        .limit(1);

      const activeSub =
        subs?.find(
          (s: Subscription) =>
            s.status === "active" || s.status === "trialing"
        ) ?? subs?.[0] ?? null;

      setSubscription(activeSub);

      // Fetch implementation queue if we have a business
      if (activeSub?.business_id) {
        const { data: impls } = await supabase
          .from("business_interactions")
          .select("*")
          .eq("business_id", activeSub.business_id)
          .eq("interaction_type", "project")
          .order("created_at", { ascending: false })
          .limit(10);

        setImplementations(impls ?? []);
      }

      setLoading(false);
    }

    load();
  }, []);

  // ---- Actions -------------------------------------------------------------

  async function handlePause() {
    if (!subscription) return;
    setActionLoading("pause");
    try {
      await supabase
        .from("subscriptions")
        .update({ status: "paused" })
        .eq("id", subscription.id);
      setSubscription({ ...subscription, status: "paused" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel() {
    if (!subscription) return;
    setActionLoading("cancel");
    try {
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("id", subscription.id);
      setSubscription({ ...subscription, status: "cancelled" });
    } finally {
      setActionLoading(null);
      setShowCancelConfirm(false);
    }
  }

  // ---- Loading state -------------------------------------------------------

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-harper-gold border-t-transparent" />
          <span className="text-chalk/50 text-sm">Loading retainer...</span>
        </div>
      </div>
    );
  }

  // ---- No subscription: upsell ---------------------------------------------

  const isActiveOrTrial =
    subscription?.status === "active" || subscription?.status === "trialing";

  if (!subscription || !isActiveOrTrial) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-chalk mb-2">
          Harper Retainer Plans
        </h1>
        <p className="text-chalk/60 mb-10 max-w-2xl">
          Go from diagnosis to done. Our retainer plans give you a dedicated
          team to implement recommendations, monitor performance, and drive
          continuous growth.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {RETAINER_TIERS.map((tier) => (
            <div
              key={tier.type}
              className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-xl font-semibold text-chalk">
                  {tier.label}
                </h2>
                <span className="text-harper-gold font-semibold text-lg">
                  {tier.price}
                </span>
              </div>
              <p className="text-chalk/60 text-sm leading-relaxed flex-1">
                {tier.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-harper-gold/30 bg-harper-gold/[0.04] p-8 text-center">
          <h3 className="font-display text-xl font-semibold text-chalk mb-2">
            Ready to accelerate?
          </h3>
          <p className="text-chalk/60 text-sm mb-6 max-w-md mx-auto">
            Book a discovery call and we&apos;ll match you with the right plan
            based on your diagnostic results.
          </p>
          <a href="mailto:hello@harper.ai">
            <Button variant="primary" size="md">
              Book a Discovery Call
            </Button>
          </a>
        </div>
      </div>
    );
  }

  // ---- Active subscription -------------------------------------------------

  const statusStyle = STATUS_STYLES[subscription.status] ?? {
    label: subscription.status,
    cls: "bg-chalk/10 text-chalk/70",
  };

  const features = PLAN_FEATURES[subscription.retainer_type] ?? [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl font-bold text-chalk mb-8">
        Your Retainer
      </h1>

      {/* ---- Subscription status card ------------------------------------ */}
      <div className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6 mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-chalk mb-1">
              {RETAINER_LABELS[subscription.retainer_type] ??
                subscription.retainer_type}
            </h2>
            {subscription.businesses?.name && (
              <p className="text-chalk/50 text-sm">
                {subscription.businesses.name}
              </p>
            )}
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusStyle.cls}`}
          >
            {statusStyle.label}
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-3 mb-6">
          <div>
            <p className="text-chalk/40 text-xs uppercase tracking-wider mb-1">
              Monthly Amount
            </p>
            <p className="text-chalk text-lg font-semibold">
              {formatCurrency(subscription.monthly_amount, subscription.currency)}
              <span className="text-chalk/40 text-sm font-normal">
                /{subscription.currency === "GBP" ? "mo" : "mo"}
              </span>
            </p>
          </div>
          {subscription.current_period_start && (
            <div>
              <p className="text-chalk/40 text-xs uppercase tracking-wider mb-1">
                Current Period
              </p>
              <p className="text-chalk text-sm">
                {formatDate(subscription.current_period_start)}
                {subscription.current_period_end &&
                  ` — ${formatDate(subscription.current_period_end)}`}
              </p>
            </div>
          )}
          {subscription.current_period_end && (
            <div>
              <p className="text-chalk/40 text-xs uppercase tracking-wider mb-1">
                Next Billing
              </p>
              <p className="text-chalk text-sm">
                {formatDate(subscription.current_period_end)}
                <span className="text-chalk/40 ml-2">
                  ({daysUntil(subscription.current_period_end)} days)
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 border-t border-chalk/10 pt-4">
          {subscription.status === "active" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePause}
              disabled={actionLoading !== null}
            >
              {actionLoading === "pause" ? "Pausing..." : "Pause Subscription"}
            </Button>
          )}
          {(subscription.status === "active" ||
            subscription.status === "trialing") && (
            <>
              {!showCancelConfirm ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={actionLoading !== null}
                  className="text-score-red/70 hover:text-score-red"
                >
                  Cancel Subscription
                </Button>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-score-red/20 bg-score-red/5 px-4 py-2">
                  <span className="text-sm text-chalk/70">
                    Are you sure? This cannot be undone.
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={actionLoading !== null}
                    className="text-score-red hover:text-score-red"
                  >
                    {actionLoading === "cancel"
                      ? "Cancelling..."
                      : "Yes, cancel"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={actionLoading !== null}
                  >
                    Keep plan
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ---- Plan features ----------------------------------------------- */}
      {features.length > 0 && (
        <div className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6 mb-8">
          <h3 className="font-display text-lg font-semibold text-chalk mb-4">
            Your plan includes
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded-full bg-harper-gold/10 text-harper-gold text-xs flex items-center justify-center">
                  &#10003;
                </span>
                <span className="text-chalk/80 text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---- Implementation queue ---------------------------------------- */}
      <div className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-chalk">
            Implementation Queue
          </h3>
          <Link
            href="/dashboard/implementations"
            className="text-harper-gold text-sm hover:underline"
          >
            View all &rarr;
          </Link>
        </div>

        {implementations.length === 0 ? (
          <p className="text-chalk/40 text-sm">
            No implementations in your queue yet. Visit your{" "}
            <Link href="/dashboard" className="text-harper-gold hover:underline">
              report recommendations
            </Link>{" "}
            to request implementations.
          </p>
        ) : (
          <div className="space-y-3">
            {implementations.map((impl) => {
              const status = deriveStatus(impl);
              const style = IMPL_STATUS_STYLES[status] ??
                IMPL_STATUS_STYLES.requested!;
              return (
                <div
                  key={impl.id}
                  className="flex items-center gap-4 rounded-xl border border-chalk/5 bg-chalk/[0.01] px-4 py-3"
                >
                  <div className="h-2 w-2 shrink-0 rounded-full bg-harper-gold/60" />
                  <div className="flex-1 min-w-0">
                    <p className="text-chalk text-sm font-medium truncate">
                      {impl.summary ?? "Implementation project"}
                    </p>
                    <p className="text-chalk/40 text-xs">
                      {formatDate(impl.created_at)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.cls}`}
                  >
                    {style.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
