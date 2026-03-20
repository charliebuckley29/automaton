"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { ScoreRing } from "@/components/ui/score-ring";

interface ReportSection {
  title: string;
  score: number;
  summary: string;
  findings: string[];
  recommendations: string[];
}

interface ReportData {
  id: string;
  business_name: string;
  overall_score: number;
  generated_at: string;
  sections: {
    seo: ReportSection;
    local_presence: ReportSection;
    operations: ReportSection;
    digital_maturity: ReportSection;
    growth_potential: ReportSection;
    competitive_position: ReportSection;
  };
  executive_summary: string;
  priority_actions: string[];
}

const sectionOrder = [
  "seo",
  "local_presence",
  "operations",
  "digital_maturity",
  "growth_potential",
  "competitive_position",
] as const;

function getScoreColor(score: number): string {
  if (score >= 70) return "text-score-green";
  if (score >= 40) return "text-score-amber";
  return "text-score-red";
}

function getScoreStrokeColor(score: number): string {
  if (score >= 70) return "#2D6A4F";
  if (score >= 40) return "#D4A017";
  return "#C0392B";
}

export default function ReportPage() {
  const params = useParams();
  const reportId = params.reportId as string;

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const supabase = createBrowserClient();
        const { data, error: fetchError } = await supabase
          .from("reports")
          .select("*")
          .eq("id", reportId)
          .single();

        if (fetchError) throw fetchError;
        setReport(data as ReportData);
      } catch {
        setError("Failed to load report. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [reportId]);

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reports/${reportId}/pdf`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `harper-report-${reportId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download PDF. Please try again.");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-midnight">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-harper-gold border-t-transparent" />
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-midnight px-6">
        <div className="text-center">
          <p className="text-score-red">{error ?? "Report not found."}</p>
          <a
            href="/dashboard"
            className="mt-4 inline-block text-sm text-harper-gold underline"
          >
            Back to Dashboard
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-midnight px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="mb-1 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
              Diagnostic Report
            </p>
            <h1 className="font-display text-3xl font-bold text-chalk">
              {report.business_name}
            </h1>
            <p className="mt-1 text-sm text-chalk/40">
              Generated{" "}
              {new Date(report.generated_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 rounded-full border border-harper-gold/30 px-6 py-2.5 text-sm font-medium text-harper-gold transition-all hover:bg-harper-gold/10"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
        </div>

        {/* Overall Score */}
        <div className="mb-12 rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-10 text-center">
          <p className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-chalk/50">
            Overall Business Health Score
          </p>
          <div className="mx-auto mb-6 w-40">
            <ScoreRing
              score={report.overall_score}
              size={160}
              strokeWidth={10}
              color={getScoreStrokeColor(report.overall_score)}
              animated
            />
          </div>
          <p className={`text-lg font-semibold ${getScoreColor(report.overall_score)}`}>
            {report.overall_score >= 70
              ? "Strong"
              : report.overall_score >= 40
              ? "Needs Improvement"
              : "Critical Attention Needed"}
          </p>
        </div>

        {/* Executive Summary */}
        <div className="mb-12 rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-8">
          <h2 className="mb-4 font-display text-xl font-bold text-chalk">
            Executive Summary
          </h2>
          <p className="text-sm leading-relaxed text-chalk/70">
            {report.executive_summary}
          </p>
        </div>

        {/* Section Scores Overview */}
        <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {sectionOrder.map((key) => {
            const section = report.sections[key];
            if (!section) return null;
            return (
              <div
                key={key}
                className="flex flex-col items-center rounded-xl border border-chalk/10 bg-chalk/[0.02] p-4"
              >
                <ScoreRing
                  score={section.score}
                  size={64}
                  strokeWidth={5}
                  color={getScoreStrokeColor(section.score)}
                  animated
                />
                <p className="mt-2 text-center text-xs font-medium text-chalk/60">
                  {section.title}
                </p>
              </div>
            );
          })}
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8">
          {sectionOrder.map((key) => {
            const section = report.sections[key];
            if (!section) return null;
            return (
              <div
                key={key}
                className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-8"
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold text-chalk">
                    {section.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <ScoreRing
                      score={section.score}
                      size={40}
                      strokeWidth={4}
                      color={getScoreStrokeColor(section.score)}
                      animated
                    />
                  </div>
                </div>
                <p className="mb-6 text-sm leading-relaxed text-chalk/60">
                  {section.summary}
                </p>

                {/* Findings */}
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-chalk/40">
                    Key Findings
                  </h3>
                  <ul className="space-y-2">
                    {section.findings.map((finding, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-chalk/60"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-chalk/30" />
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-harper-gold/60">
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {section.recommendations.map((rec, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-chalk/70"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-harper-gold" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Priority Actions */}
        <div className="mt-12 rounded-2xl border border-harper-gold/20 bg-harper-gold/[0.03] p-8">
          <h2 className="mb-6 font-display text-xl font-bold text-harper-gold">
            Priority Actions
          </h2>
          <ol className="space-y-3">
            {report.priority_actions.map((action, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-chalk/70">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-harper-gold/20 font-mono text-xs font-bold text-harper-gold">
                  {i + 1}
                </span>
                {action}
              </li>
            ))}
          </ol>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-chalk/40">
            Want Harper to implement these recommendations?
          </p>
          <a
            href="/dashboard"
            className="mt-4 inline-block rounded-full bg-harper-gold px-8 py-3 text-base font-semibold text-midnight transition-all hover:bg-harper-gold/90"
          >
            Explore Implementation Plans
          </a>
        </div>
      </div>
    </main>
  );
}
