"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/score-ring";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalReports: 0,
    revenueThisMonth: 0,
    activeOffers: 0,
  });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

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

    // Fetch stats in parallel
    const [usersRes, reportsRes, offersRes, sessionsRes, leadsRes, revenueRes] =
      await Promise.all([
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
          .select("id, email, business_name, overall_score, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
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
      revenueThisMonth: monthRevenue / 100, // assuming stored in pence
      activeOffers: activeOfferCount,
    });

    if (sessionsRes.data) setSessions(sessionsRes.data);
    if (offersRes.data) setOffers(offersRes.data);
    if (leadsRes.data) setLeads(leadsRes.data);

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

  /* ── Loading state ──────────────────────────────────────────────── */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-midnight">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-harper-gold border-t-transparent" />
      </main>
    );
  }

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

        {/* ── Stats Overview ──────────────────────────────────────────── */}
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

        {/* ── Recent Sessions ─────────────────────────────────────────── */}
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
                        {new Date(session.created_at).toLocaleDateString(
                          "en-GB",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

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

        {/* ── Lead List ───────────────────────────────────────────────── */}
        <div className="mt-10 rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6">
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
                  leads.map((lead) => (
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
                        {new Date(lead.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
