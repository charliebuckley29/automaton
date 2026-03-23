"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BulkCreditPack {
  id: string;
  user_id: string;
  pack_size: number;
  credits_remaining: number;
  is_white_label: boolean;
  white_label_config: {
    agency_name?: string;
    brand_colour?: string;
    logo_url?: string;
  } | null;
  created_at: string;
}

interface ReportSession {
  id: string;
  bulk_credit_id: string;
  client_email: string;
  client_name: string | null;
  status: string;
  created_at: string;
  intake_url: string | null;
  businesses: { business_name: string } | null;
  reports: { id: string }[] | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STATUS_CLASSES: Record<string, string> = {
  complete: "bg-score-green/10 text-score-green",
  in_progress: "bg-score-amber/10 text-score-amber",
  generating: "bg-score-amber/10 text-score-amber",
  researching: "bg-score-amber/10 text-score-amber",
  failed: "bg-score-red/10 text-score-red",
};
const DEFAULT_STATUS_CLASS = "bg-chalk/10 text-chalk/40";

const ACTIVE_STATUSES = ["in_progress", "generating", "researching"];

const inputCls =
  "w-full rounded-xl border border-chalk/15 bg-chalk/[0.04] px-4 py-3 text-sm text-chalk placeholder:text-chalk/30 focus:border-harper-gold focus:outline-none focus:ring-1 focus:ring-harper-gold";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AgencyPortalPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [loading, setLoading] = useState(true);
  const [packs, setPacks] = useState<BulkCreditPack[]>([]);
  const [sessions, setSessions] = useState<ReportSession[]>([]);
  const [agencyName, setAgencyName] = useState("Your Agency");

  /* Computed stats */
  const [totalCredits, setTotalCredits] = useState(0);
  const [totalUsed, setTotalUsed] = useState(0);
  const [activeReports, setActiveReports] = useState(0);
  const [completedReports, setCompletedReports] = useState(0);

  /* Assign-credit form */
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ client_email: "", client_name: "", business_name: "" });
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);
  const [assignUrl, setAssignUrl] = useState<string | null>(null);

  /* White-label form */
  const [wlForm, setWlForm] = useState({ agency_name: "", brand_colour: "#C9A84C", logo_url: "" });
  const [wlBusy, setWlBusy] = useState(false);
  const [wlMsg, setWlMsg] = useState<string | null>(null);
  const [hasWl, setHasWl] = useState(false);

  /* Clipboard */
  const [copiedId, setCopiedId] = useState<string | null>(null);
  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  /* ── Data loading ────────────────────────────────────────────────── */

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/"); return; }

    const { data: packsData } = await supabase
      .from("bulk_credit_packs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!packsData || packsData.length === 0) {
      setPacks([]);
      setLoading(false);
      return;
    }
    setPacks(packsData);

    /* Agency name: white-label config > profile > fallback */
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const wlPack = packsData.find((p: BulkCreditPack) => p.is_white_label);
    setAgencyName(wlPack?.white_label_config?.agency_name || profile?.full_name || "Your Agency");

    if (wlPack) {
      setHasWl(true);
      setWlForm({
        agency_name: wlPack.white_label_config?.agency_name || "",
        brand_colour: wlPack.white_label_config?.brand_colour || "#C9A84C",
        logo_url: wlPack.white_label_config?.logo_url || "",
      });
    }

    /* Credit stats */
    setTotalCredits(packsData.reduce((s: number, p: BulkCreditPack) => s + p.credits_remaining, 0));
    setTotalUsed(packsData.reduce((s: number, p: BulkCreditPack) => s + (p.pack_size - p.credits_remaining), 0));

    /* Sessions */
    const packIds = packsData.map((p: BulkCreditPack) => p.id);
    const { data: sess } = await supabase
      .from("report_sessions")
      .select("id, bulk_credit_id, client_email, client_name, status, created_at, intake_url, businesses(business_name), reports(id)")
      .in("bulk_credit_id", packIds)
      .order("created_at", { ascending: false });

    if (sess) {
      setSessions(sess as ReportSession[]);
      setActiveReports(sess.filter((s: ReportSession) => ACTIVE_STATUSES.includes(s.status)).length);
      setCompletedReports(sess.filter((s: ReportSession) => s.status === "complete").length);
    }

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Assign credit handler ───────────────────────────────────────── */

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignForm.client_email.trim()) return;
    setAssignBusy(true);
    setAssignMsg(null);
    setAssignUrl(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bulk/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          client_email: assignForm.client_email.trim(),
          client_name: assignForm.client_name.trim() || undefined,
          business_name: assignForm.business_name.trim() || undefined,
        }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Request failed (${res.status})`); }
      const data = await res.json();
      setAssignMsg("Credit assigned successfully!");
      setAssignUrl(data.intake_url || null);
      setAssignForm({ client_email: "", client_name: "", business_name: "" });
      loadData();
    } catch (err: unknown) {
      setAssignMsg(`Error: ${err instanceof Error ? err.message : "Something went wrong"}`);
    }
    setAssignBusy(false);
  }

  /* ── Save white-label handler ────────────────────────────────────── */

  async function handleSaveWl(e: React.FormEvent) {
    e.preventDefault();
    setWlBusy(true);
    setWlMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/agency/white-label`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(wlForm),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Request failed (${res.status})`); }
      setWlMsg("White-label configuration saved.");
      loadData();
    } catch (err: unknown) {
      setWlMsg(`Error: ${err instanceof Error ? err.message : "Something went wrong"}`);
    }
    setWlBusy(false);
  }

  /* ── Loading ─────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-midnight">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-harper-gold border-t-transparent" />
      </main>
    );
  }

  /* ── Empty state ─────────────────────────────────────────────────── */

  if (packs.length === 0) {
    return (
      <main className="min-h-screen bg-midnight">
        <Nav />
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <div className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-12">
            <h2 className="font-display text-2xl font-bold text-chalk">Welcome to the Harper Agency Program</h2>
            <p className="mt-4 text-chalk/60 leading-relaxed">
              Purchase a bulk credit pack to unlock the agency portal. Assign credits to clients,
              white-label your reports, and manage everything from one dashboard.
            </p>
            <Link href="/agencies">
              <Button className="mt-8" size="lg">Explore Agency Plans</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ── Main render ─────────────────────────────────────────────────── */

  const STATS = [
    { label: "Credits Remaining", value: totalCredits.toLocaleString(), color: "text-chalk" },
    { label: "Credits Used", value: totalUsed.toLocaleString(), color: "text-chalk" },
    { label: "Active Reports", value: activeReports.toString(), color: "text-score-amber" },
    { label: "Completed Reports", value: completedReports.toString(), color: "text-score-green" },
  ];

  return (
    <main className="min-h-screen bg-midnight">
      <Nav />

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <p className="mb-1 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">Agency Portal</p>
          <h1 className="font-display text-3xl font-bold text-chalk">{agencyName}</h1>
        </div>

        {/* Stats Cards */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-chalk/40">{s.label}</p>
              <p className={`mt-2 font-display text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-chalk/40">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => { setShowAssign(!showAssign); setAssignMsg(null); setAssignUrl(null); }}>
              {showAssign ? "Close" : "Assign Credit"}
            </Button>
            <Link href="/agencies#pricing"><Button variant="secondary">Buy More Credits</Button></Link>
            <Button variant="secondary" disabled>Download All Reports</Button>
          </div>

          {showAssign && (
            <form onSubmit={handleAssign} className="mt-4 max-w-lg rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6">
              <h3 className="mb-4 font-display text-lg font-semibold text-chalk">Assign a Credit</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="assign-email" className="mb-1.5 block text-sm font-medium text-chalk/80">
                    Client Email <span className="text-harper-gold">*</span>
                  </label>
                  <input id="assign-email" type="email" required value={assignForm.client_email}
                    onChange={(e) => setAssignForm((f) => ({ ...f, client_email: e.target.value }))}
                    placeholder="client@example.com" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="assign-name" className="mb-1.5 block text-sm font-medium text-chalk/80">Client Name</label>
                    <input id="assign-name" type="text" value={assignForm.client_name}
                      onChange={(e) => setAssignForm((f) => ({ ...f, client_name: e.target.value }))}
                      placeholder="Jane Smith" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="assign-biz" className="mb-1.5 block text-sm font-medium text-chalk/80">Business Name</label>
                    <input id="assign-biz" type="text" value={assignForm.business_name}
                      onChange={(e) => setAssignForm((f) => ({ ...f, business_name: e.target.value }))}
                      placeholder="Acme Ltd" className={inputCls} />
                  </div>
                </div>
                <Button type="submit" disabled={assignBusy || !assignForm.client_email} className="w-full">
                  {assignBusy ? "Assigning\u2026" : "Assign Credit"}
                </Button>
                {assignMsg && (
                  <p className={`text-sm ${assignMsg.startsWith("Error") ? "text-score-red" : "text-score-green"}`}>{assignMsg}</p>
                )}
                {assignUrl && (
                  <div className="rounded-xl border border-score-green/20 bg-score-green/5 p-3">
                    <p className="mb-1 text-xs font-medium text-chalk/60">Intake URL (share with client):</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate text-xs text-harper-gold">{assignUrl}</code>
                      <button type="button" onClick={() => copy(assignUrl, "assign-url")}
                        className="shrink-0 rounded-lg bg-chalk/10 px-2.5 py-1 text-xs font-medium text-chalk/70 transition-colors hover:bg-chalk/20">
                        {copiedId === "assign-url" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* White-Label Configuration */}
        <div className="mb-10 rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-chalk/40">White-Label Configuration</h2>
          {hasWl ? (
            <form onSubmit={handleSaveWl} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="wl-name" className="mb-1.5 block text-sm font-medium text-chalk/80">Agency Name</label>
                  <input id="wl-name" type="text" value={wlForm.agency_name}
                    onChange={(e) => setWlForm((f) => ({ ...f, agency_name: e.target.value }))}
                    placeholder="Your Agency Name" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="wl-colour" className="mb-1.5 block text-sm font-medium text-chalk/80">Brand Colour</label>
                  <div className="flex items-center gap-3">
                    <input id="wl-colour" type="text" value={wlForm.brand_colour}
                      onChange={(e) => setWlForm((f) => ({ ...f, brand_colour: e.target.value }))}
                      placeholder="#C9A84C" className={`${inputCls} font-mono`} />
                    <div className="h-10 w-10 shrink-0 rounded-lg border border-chalk/15" style={{ backgroundColor: wlForm.brand_colour }} />
                  </div>
                </div>
                <div>
                  <label htmlFor="wl-logo" className="mb-1.5 block text-sm font-medium text-chalk/80">Logo URL</label>
                  <input id="wl-logo" type="url" value={wlForm.logo_url}
                    onChange={(e) => setWlForm((f) => ({ ...f, logo_url: e.target.value }))}
                    placeholder="https://example.com/logo.png" className={inputCls} />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button type="submit" size="sm" disabled={wlBusy}>{wlBusy ? "Saving\u2026" : "Save Configuration"}</Button>
                {wlMsg && <p className={`text-sm ${wlMsg.startsWith("Error") ? "text-score-red" : "text-score-green"}`}>{wlMsg}</p>}
              </div>
            </form>
          ) : (
            <div className="py-8 text-center">
              <p className="mb-4 text-chalk/50">
                White-label branding is available with our premium packs. Customise reports with your agency name, logo, and brand colours.
              </p>
              <Link href="/agencies#pricing"><Button variant="secondary">Upgrade to White-Label</Button></Link>
            </div>
          )}
        </div>

        {/* Credit Packs Table */}
        <div className="mb-10 rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-chalk/40">Credit Packs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-chalk/10">
                  <th className="pb-3 pr-4 font-medium text-chalk/50">Pack Name</th>
                  <th className="pb-3 pr-4 font-medium text-chalk/50">Purchased</th>
                  <th className="pb-3 pr-4 font-medium text-chalk/50">Credits Remaining</th>
                  <th className="pb-3 font-medium text-chalk/50">White-Label</th>
                </tr>
              </thead>
              <tbody>
                {packs.map((pack) => {
                  const pct = pack.pack_size > 0 ? ((pack.pack_size - pack.credits_remaining) / pack.pack_size) * 100 : 0;
                  return (
                    <tr key={pack.id} className="border-b border-chalk/5 last:border-0">
                      <td className="py-3 pr-4 font-medium text-chalk">{pack.pack_size}-Credit Pack</td>
                      <td className="py-3 pr-4 text-chalk/40">{fmtDate(pack.created_at)}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-chalk/10">
                            <div className="h-full rounded-full bg-harper-gold transition-all" style={{ width: `${100 - pct}%` }} />
                          </div>
                          <span className="text-xs text-chalk/60">{pack.credits_remaining} / {pack.pack_size}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          pack.is_white_label ? "bg-harper-gold/10 text-harper-gold" : "bg-chalk/10 text-chalk/40"
                        }`}>
                          {pack.is_white_label ? "Yes" : "No"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Client Reports Table */}
        <div className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-chalk/40">Client Reports</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-chalk/10">
                  <th className="pb-3 pr-4 font-medium text-chalk/50">Client / Business</th>
                  <th className="pb-3 pr-4 font-medium text-chalk/50">Status</th>
                  <th className="pb-3 pr-4 font-medium text-chalk/50">Assigned</th>
                  <th className="pb-3 font-medium text-chalk/50">Intake URL</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-chalk/30">No client reports yet. Assign a credit to get started.</td>
                  </tr>
                ) : (
                  sessions.map((s) => {
                    const reportId = s.reports && s.reports.length > 0 ? s.reports[0].id : null;
                    const badge = (
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[s.status] || DEFAULT_STATUS_CLASS}`}>
                        {s.status}
                      </span>
                    );
                    return (
                      <tr key={s.id} className="border-b border-chalk/5 last:border-0">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-chalk">{s.client_name || s.client_email}</p>
                          <p className="text-xs text-chalk/40">{s.businesses?.business_name || "\u2014"}</p>
                        </td>
                        <td className="py-3 pr-4">
                          {s.status === "complete" && reportId ? (
                            <Link href={`/report/${reportId}`} className="group inline-flex items-center gap-1">
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[s.status]} group-hover:underline`}>
                                {s.status}
                              </span>
                            </Link>
                          ) : badge}
                        </td>
                        <td className="py-3 pr-4 text-chalk/40">{fmtDate(s.created_at)}</td>
                        <td className="py-3">
                          {s.intake_url ? (
                            <button onClick={() => copy(s.intake_url!, s.id)}
                              className="rounded-lg bg-chalk/10 px-2.5 py-1 text-xs font-medium text-chalk/70 transition-colors hover:bg-chalk/20">
                              {copiedId === s.id ? "Copied!" : "Copy URL"}
                            </button>
                          ) : <span className="text-xs text-chalk/20">&mdash;</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Nav                                                                */
/* ------------------------------------------------------------------ */

function Nav() {
  return (
    <nav className="border-b border-chalk/10 bg-midnight">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold text-harper-gold">Harper.</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-chalk/60 transition-colors hover:text-chalk">Dashboard</Link>
          <Link href="/agency" className="text-sm font-medium text-harper-gold">Agency Portal</Link>
        </div>
      </div>
    </nav>
  );
}
