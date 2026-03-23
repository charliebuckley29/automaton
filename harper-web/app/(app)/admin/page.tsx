"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/score-ring";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AdminTab = "overview" | "pipeline" | "analytics" | "offers";

interface Stats {
  totalUsers: number;
  totalReports: number;
  revenueThisMonth: number;
  activeOffers: number;
}

interface Session {
  id: string;
  user_email: string;
  business_name: string;
  status: string;
  created_at: string;
}

interface Offer {
  id: string;
  offer_code: string;
  label: string;
  discount_percent: number;
  active: boolean;
  max_redemptions: number | null;
  redemptions: number;
  expires_at: string | null;
}

interface Lead {
  id: string;
  email: string;
  business_name: string | null;
  overall_score: number;
  created_at: string;
  status?: string;
  utm_source?: string | null;
}

interface Subscription {
  id: string;
  user_email: string;
  business_name: string | null;
  status: string;
  amount_monthly: number;
  created_at: string;
}

interface BusinessInteraction {
  id: string;
  user_email: string;
  business_name: string | null;
  type: string;
  description: string | null;
  created_at: string;
}

interface AnalyticsData {
  conversionRate: number;
  averageReportScore: number;
  activeRetainers: number;
  totalRevenue: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalReports: 0,
    revenueThisMonth: 0,
    activeOffers: 0,
  });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [businessInteractions, setBusinessInteractions] = useState<BusinessInteraction[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    conversionRate: 0,
    averageReportScore: 0,
    activeRetainers: 0,
    totalRevenue: 0,
  });

  /* Pipeline lead counts by status */
  const [leadCountsByStatus, setLeadCountsByStatus] = useState<Record<string, number>>({
    new: 0,
    sequenced: 0,
    converted: 0,
  });

  /* Flash offer form state */
  const [flashCode, setFlashCode] = useState("");
  const [flashDiscount, setFlashDiscount] = useState("");
  const [flashDuration, setFlashDuration] = useState("");
  const [flashMaxRedemptions, setFlashMaxRedemptions] = useState("");
  const [flashSubmitting, setFlashSubmitting] = useState(false);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  /* ── Load data ──────────────────────────────────────────────────── */
  const loadData = useCallback(async () => {
    const supabase = createBrowserClient();

    // Admin role check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      router.push("/dashboard");
      return;
    }

    // Fetch all data in parallel
    const [
      usersRes,
      reportsRes,
      offersRes,
      sessionsRes,
      leadsRes,
      revenueRes,
      subscriptionsRes,
      interactionsRes,
      reportScoresRes,
      sessionRevenueRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("reports").select("id", { count: "exact", head: true }),
      supabase
        .from("offers")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("interview_sessions")
        .select("id, user_email, business_name, status, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("scorecard_submissions")
        .select("id, email, business_name, overall_score, created_at, status, utm_source")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("payments")
        .select("amount")
        .gte(
          "created_at",
          new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          ).toISOString()
        ),
      supabase
        .from("subscriptions")
        .select("id, user_email, business_name, status, amount_monthly, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("business_interactions")
        .select("id, user_email, business_name, type, description, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("reports").select("score_overall"),
      supabase.from("report_sessions").select("amount_paid"),
    ]);

    const activeOfferCount =
      offersRes.data?.filter((o) => o.active).length ?? 0;
    const monthRevenue =
      revenueRes.data?.reduce(
        (sum: number, p: { amount: number }) => sum + (p.amount ?? 0),
        0
      ) ?? 0;

    setStats({
      totalUsers: usersRes.count ?? 0,
      totalReports: reportsRes.count ?? 0,
      revenueThisMonth: monthRevenue / 100,
      activeOffers: activeOfferCount,
    });

    if (sessionsRes.data) setSessions(sessionsRes.data);
    if (offersRes.data) setOffers(offersRes.data);
    if (leadsRes.data) setLeads(leadsRes.data);
    if (subscriptionsRes.data) setSubscriptions(subscriptionsRes.data);
    if (interactionsRes.data) setBusinessInteractions(interactionsRes.data);

    // Compute lead counts by status
    const allLeads = leadsRes.data ?? [];
    const counts: Record<string, number> = { new: 0, sequenced: 0, converted: 0 };
    allLeads.forEach((l) => {
      const s = l.status ?? "new";
      if (s in counts) counts[s]++;
    });
    setLeadCountsByStatus(counts);

    // Compute analytics
    const activeSubsList = subscriptionsRes.data?.filter((s) => s.status === "active") ?? [];
    const totalLeads = allLeads.length;
    const convertedLeads = allLeads.filter((l) => l.status === "converted").length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    const scores = reportScoresRes.data?.map((r) => r.score_overall).filter(Boolean) ?? [];
    const avgScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;

    const sessionRevenue = sessionRevenueRes.data?.reduce(
      (sum: number, r: { amount_paid: number }) => sum + (r.amount_paid ?? 0),
      0
    ) ?? 0;
    const subRevenue = activeSubsList.reduce((sum, s) => sum + (s.amount_monthly ?? 0), 0);

    setAnalytics({
      conversionRate,
      averageReportScore: Math.round(avgScore * 10) / 10,
      activeRetainers: activeSubsList.length,
      totalRevenue: (sessionRevenue + subRevenue) / 100,
    });

    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Toggle offer ───────────────────────────────────────────────── */
  async function toggleOffer(offerId: string, currentActive: boolean) {
    const supabase = createBrowserClient();
    await supabase
      .from("offers")
      .update({ active: !currentActive })
      .eq("id", offerId);

    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerId ? { ...o, active: !currentActive } : o
      )
    );
    setStats((prev) => ({
      ...prev,
      activeOffers: prev.activeOffers + (currentActive ? -1 : 1),
    }));
  }

  /* ── Create flash offer ─────────────────────────────────────────── */
  async function handleCreateFlashOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!flashCode.trim() || !flashDiscount || !flashDuration) return;

    setFlashSubmitting(true);
    setFlashMessage(null);

    const supabase = createBrowserClient();
    const expiresAt = new Date(
      Date.now() + Number(flashDuration) * 60 * 60 * 1000
    ).toISOString();

    const { error } = await supabase.from("offers").insert({
      offer_code: flashCode.trim().toUpperCase(),
      label: `Flash: ${flashCode.trim().toUpperCase()}`,
      discount_percent: Number(flashDiscount),
      active: true,
      max_redemptions: flashMaxRedemptions
        ? Number(flashMaxRedemptions)
        : null,
      redemptions: 0,
      expires_at: expiresAt,
    });

    if (error) {
      setFlashMessage(`Error: ${error.message}`);
    } else {
      setFlashMessage("Flash offer created successfully.");
      setFlashCode("");
      setFlashDiscount("");
      setFlashDuration("");
      setFlashMaxRedemptions("");
      // Reload offers
      const { data } = await supabase
        .from("offers")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) {
        setOffers(data);
        setStats((prev) => ({
          ...prev,
          activeOffers: data.filter((o) => o.active).length,
        }));
      }
    }

    setFlashSubmitting(false);
  }

  /* ── Helper: format date ─────────────────────────────────────────── */
  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  /* ── Loading state ──────────────────────────────────────────────── */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-midnight">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-harper-gold border-t-transparent" />
      </main>
    );
  }

  /* ── Pipeline helpers ────────────────────────────────────────────── */
  const pipelineLeads = (status: string) =>
    leads.filter((l) => (l.status ?? "new") === status);

  const pipelineRetainers = subscriptions.filter((s) => s.status === "active");

  /* ── Tab content renderers ───────────────────────────────────────── */

  const tabs: { key: AdminTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "pipeline", label: "Pipeline" },
    { key: "analytics", label: "Analytics" },
    { key: "offers", label: "Offers" },
  ];

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <main className="min-h-screen bg-midnight px-6 py-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <p className="mb-1 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
            Admin
          </p>
          <h1 className="font-display text-3xl font-bold text-chalk">
            Harper Command Centre
          </h1>
        </div>

        {/* ── Tab Navigation ────────────────────────────────────────── */}
        <div className="mb-10 flex gap-1 rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-harper-gold text-midnight"
                  : "text-chalk/50 hover:bg-chalk/[0.05] hover:text-chalk/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ================================================================ */}
        {/*  OVERVIEW TAB                                                    */}
        {/* ================================================================ */}
        {activeTab === "overview" && (
          <>
            {/* ── Stats Overview ──────────────────────────────────────── */}
            <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Total Users",
                  value: stats.totalUsers.toLocaleString(),
                  color: "text-chalk",
                },
                {
                  label: "Total Reports",
                  value: stats.totalReports.toLocaleString(),
                  color: "text-chalk",
                },
                {
                  label: "Revenue This Month",
                  value: `\u00A3${stats.revenueThisMonth.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  color: "text-score-green",
                },
                {
                  label: "Active Offers",
                  value: stats.activeOffers.toString(),
                  color: "text-harper-gold",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-chalk/40">
                    {stat.label}
                  </p>
                  <p className={`mt-2 font-display text-3xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* ── Recent Sessions ─────────────────────────────────────── */}
            <div className="mb-10 rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-chalk/40">
                Recent Sessions
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-chalk/10">
                      <th className="pb-3 pr-4 font-medium text-chalk/50">User</th>
                      <th className="pb-3 pr-4 font-medium text-chalk/50">
                        Business
                      </th>
                      <th className="pb-3 pr-4 font-medium text-chalk/50">
                        Status
                      </th>
                      <th className="pb-3 font-medium text-chalk/50">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-chalk/30">
                          No sessions yet.
                        </td>
                      </tr>
                    ) : (
                      sessions.map((session) => (
                        <tr
                          key={session.id}
                          className="border-b border-chalk/5 last:border-0"
                        >
                          <td className="py-3 pr-4 text-chalk/80">
                            {session.user_email}
                          </td>
                          <td className="py-3 pr-4 text-chalk/60">
                            {session.business_name || "\u2014"}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                session.status === "completed"
                                  ? "bg-score-green/10 text-score-green"
                                  : session.status === "in_progress"
                                  ? "bg-score-amber/10 text-score-amber"
                                  : "bg-chalk/10 text-chalk/50"
                              }`}
                            >
                              {session.status}
                            </span>
                          </td>
                          <td className="py-3 text-chalk/40">
                            {fmtDate(session.created_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Lead List ───────────────────────────────────────────── */}
            <div className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-chalk/40">
                Recent Scorecard Leads
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-chalk/10">
                      <th className="pb-3 pr-4 font-medium text-chalk/50">Email</th>
                      <th className="pb-3 pr-4 font-medium text-chalk/50">
                        Business
                      </th>
                      <th className="pb-3 pr-4 font-medium text-chalk/50">Score</th>
                      <th className="pb-3 font-medium text-chalk/50">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-chalk/30">
                          No scorecard leads yet.
                        </td>
                      </tr>
                    ) : (
                      leads.slice(0, 20).map((lead) => (
                        <tr
                          key={lead.id}
                          className="border-b border-chalk/5 last:border-0"
                        >
                          <td className="py-3 pr-4 text-chalk/80">{lead.email}</td>
                          <td className="py-3 pr-4 text-chalk/60">
                            {lead.business_name || "\u2014"}
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <ScoreRing
                                score={lead.overall_score}
                                size={32}
                                strokeWidth={3}
                                animated={false}
                              />
                              <span className="text-sm font-medium text-chalk">
                                {lead.overall_score}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-chalk/40">
                            {fmtDate(lead.created_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ================================================================ */}
        {/*  PIPELINE TAB                                                    */}
        {/* ================================================================ */}
        {activeTab === "pipeline" && (
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Lead column */}
            <PipelineColumn
              title="Lead"
              count={leadCountsByStatus.new}
              accentClass="bg-chalk/20"
            >
              {pipelineLeads("new").map((lead) => (
                <PipelineCard
                  key={lead.id}
                  email={lead.email}
                  businessName={lead.business_name}
                  score={lead.overall_score}
                  date={lead.created_at}
                  source={lead.utm_source}
                />
              ))}
            </PipelineColumn>

            {/* Sequenced column */}
            <PipelineColumn
              title="Sequenced"
              count={leadCountsByStatus.sequenced}
              accentClass="bg-score-amber/20"
            >
              {pipelineLeads("sequenced").map((lead) => (
                <PipelineCard
                  key={lead.id}
                  email={lead.email}
                  businessName={lead.business_name}
                  score={lead.overall_score}
                  date={lead.created_at}
                  source={lead.utm_source}
                />
              ))}
            </PipelineColumn>

            {/* Converted column */}
            <PipelineColumn
              title="Converted"
              count={leadCountsByStatus.converted}
              accentClass="bg-score-green/20"
            >
              {pipelineLeads("converted").map((lead) => (
                <PipelineCard
                  key={lead.id}
                  email={lead.email}
                  businessName={lead.business_name}
                  score={lead.overall_score}
                  date={lead.created_at}
                  source={lead.utm_source}
                />
              ))}
            </PipelineColumn>

            {/* Retainer column */}
            <PipelineColumn
              title="Retainer"
              count={pipelineRetainers.length}
              accentClass="bg-harper-gold/20"
            >
              {pipelineRetainers.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-xl border border-chalk/10 bg-chalk/[0.03] p-4"
                >
                  <p className="truncate text-sm font-medium text-chalk">
                    {sub.user_email}
                  </p>
                  {sub.business_name && (
                    <p className="mt-0.5 truncate text-xs text-chalk/50">
                      {sub.business_name}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-harper-gold">
                      {`\u00A3${(sub.amount_monthly / 100).toLocaleString("en-GB")}/mo`}
                    </span>
                    <span className="text-xs text-chalk/30">
                      {fmtDate(sub.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </PipelineColumn>
          </div>
        )}

        {/* ================================================================ */}
        {/*  ANALYTICS TAB                                                   */}
        {/* ================================================================ */}
        {activeTab === "analytics" && (
          <>
            {/* Revenue chart placeholder */}
            <div className="mb-10 flex h-64 items-center justify-center rounded-2xl border border-chalk/10 bg-chalk/[0.02]">
              <p className="text-sm text-chalk/30">
                Revenue chart &mdash; integrate with charting library
              </p>
            </div>

            {/* Metrics grid */}
            <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Conversion Rate",
                  value: `${analytics.conversionRate.toFixed(1)}%`,
                  color: "text-score-green",
                },
                {
                  label: "Avg Report Score",
                  value: analytics.averageReportScore.toString(),
                  color: "text-chalk",
                },
                {
                  label: "Active Retainers",
                  value: analytics.activeRetainers.toString(),
                  color: "text-harper-gold",
                },
                {
                  label: "Total Revenue",
                  value: `\u00A3${analytics.totalRevenue.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  color: "text-score-green",
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-chalk/40">
                    {metric.label}
                  </p>
                  <p className={`mt-2 font-display text-3xl font-bold ${metric.color}`}>
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-10 lg:grid-cols-2">
              {/* Recent business interactions */}
              <div className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-chalk/40">
                  Recent Business Interactions
                </h2>
                {businessInteractions.length === 0 ? (
                  <p className="py-8 text-center text-sm text-chalk/30">
                    No interactions recorded.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {businessInteractions.map((interaction) => (
                      <div
                        key={interaction.id}
                        className="rounded-xl border border-chalk/5 bg-chalk/[0.01] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-chalk/80">
                            {interaction.user_email}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              interaction.type === "project"
                                ? "bg-harper-gold/10 text-harper-gold"
                                : "bg-chalk/10 text-chalk/50"
                            }`}
                          >
                            {interaction.type}
                          </span>
                        </div>
                        {interaction.business_name && (
                          <p className="mt-1 text-xs text-chalk/40">
                            {interaction.business_name}
                          </p>
                        )}
                        {interaction.description && (
                          <p className="mt-1 text-xs text-chalk/50">
                            {interaction.description}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-chalk/25">
                          {fmtDate(interaction.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Implementation requests */}
              <div className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-chalk/40">
                  Implementation Requests
                </h2>
                {businessInteractions.filter((i) => i.type === "project").length ===
                0 ? (
                  <p className="py-8 text-center text-sm text-chalk/30">
                    No implementation requests.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {businessInteractions
                      .filter((i) => i.type === "project")
                      .map((req) => (
                        <div
                          key={req.id}
                          className="rounded-xl border border-harper-gold/10 bg-harper-gold/[0.02] p-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-chalk/80">
                              {req.user_email}
                            </span>
                            <span className="rounded-full bg-harper-gold/10 px-2 py-0.5 text-xs font-medium text-harper-gold">
                              project
                            </span>
                          </div>
                          {req.business_name && (
                            <p className="mt-1 text-xs text-chalk/40">
                              {req.business_name}
                            </p>
                          )}
                          {req.description && (
                            <p className="mt-1 text-xs text-chalk/50">
                              {req.description}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-chalk/25">
                            {fmtDate(req.created_at)}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ================================================================ */}
        {/*  OFFERS TAB                                                      */}
        {/* ================================================================ */}
        {activeTab === "offers" && (
          <div className="grid gap-10 lg:grid-cols-2">
            {/* ── Active Offers ───────────────────────────────────────── */}
            <div className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-chalk/40">
                Active Offers
              </h2>
              {offers.length === 0 ? (
                <p className="py-8 text-center text-sm text-chalk/30">
                  No offers configured.
                </p>
              ) : (
                <div className="space-y-3">
                  {offers.map((offer) => (
                    <div
                      key={offer.id}
                      className={`flex items-center justify-between rounded-xl border p-4 ${
                        offer.active
                          ? "border-harper-gold/20 bg-harper-gold/[0.03]"
                          : "border-chalk/10 bg-chalk/[0.01]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-chalk">
                            {offer.offer_code}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              offer.active
                                ? "bg-score-green/10 text-score-green"
                                : "bg-chalk/10 text-chalk/40"
                            }`}
                          >
                            {offer.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-chalk/40">
                          {offer.discount_percent}% off
                          {offer.max_redemptions
                            ? ` \u00B7 ${offer.redemptions}/${offer.max_redemptions} used`
                            : ` \u00B7 ${offer.redemptions} used`}
                          {offer.expires_at &&
                            ` \u00B7 Expires ${new Date(offer.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleOffer(offer.id, offer.active)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                          offer.active
                            ? "bg-score-red/10 text-score-red hover:bg-score-red/20"
                            : "bg-score-green/10 text-score-green hover:bg-score-green/20"
                        }`}
                      >
                        {offer.active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Create Flash Offer ──────────────────────────────────── */}
            <div className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-chalk/40">
                Quick Action: Create Flash Offer
              </h2>
              <form onSubmit={handleCreateFlashOffer} className="space-y-4">
                <div>
                  <label
                    htmlFor="flash-code"
                    className="mb-1.5 block text-sm font-medium text-chalk/80"
                  >
                    Offer Code <span className="text-harper-gold">*</span>
                  </label>
                  <input
                    id="flash-code"
                    type="text"
                    required
                    value={flashCode}
                    onChange={(e) => setFlashCode(e.target.value)}
                    placeholder="e.g. FLASH20"
                    className="w-full rounded-xl border border-chalk/15 bg-chalk/[0.04] px-4 py-3 font-mono text-sm text-chalk uppercase placeholder:text-chalk/30 focus:border-harper-gold focus:outline-none focus:ring-1 focus:ring-harper-gold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="flash-discount"
                      className="mb-1.5 block text-sm font-medium text-chalk/80"
                    >
                      Discount % <span className="text-harper-gold">*</span>
                    </label>
                    <input
                      id="flash-discount"
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={flashDiscount}
                      onChange={(e) => setFlashDiscount(e.target.value)}
                      placeholder="20"
                      className="w-full rounded-xl border border-chalk/15 bg-chalk/[0.04] px-4 py-3 text-sm text-chalk placeholder:text-chalk/30 focus:border-harper-gold focus:outline-none focus:ring-1 focus:ring-harper-gold"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="flash-duration"
                      className="mb-1.5 block text-sm font-medium text-chalk/80"
                    >
                      Duration (hours) <span className="text-harper-gold">*</span>
                    </label>
                    <input
                      id="flash-duration"
                      type="number"
                      required
                      min={1}
                      value={flashDuration}
                      onChange={(e) => setFlashDuration(e.target.value)}
                      placeholder="24"
                      className="w-full rounded-xl border border-chalk/15 bg-chalk/[0.04] px-4 py-3 text-sm text-chalk placeholder:text-chalk/30 focus:border-harper-gold focus:outline-none focus:ring-1 focus:ring-harper-gold"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="flash-max"
                    className="mb-1.5 block text-sm font-medium text-chalk/80"
                  >
                    Max Redemptions{" "}
                    <span className="text-chalk/40">(optional)</span>
                  </label>
                  <input
                    id="flash-max"
                    type="number"
                    min={1}
                    value={flashMaxRedemptions}
                    onChange={(e) => setFlashMaxRedemptions(e.target.value)}
                    placeholder="Unlimited"
                    className="w-full rounded-xl border border-chalk/15 bg-chalk/[0.04] px-4 py-3 text-sm text-chalk placeholder:text-chalk/30 focus:border-harper-gold focus:outline-none focus:ring-1 focus:ring-harper-gold"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={
                    flashSubmitting || !flashCode || !flashDiscount || !flashDuration
                  }
                  size="md"
                  className="w-full"
                >
                  {flashSubmitting ? "Creating..." : "Create Flash Offer"}
                </Button>
                {flashMessage && (
                  <p
                    className={`text-sm ${
                      flashMessage.startsWith("Error")
                        ? "text-score-red"
                        : "text-score-green"
                    }`}
                  >
                    {flashMessage}
                  </p>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/* ================================================================== */
/*  Pipeline sub-components                                            */
/* ================================================================== */

function PipelineColumn({
  title,
  count,
  accentClass,
  children,
}: {
  title: string;
  count: number;
  accentClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-chalk/60">
          {title}
        </h3>
        <span
          className={`flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-xs font-bold text-midnight ${accentClass}`}
        >
          {count}
        </span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function PipelineCard({
  email,
  businessName,
  score,
  date,
  source,
}: {
  email: string;
  businessName: string | null;
  score: number;
  date: string;
  source?: string | null;
}) {
  return (
    <div className="rounded-xl border border-chalk/10 bg-chalk/[0.03] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-chalk">{email}</p>
          {businessName && (
            <p className="mt-0.5 truncate text-xs text-chalk/50">{businessName}</p>
          )}
        </div>
        <ScoreRing score={score} size={36} strokeWidth={3} animated={false} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="text-xs text-chalk/30">
          {new Date(date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </span>
        {source && (
          <span className="rounded-full bg-chalk/[0.06] px-2 py-0.5 text-xs text-chalk/40">
            {source}
          </span>
        )}
      </div>
    </div>
  );
}
