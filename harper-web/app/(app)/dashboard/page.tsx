"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { ScoreRing } from "@/components/ui/score-ring";
import { Button } from "@/components/ui/button";
import { getScoreColour } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = "overview" | "reports" | "recommendations" | "tools";

interface Profile {
  id: string;
  full_name: string | null;
  country: string | null;
}

interface Business {
  id: string;
  name: string;
  industry: string | null;
  website_url: string | null;
  team_size_range: string | null;
  country: string | null;
  intelligence_summary: string | null;
}

interface BusinessIntelligence {
  current_tools: Record<string, unknown>[] | null;
  known_pain_points: unknown[] | null;
  automation_opportunities: unknown[] | null;
  next_best_action: string | null;
  next_best_action_reason: string | null;
  icp_fit_score: number | null;
  growth_trajectory: string | null;
}

interface ReportSession {
  id: string;
  report_type: string;
  status: string;
  created_at: string;
  report_generated_at: string | null;
}

interface Report {
  id: string;
  session_id: string;
  report_type: string;
  score_overall: number | null;
  score_breakdown: Record<string, unknown> | null;
  recommended_next_step: string | null;
  recommended_next_step_reason: string | null;
  created_at: string;
  report_sessions: {
    status: string;
    report_type: string;
  } | null;
}

interface ToolRecommendation {
  id: string;
  tool_name: string;
  tool_category: string | null;
  recommendation_tier: string | null;
  reason: string | null;
  replaces_what: string | null;
  estimated_monthly_cost: string | null;
  implementation_effort: string | null;
  harper_can_implement: boolean;
  implementation_product: string | null;
  status: string;
}

// Recommendations are stored in report_json; we extract them into this shape.
interface Recommendation {
  id: string;
  title: string;
  category: string;
  priority: "high" | "medium" | "low";
  status: "recommended" | "acted_on" | "declined";
  report_id: string;
}

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

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  business_intelligence: "Business Intelligence",
  tech_stack_audit: "Tech Stack Audit",
  franchise_intelligence: "Franchise Intelligence",
  growth_audit: "Growth Audit",
  deep_dive_audit: "Deep Dive Audit",
  scorecard: "Scorecard",
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  complete: {
    label: "Complete",
    cls: "bg-score-green/10 text-score-green",
  },
  generating: {
    label: "Generating",
    cls: "bg-score-amber/10 text-score-amber",
  },
  in_progress: {
    label: "In Progress",
    cls: "bg-score-amber/10 text-score-amber",
  },
  researching: {
    label: "Researching",
    cls: "bg-harper-gold/10 text-harper-gold",
  },
  pending: {
    label: "Pending",
    cls: "bg-chalk/10 text-chalk/60",
  },
  failed: {
    label: "Failed",
    cls: "bg-score-red/10 text-score-red",
  },
};

function statusBadge(status: string) {
  const s = STATUS_LABELS[status] ?? { label: status, cls: "bg-chalk/10 text-chalk/60" };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

const TOOL_CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  crm_sales: { label: "CRM & Sales", icon: "📊" },
  marketing_seo: { label: "Marketing & SEO", icon: "📈" },
  automation_ops: { label: "Automation & Ops", icon: "⚙" },
  ai_assistants: { label: "AI Assistants", icon: "🤖" },
  website_design: { label: "Website & Design", icon: "🌐" },
  analytics_reporting: { label: "Analytics & Reporting", icon: "📉" },
};

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function priorityBadge(priority: string) {
  const cls =
    priority === "high"
      ? "border-score-red/20 bg-score-red/10 text-score-red"
      : priority === "medium"
      ? "border-score-amber/20 bg-score-amber/10 text-score-amber"
      : "border-score-green/20 bg-score-green/10 text-score-green";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {priority}
    </span>
  );
}

function recStatusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    recommended: { label: "Recommended", cls: "bg-harper-gold/10 text-harper-gold border-harper-gold/20" },
    acted_on: { label: "Acted On", cls: "bg-score-green/10 text-score-green border-score-green/20" },
    declined: { label: "Declined", cls: "bg-chalk/10 text-chalk/40 border-chalk/10" },
  };
  const s = map[status] ?? map.recommended;
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Skeleton / empty states
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-harper-gold border-t-transparent" />
    </div>
  );
}

function EmptyState({ message, cta }: { message: string; cta?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-chalk/10 bg-chalk/[0.02] py-16 text-center">
      <p className="text-sm text-chalk/40">{message}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card wrapper
// ---------------------------------------------------------------------------

function Card({
  title,
  children,
  className = "",
  action,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && (
            <h2 className="text-sm font-semibold uppercase tracking-wider text-chalk/40">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Data
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [intelligence, setIntelligence] = useState<BusinessIntelligence | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [sessions, setSessions] = useState<ReportSession[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [toolRecs, setToolRecs] = useState<ToolRecommendation[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createBrowserClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      // 1. Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, country")
        .eq("id", user.id)
        .single();

      if (profileData) setProfile(profileData);

      // 2. Business via membership
      const { data: memberRow } = await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!memberRow) {
        setLoading(false);
        return;
      }

      const businessId = memberRow.business_id;

      // Parallel fetches for the business
      const [
        { data: bizData },
        { data: intelData },
        { data: reportsData },
        { data: sessionsData },
        { data: toolRecsData },
      ] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, name, industry, website_url, team_size_range, country, intelligence_summary")
          .eq("id", businessId)
          .single(),
        supabase
          .from("business_intelligence")
          .select(
            "current_tools, known_pain_points, automation_opportunities, next_best_action, next_best_action_reason, icp_fit_score, growth_trajectory"
          )
          .eq("business_id", businessId)
          .single(),
        supabase
          .from("reports")
          .select("id, session_id, report_type, score_overall, score_breakdown, recommended_next_step, recommended_next_step_reason, created_at, report_sessions(status, report_type)")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false }),
        supabase
          .from("report_sessions")
          .select("id, report_type, status, created_at, report_generated_at")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false }),
        supabase
          .from("tool_recommendations")
          .select("id, tool_name, tool_category, recommendation_tier, reason, replaces_what, estimated_monthly_cost, implementation_effort, harper_can_implement, implementation_product, status")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false }),
      ]);

      if (bizData) setBusiness(bizData);
      if (intelData) setIntelligence(intelData);
      if (reportsData) setReports(reportsData as Report[]);
      if (sessionsData) setSessions(sessionsData);
      if (toolRecsData) setToolRecs(toolRecsData);

      // Extract recommendations from report JSON
      const allRecs: Recommendation[] = [];
      if (reportsData) {
        for (const report of reportsData as Report[]) {
          const breakdown = report.score_breakdown;
          if (breakdown && typeof breakdown === "object") {
            // Try common structures: breakdown.recommendations or breakdown.sections[].recommendations
            const sections = (breakdown as Record<string, unknown>).sections;
            if (Array.isArray(sections)) {
              for (const section of sections) {
                const sectionRecs = (section as Record<string, unknown>).recommendations;
                if (Array.isArray(sectionRecs)) {
                  for (const r of sectionRecs) {
                    const rec = r as Record<string, unknown>;
                    allRecs.push({
                      id: `${report.id}-${allRecs.length}`,
                      title: (rec.title as string) || (rec.recommendation as string) || "Untitled",
                      category: (rec.category as string) || (section as Record<string, unknown>).name as string || "General",
                      priority: (["high", "medium", "low"].includes(rec.priority as string)
                        ? rec.priority
                        : "medium") as "high" | "medium" | "low",
                      status: (["recommended", "acted_on", "declined"].includes(rec.status as string)
                        ? rec.status
                        : "recommended") as "recommended" | "acted_on" | "declined",
                      report_id: report.id,
                    });
                  }
                }
              }
            }
            // Also try top-level recommendations array
            const topRecs = (breakdown as Record<string, unknown>).recommendations;
            if (Array.isArray(topRecs)) {
              for (const r of topRecs) {
                const rec = r as Record<string, unknown>;
                allRecs.push({
                  id: `${report.id}-top-${allRecs.length}`,
                  title: (rec.title as string) || (rec.recommendation as string) || "Untitled",
                  category: (rec.category as string) || "General",
                  priority: (["high", "medium", "low"].includes(rec.priority as string)
                    ? rec.priority
                    : "medium") as "high" | "medium" | "low",
                  status: (["recommended", "acted_on", "declined"].includes(rec.status as string)
                    ? rec.status
                    : "recommended") as "recommended" | "acted_on" | "declined",
                  report_id: report.id,
                });
              }
            }
          }
        }
      }
      allRecs.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1));
      setRecommendations(allRecs);

      setLoading(false);
    }

    load();
  }, [router]);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const latestReport = reports.length > 0 ? reports[0] : null;
  const averageScore =
    reports.length > 0
      ? Math.round(
          reports.filter((r) => r.score_overall != null).reduce((sum, r) => sum + (r.score_overall ?? 0), 0) /
            (reports.filter((r) => r.score_overall != null).length || 1)
        )
      : null;
  const daysSinceLastReport = latestReport ? daysSince(latestReport.created_at) : null;

  const highRecs = recommendations.filter((r) => r.priority === "high");
  const mediumRecs = recommendations.filter((r) => r.priority === "medium");
  const lowRecs = recommendations.filter((r) => r.priority === "low");

  // Group tools by category
  const toolsByCategory = toolRecs.reduce<Record<string, ToolRecommendation[]>>((acc, t) => {
    const cat = t.tool_category ?? "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  // Current tools from intelligence
  const currentTools: { name: string; category?: string }[] = Array.isArray(intelligence?.current_tools)
    ? (intelligence.current_tools as { name: string; category?: string }[])
    : [];

  // ---------------------------------------------------------------------------
  // Tab content renderers
  // ---------------------------------------------------------------------------

  function renderOverview() {
    return (
      <div className="space-y-8">
        {/* Top row: profile + latest score */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Business profile card */}
          <Card title="Business Profile" className="lg:col-span-1">
            {business ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-chalk/40">Business Name</p>
                  <p className="text-sm font-medium text-chalk">{business.name}</p>
                </div>
                {business.industry && (
                  <div>
                    <p className="text-xs text-chalk/40">Industry</p>
                    <p className="text-sm text-chalk/70">{business.industry}</p>
                  </div>
                )}
                {business.website_url && (
                  <div>
                    <p className="text-xs text-chalk/40">Website</p>
                    <a
                      href={business.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-harper-gold hover:underline"
                    >
                      {business.website_url}
                    </a>
                  </div>
                )}
                {business.team_size_range && (
                  <div>
                    <p className="text-xs text-chalk/40">Team Size</p>
                    <p className="text-sm text-chalk/70">{business.team_size_range}</p>
                  </div>
                )}
                {business.country && (
                  <div>
                    <p className="text-xs text-chalk/40">Country</p>
                    <p className="text-sm text-chalk/70">{business.country}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-chalk/40">
                No business profile yet. Complete your first report to get started.
              </p>
            )}
          </Card>

          {/* Latest report score */}
          <Card title="Latest Report" className="lg:col-span-1">
            {latestReport && latestReport.score_overall != null ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <ScoreRing score={latestReport.score_overall} size={100} strokeWidth={6} animated />
                <p className="text-xs text-chalk/40">{formatDate(latestReport.created_at)}</p>
                <p className="text-xs font-medium text-chalk/60">
                  {REPORT_TYPE_LABELS[latestReport.report_type] ?? latestReport.report_type}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-sm text-chalk/40">No reports yet</p>
                <Link href="/reports">
                  <Button size="sm" className="mt-4">
                    Get Your First Report
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Intelligence summary + next action */}
          <Card title="Intelligence Summary" className="lg:col-span-1">
            {business?.intelligence_summary ? (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-chalk/70">{business.intelligence_summary}</p>
                {intelligence?.next_best_action && (
                  <div className="rounded-xl border border-harper-gold/20 bg-harper-gold/5 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-harper-gold">
                      Next Recommended Action
                    </p>
                    <p className="text-sm text-chalk/80">{intelligence.next_best_action}</p>
                    {intelligence.next_best_action_reason && (
                      <p className="mt-1 text-xs text-chalk/40">{intelligence.next_best_action_reason}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-chalk/40">
                Intelligence data will appear here after your first report is analysed.
              </p>
            )}
          </Card>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <p className="text-2xl font-bold text-chalk font-display">{reports.length}</p>
            <p className="mt-1 text-xs text-chalk/40">Total Reports</p>
          </Card>
          <Card className="text-center">
            {averageScore != null ? (
              <>
                <p className="text-2xl font-bold font-display" style={{ color: getScoreColour(averageScore) }}>
                  {averageScore}
                </p>
                <p className="mt-1 text-xs text-chalk/40">Average Score</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-chalk/20 font-display">--</p>
                <p className="mt-1 text-xs text-chalk/40">Average Score</p>
              </>
            )}
          </Card>
          <Card className="text-center">
            {daysSinceLastReport != null ? (
              <>
                <p className="text-2xl font-bold text-chalk font-display">{daysSinceLastReport}</p>
                <p className="mt-1 text-xs text-chalk/40">Days Since Last Report</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-chalk/20 font-display">--</p>
                <p className="mt-1 text-xs text-chalk/40">Days Since Last Report</p>
              </>
            )}
          </Card>
        </div>
      </div>
    );
  }

  function renderReports() {
    // Merge sessions that don't have a report yet with the report list
    const reportSessionIds = new Set(reports.map((r) => r.session_id));
    const pendingSessions = sessions.filter((s) => !reportSessionIds.has(s.id) && s.status !== "complete");

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-chalk/40">
            Report History
          </h2>
          <Link href="/reports">
            <Button size="sm">New Report</Button>
          </Link>
        </div>

        {reports.length === 0 && pendingSessions.length === 0 ? (
          <EmptyState
            message="No reports yet. Start your first diagnostic to see results here."
            cta={
              <Link href="/reports">
                <Button>Get Your First Report</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {/* In-progress sessions without a report */}
            {pendingSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-xl border border-chalk/10 bg-chalk/[0.02] p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-chalk/10">
                    <div className="h-3 w-3 animate-pulse rounded-full bg-harper-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-chalk">
                      {REPORT_TYPE_LABELS[session.report_type] ?? session.report_type}
                    </p>
                    <p className="text-xs text-chalk/40">{formatDate(session.created_at)}</p>
                  </div>
                </div>
                {statusBadge(session.status)}
              </div>
            ))}

            {/* Completed reports */}
            {reports.map((report) => {
              const sessionStatus = report.report_sessions?.status ?? "complete";
              return (
                <Link
                  key={report.id}
                  href={`/report/${report.id}`}
                  className="flex items-center justify-between rounded-xl border border-chalk/10 bg-chalk/[0.02] p-4 transition-all hover:border-harper-gold/20 hover:bg-chalk/[0.04]"
                >
                  <div className="flex items-center gap-4">
                    {report.score_overall != null ? (
                      <ScoreRing
                        score={report.score_overall}
                        size={44}
                        strokeWidth={4}
                        animated={false}
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-chalk/10">
                        <span className="text-xs text-chalk/30">--</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-chalk">
                        {REPORT_TYPE_LABELS[report.report_type] ?? report.report_type}
                      </p>
                      <p className="text-xs text-chalk/40">{formatDate(report.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(sessionStatus)}
                    <svg
                      className="h-4 w-4 text-chalk/30"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function renderRecommendations() {
    if (recommendations.length === 0) {
      return (
        <EmptyState
          message="Complete your first report to see personalised recommendations."
          cta={
            <Link href="/reports">
              <Button>Get Your First Report</Button>
            </Link>
          }
        />
      );
    }

    function renderRecGroup(label: string, recs: Recommendation[]) {
      if (recs.length === 0) return null;
      return (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-chalk/30">{label}</h3>
          {recs.map((rec) => (
            <div
              key={rec.id}
              className="flex items-center justify-between rounded-xl border border-chalk/10 bg-chalk/[0.02] p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${
                    rec.priority === "high"
                      ? "bg-score-red"
                      : rec.priority === "medium"
                      ? "bg-score-amber"
                      : "bg-score-green"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-chalk">{rec.title}</p>
                  <p className="text-xs text-chalk/30">{rec.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {recStatusBadge(rec.status)}
                {priorityBadge(rec.priority)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Tool recommendations section
    const toolRecsForDisplay = toolRecs.filter((t) => t.status === "recommended");

    return (
      <div className="space-y-8">
        {renderRecGroup("High Priority", highRecs)}
        {renderRecGroup("Medium Priority", mediumRecs)}
        {renderRecGroup("Low Priority", lowRecs)}

        {toolRecsForDisplay.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-chalk/30">
              Tool Recommendations
            </h3>
            {toolRecsForDisplay.map((tool) => (
              <div
                key={tool.id}
                className="flex items-center justify-between rounded-xl border border-chalk/10 bg-chalk/[0.02] p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-chalk">{tool.tool_name}</p>
                    {tool.harper_can_implement && (
                      <span className="rounded-full bg-harper-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-harper-gold">
                        Harper can implement
                      </span>
                    )}
                  </div>
                  {tool.reason && <p className="mt-1 text-xs text-chalk/40">{tool.reason}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {tool.estimated_monthly_cost && (
                    <span className="text-xs text-chalk/50">{tool.estimated_monthly_cost}/mo</span>
                  )}
                  {tool.recommendation_tier && (
                    <span className="text-[10px] uppercase tracking-wider text-chalk/30">
                      {tool.recommendation_tier}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderTools() {
    const hasCurrentTools = currentTools.length > 0;
    const hasRecommendedTools = toolRecs.length > 0;

    if (!hasCurrentTools && !hasRecommendedTools) {
      return (
        <EmptyState
          message="Tool data will appear here after your first report is analysed."
          cta={
            <Link href="/reports">
              <Button>Get Your First Report</Button>
            </Link>
          }
        />
      );
    }

    return (
      <div className="space-y-8">
        {/* Current tools */}
        {hasCurrentTools && (
          <Card title="Current Tools in Use">
            <div className="grid gap-3 sm:grid-cols-2">
              {currentTools.map((tool, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-chalk/10 bg-chalk/[0.02] p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chalk/5 text-sm">
                    {TOOL_CATEGORY_LABELS[tool.category ?? ""]?.icon ?? "~"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-chalk">{tool.name}</p>
                    {tool.category && (
                      <p className="text-xs text-chalk/40">
                        {TOOL_CATEGORY_LABELS[tool.category]?.label ?? tool.category}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recommended tools by category */}
        {hasRecommendedTools && (
          <div className="space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-chalk/40">
              Recommended Tools
            </h2>
            {Object.entries(toolsByCategory).map(([category, tools]) => {
              const catInfo = TOOL_CATEGORY_LABELS[category] ?? { label: category, icon: "~" };
              return (
                <Card key={category}>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-base">{catInfo.icon}</span>
                    <h3 className="text-sm font-semibold text-chalk">{catInfo.label}</h3>
                  </div>
                  <div className="space-y-3">
                    {tools.map((tool) => (
                      <div
                        key={tool.id}
                        className="flex items-center justify-between rounded-xl border border-chalk/10 bg-chalk/[0.02] p-4"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-chalk">{tool.tool_name}</p>
                            {tool.harper_can_implement && (
                              <span className="rounded-full bg-harper-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-harper-gold">
                                Harper can implement
                              </span>
                            )}
                            {tool.recommendation_tier && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                                  tool.recommendation_tier === "essential"
                                    ? "bg-score-green/10 text-score-green"
                                    : tool.recommendation_tier === "recommended"
                                    ? "bg-harper-gold/10 text-harper-gold"
                                    : tool.recommendation_tier === "avoid"
                                    ? "bg-score-red/10 text-score-red"
                                    : "bg-chalk/10 text-chalk/50"
                                }`}
                              >
                                {tool.recommendation_tier}
                              </span>
                            )}
                          </div>
                          {tool.reason && (
                            <p className="mt-1 text-xs text-chalk/40">{tool.reason}</p>
                          )}
                          {tool.replaces_what && (
                            <p className="mt-0.5 text-xs text-chalk/30">
                              Replaces: {tool.replaces_what}
                            </p>
                          )}
                        </div>
                        <div className="ml-4 flex flex-col items-end gap-1">
                          {tool.estimated_monthly_cost && (
                            <span className="text-xs font-medium text-chalk/60">
                              {tool.estimated_monthly_cost}/mo
                            </span>
                          )}
                          {tool.implementation_effort && (
                            <span className="text-[10px] text-chalk/30">
                              {tool.implementation_effort}
                            </span>
                          )}
                          {tool.harper_can_implement && tool.implementation_product && (
                            <Link href="/reports">
                              <Button size="sm" className="mt-1 text-xs">
                                Get Started
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "reports", label: "Reports" },
    { key: "recommendations", label: "Recommendations" },
    { key: "tools", label: "Tools" },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-midnight">
        {/* Nav shown even while loading */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-harper-gold/10 bg-midnight/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="font-display text-xl font-bold text-chalk">
              Harper<span className="text-harper-gold">.</span>
            </Link>
          </div>
        </nav>
        <Spinner />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-midnight px-6 pb-12">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-harper-gold/10 bg-midnight/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-display text-xl font-bold text-chalk">
            Harper<span className="text-harper-gold">.</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-harper-gold"
            >
              Dashboard
            </Link>
            <Link
              href="/reports"
              className="text-sm text-chalk/70 transition-colors hover:text-chalk"
            >
              New Report
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl pt-24">
        {/* Welcome Header */}
        <div className="mb-8">
          <p className="mb-1 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
            Dashboard
          </p>
          <h1 className="font-display text-3xl font-bold text-chalk">
            {business
              ? `Welcome back, ${business.name}`
              : profile?.full_name
              ? `Welcome back, ${profile.full_name}`
              : "Welcome back"}
          </h1>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-1 rounded-xl border border-chalk/10 bg-chalk/[0.02] p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-harper-gold/10 text-harper-gold"
                  : "text-chalk/40 hover:text-chalk/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && renderOverview()}
        {activeTab === "reports" && renderReports()}
        {activeTab === "recommendations" && renderRecommendations()}
        {activeTab === "tools" && renderTools()}
      </div>
    </main>
  );
}
