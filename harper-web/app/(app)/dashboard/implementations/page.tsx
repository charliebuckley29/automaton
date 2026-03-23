"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Implementation {
  id: string;
  business_id: string;
  interaction_type: string;
  reference_id: string | null;
  summary: string | null;
  key_findings: Record<string, unknown> | null;
  created_at: string;
  tool_recommendations: {
    id: string;
    tool_name: string;
    tool_category: string | null;
    harper_can_implement: boolean;
  } | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PIPELINE_STAGES = [
  { key: "requested", label: "Requested" },
  { key: "scoping", label: "Scoping" },
  { key: "in_progress", label: "In Progress" },
  { key: "complete", label: "Complete" },
] as const;

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  requested: { label: "Requested", cls: "bg-score-amber/10 text-score-amber" },
  scoping: { label: "Scoping", cls: "bg-score-amber/10 text-score-amber" },
  in_progress: {
    label: "In Progress",
    cls: "bg-harper-gold/10 text-harper-gold",
  },
  complete: { label: "Complete", cls: "bg-score-green/10 text-score-green" },
  failed: { label: "Failed", cls: "bg-score-red/10 text-score-red" },
  cancelled: { label: "Cancelled", cls: "bg-score-red/10 text-score-red" },
};

const CATEGORY_ICONS: Record<string, string> = {
  crm: "\u{1F4CB}",
  marketing: "\u{1F4E3}",
  analytics: "\u{1F4CA}",
  automation: "\u26A1",
  finance: "\u{1F4B0}",
  communication: "\u{1F4AC}",
  project_management: "\u{1F4C5}",
  hr: "\u{1F465}",
  security: "\u{1F512}",
  ecommerce: "\u{1F6D2}",
  default: "\u{1F527}",
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

function deriveStatus(impl: Implementation): string {
  if (impl.key_findings && typeof impl.key_findings === "object") {
    const status = (impl.key_findings as Record<string, unknown>).status;
    if (typeof status === "string" && status in STATUS_STYLES) return status;
  }
  // Fall back to checking summary for keywords
  const summary = (impl.summary ?? "").toLowerCase();
  if (summary.includes("complete")) return "complete";
  if (summary.includes("in progress") || summary.includes("in_progress"))
    return "in_progress";
  if (summary.includes("scoping")) return "scoping";
  return "requested";
}

function getCategoryIcon(category: string | null): string {
  if (!category) return CATEGORY_ICONS.default!;
  const key = category.toLowerCase().replace(/[\s-]/g, "_");
  return CATEGORY_ICONS[key] ?? CATEGORY_ICONS.default!;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImplementationsPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [loading, setLoading] = useState(true);
  const [implementations, setImplementations] = useState<Implementation[]>([]);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Get the user's business — look up via profiles or subscriptions
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("id", user.id)
        .single();

      const businessId = profile?.business_id;
      if (!businessId) {
        setLoading(false);
        return;
      }

      const { data: impls } = await supabase
        .from("business_interactions")
        .select(
          "*, tool_recommendations(id, tool_name, tool_category, harper_can_implement)"
        )
        .eq("business_id", businessId)
        .eq("interaction_type", "project")
        .order("created_at", { ascending: false });

      setImplementations(impls ?? []);
      setLoading(false);
    }

    load();
  }, []);

  // ---- Derive pipeline counts -----------------------------------------------

  const statusCounts: Record<string, number> = {
    requested: 0,
    scoping: 0,
    in_progress: 0,
    complete: 0,
  };

  implementations.forEach((impl) => {
    const status = deriveStatus(impl);
    if (status in statusCounts) {
      statusCounts[status]!++;
    } else {
      statusCounts.requested!++;
    }
  });

  // ---- Loading state --------------------------------------------------------

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-harper-gold border-t-transparent" />
          <span className="text-chalk/50 text-sm">
            Loading implementations...
          </span>
        </div>
      </div>
    );
  }

  // ---- Empty state ----------------------------------------------------------

  if (implementations.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="font-display text-3xl font-bold text-chalk mb-8">
          Implementations
        </h1>
        <div className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-10 text-center">
          <div className="text-4xl mb-4">&#128736;</div>
          <h2 className="font-display text-xl font-semibold text-chalk mb-2">
            No implementations requested yet
          </h2>
          <p className="text-chalk/50 text-sm mb-6 max-w-md mx-auto">
            Visit your report recommendations to find tools Harper can implement
            for you, then request an implementation to get started.
          </p>
          <Link href="/dashboard">
            <Button variant="primary" size="md">
              View Recommendations
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ---- Main view ------------------------------------------------------------

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl font-bold text-chalk mb-8">
        Implementations
      </h1>

      {/* ---- Pipeline visualisation -------------------------------------- */}
      <div className="grid grid-cols-4 gap-3 mb-10">
        {PIPELINE_STAGES.map((stage) => {
          const count = statusCounts[stage.key] ?? 0;
          const isActive = count > 0;
          return (
            <div
              key={stage.key}
              className={`rounded-2xl border p-4 text-center transition-colors ${
                isActive
                  ? "border-harper-gold/30 bg-harper-gold/[0.04]"
                  : "border-chalk/10 bg-chalk/[0.02]"
              }`}
            >
              <p
                className={`text-2xl font-bold font-display mb-1 ${
                  isActive ? "text-harper-gold" : "text-chalk/30"
                }`}
              >
                {count}
              </p>
              <p className="text-chalk/50 text-xs uppercase tracking-wider">
                {stage.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* ---- Pipeline connector bar -------------------------------------- */}
      <div className="relative mb-10">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-chalk/10 -translate-y-1/2" />
        <div className="relative flex justify-between">
          {PIPELINE_STAGES.map((stage) => {
            const count = statusCounts[stage.key] ?? 0;
            return (
              <div
                key={stage.key}
                className={`h-3 w-3 rounded-full border-2 ${
                  count > 0
                    ? "border-harper-gold bg-harper-gold"
                    : "border-chalk/20 bg-midnight"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* ---- Implementation cards ---------------------------------------- */}
      <div className="space-y-4">
        {implementations.map((impl) => {
          const status = deriveStatus(impl);
          const style = STATUS_STYLES[status] ?? STATUS_STYLES.requested!;
          const tool = impl.tool_recommendations;
          const icon = getCategoryIcon(tool?.tool_category ?? null);

          return (
            <div
              key={impl.id}
              className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-5"
            >
              <div className="flex items-start gap-4">
                {/* Category icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chalk/[0.04] text-lg">
                  {icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-chalk font-semibold text-sm truncate">
                      {tool?.tool_name ?? impl.summary ?? "Implementation"}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.cls}`}
                    >
                      {style.label}
                    </span>
                    {tool?.harper_can_implement && (
                      <span className="inline-flex items-center rounded-full bg-harper-gold/10 px-2.5 py-0.5 text-xs font-medium text-harper-gold">
                        Harper Implementing
                      </span>
                    )}
                  </div>

                  {tool?.tool_category && (
                    <p className="text-chalk/40 text-xs mb-1 capitalize">
                      {tool.tool_category.replace(/_/g, " ")}
                    </p>
                  )}

                  {impl.summary && tool?.tool_name && (
                    <p className="text-chalk/60 text-sm leading-relaxed mt-1">
                      {impl.summary}
                    </p>
                  )}

                  <p className="text-chalk/30 text-xs mt-2">
                    Requested {formatDate(impl.created_at)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
