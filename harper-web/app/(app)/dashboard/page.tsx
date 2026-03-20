"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { ScoreRing } from "@/components/ui/score-ring";

interface BusinessProfile {
  business_name: string;
  industry: string;
  website_url: string | null;
  employee_count: number;
}

interface ReportSummary {
  id: string;
  overall_score: number;
  generated_at: string;
  status: string;
}

interface Recommendation {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  category: string;
  completed: boolean;
}

function getScoreStrokeColor(score: number): string {
  if (score >= 70) return "#2D6A4F";
  if (score >= 40) return "#D4A017";
  return "#C0392B";
}

function getPriorityClasses(priority: string): string {
  switch (priority) {
    case "high":
      return "border-score-red/20 bg-score-red/10 text-score-red";
    case "medium":
      return "border-score-amber/20 bg-score-amber/10 text-score-amber";
    default:
      return "border-score-green/20 bg-score-green/10 text-score-green";
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createBrowserClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from("business_profiles")
        .select("business_name, industry, website_url, employee_count")
        .eq("user_id", user.id)
        .single();

      if (profileData) setProfile(profileData);

      // Fetch reports
      const { data: reportsData } = await supabase
        .from("reports")
        .select("id, overall_score, generated_at, status")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false });

      if (reportsData) setReports(reportsData);

      // Fetch recommendations
      const { data: recsData } = await supabase
        .from("recommendations")
        .select("id, title, priority, category, completed")
        .eq("user_id", user.id)
        .order("priority", { ascending: true })
        .limit(10);

      if (recsData) setRecommendations(recsData);

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-midnight">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-harper-gold border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-midnight px-6 py-12">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-harper-gold/10 bg-midnight/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-display text-xl font-bold text-chalk">
            Harper<span className="text-harper-gold">.</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/reports"
              className="text-sm text-chalk/70 transition-colors hover:text-chalk"
            >
              New Report
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl pt-16">
        {/* Welcome Header */}
        <div className="mb-10">
          <p className="mb-1 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
            Dashboard
          </p>
          <h1 className="font-display text-3xl font-bold text-chalk">
            {profile ? `Welcome back, ${profile.business_name}` : "Welcome back"}
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Business Profile Card */}
          <div className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-chalk/40">
              Business Profile
            </h2>
            {profile ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-chalk/40">Business Name</p>
                  <p className="text-sm font-medium text-chalk">
                    {profile.business_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-chalk/40">Industry</p>
                  <p className="text-sm text-chalk/70">{profile.industry}</p>
                </div>
                {profile.website_url && (
                  <div>
                    <p className="text-xs text-chalk/40">Website</p>
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-harper-gold hover:underline"
                    >
                      {profile.website_url}
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-xs text-chalk/40">Team Size</p>
                  <p className="text-sm text-chalk/70">
                    {profile.employee_count} employees
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-chalk/40">
                No profile yet. Complete your first report to get started.
              </p>
            )}
          </div>

          {/* Reports History */}
          <div className="lg:col-span-2 rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-chalk/40">
                Report History
              </h2>
              <Link
                href="/reports"
                className="text-xs font-medium text-harper-gold hover:underline"
              >
                New Report
              </Link>
            </div>
            {reports.length > 0 ? (
              <div className="space-y-3">
                {reports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/report/${report.id}`}
                    className="flex items-center justify-between rounded-xl border border-chalk/10 bg-chalk/[0.02] p-4 transition-all hover:border-harper-gold/20 hover:bg-chalk/[0.04]"
                  >
                    <div className="flex items-center gap-4">
                      <ScoreRing
                        score={report.overall_score}
                        size={44}
                        strokeWidth={4}
                        color={getScoreStrokeColor(report.overall_score)}
                        animated={false}
                      />
                      <div>
                        <p className="text-sm font-medium text-chalk">
                          Diagnostic Report
                        </p>
                        <p className="text-xs text-chalk/40">
                          {new Date(report.generated_at).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {report.status === "completed" ? (
                        <span className="rounded-full bg-score-green/10 px-2.5 py-0.5 text-xs text-score-green">
                          Complete
                        </span>
                      ) : (
                        <span className="rounded-full bg-score-amber/10 px-2.5 py-0.5 text-xs text-score-amber">
                          {report.status}
                        </span>
                      )}
                      <svg
                        className="h-4 w-4 text-chalk/30"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-chalk/40">No reports yet.</p>
                <Link
                  href="/reports"
                  className="mt-4 rounded-full bg-harper-gold px-6 py-2.5 text-sm font-semibold text-midnight transition-all hover:bg-harper-gold/90"
                >
                  Get Your First Report
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-8 rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-chalk/40">
            Top Recommendations
          </h2>
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={`flex items-center justify-between rounded-xl border border-chalk/10 p-4 ${
                    rec.completed ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        rec.priority === "high"
                          ? "bg-score-red"
                          : rec.priority === "medium"
                          ? "bg-score-amber"
                          : "bg-score-green"
                      }`}
                    />
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          rec.completed
                            ? "text-chalk/40 line-through"
                            : "text-chalk"
                        }`}
                      >
                        {rec.title}
                      </p>
                      <p className="text-xs text-chalk/30">{rec.category}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${getPriorityClasses(
                      rec.priority
                    )}`}
                  >
                    {rec.priority}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-chalk/40">
              Complete your first report to see personalised recommendations.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
