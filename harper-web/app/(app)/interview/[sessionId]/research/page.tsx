"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

interface ResearchStep {
  key: string;
  label: string;
  description: string;
}

const researchSteps: ResearchStep[] = [
  {
    key: "web_scrape",
    label: "Analysing Website",
    description: "Crawling your website for technical SEO, content, and structure",
  },
  {
    key: "google_business",
    label: "Google Business Profile",
    description: "Reviewing your local search presence and reviews",
  },
  {
    key: "competitor_scan",
    label: "Competitor Scan",
    description: "Identifying and analysing your top competitors",
  },
  {
    key: "social_audit",
    label: "Social Media Audit",
    description: "Evaluating your social presence and engagement",
  },
  {
    key: "market_research",
    label: "Market Research",
    description: "Gathering industry benchmarks and trends",
  },
  {
    key: "synthesis",
    label: "Synthesising Findings",
    description: "Combining all research into a unified briefing document",
  },
];

type StepStatus = "pending" | "running" | "completed" | "failed";

export default function ResearchPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>(
    Object.fromEntries(researchSteps.map((s) => [s.key, "pending" as StepStatus]))
  );
  const [overallStatus, setOverallStatus] = useState<string>("pending");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    let interval: ReturnType<typeof setInterval>;

    const pollStatus = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("research_jobs")
          .select("status, step_statuses")
          .eq("session_id", sessionId)
          .single();

        if (fetchError) {
          if (fetchError.code !== "PGRST116") {
            setError("Failed to load research status.");
          }
          return;
        }

        if (data) {
          setOverallStatus(data.status);
          if (data.step_statuses) {
            setStepStatuses(data.step_statuses as Record<string, StepStatus>);
          }
          if (data.status === "completed" || data.status === "failed") {
            clearInterval(interval);
          }
        }
      } catch {
        console.error("Polling error");
      }
    };

    pollStatus();
    interval = setInterval(pollStatus, 3000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const completedCount = Object.values(stepStatuses).filter(
    (s) => s === "completed"
  ).length;
  const progress = Math.round((completedCount / researchSteps.length) * 100);

  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case "completed":
        return (
          <svg className="h-5 w-5 text-score-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        );
      case "running":
        return (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-harper-gold border-t-transparent" />
        );
      case "failed":
        return (
          <svg className="h-5 w-5 text-score-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-chalk/20" />;
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-midnight px-6 py-12">
      <div className="mx-auto w-full max-w-xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
            Research In Progress
          </p>
          <h1 className="font-display text-3xl font-bold text-chalk">
            Preparing your diagnostic
          </h1>
          <p className="mt-2 text-sm text-chalk/50">
            Our AI is researching your business. This typically takes 2-5 minutes.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-chalk/50">Progress</span>
            <span className="font-mono text-harper-gold">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-chalk/10">
            <div
              className="h-full rounded-full bg-harper-gold transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {researchSteps.map((step) => {
            const status = stepStatuses[step.key] ?? "pending";
            return (
              <div
                key={step.key}
                className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                  status === "running"
                    ? "border-harper-gold/30 bg-harper-gold/[0.05]"
                    : status === "completed"
                    ? "border-score-green/20 bg-score-green/[0.03]"
                    : status === "failed"
                    ? "border-score-red/20 bg-score-red/[0.03]"
                    : "border-chalk/10 bg-chalk/[0.02]"
                }`}
              >
                <div className="flex-shrink-0">{getStepIcon(status)}</div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      status === "running"
                        ? "text-harper-gold"
                        : status === "completed"
                        ? "text-chalk/80"
                        : "text-chalk/50"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs text-chalk/30">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error state */}
        {error && (
          <div className="mt-6 rounded-xl border border-score-red/20 bg-score-red/[0.05] p-4 text-center text-sm text-score-red">
            {error}
          </div>
        )}

        {/* Completed state */}
        {overallStatus === "completed" && (
          <div className="mt-8 text-center">
            <p className="mb-4 text-sm text-score-green">
              Research complete! Ready to begin your interview.
            </p>
            <button
              onClick={() => router.push(`/interview/${sessionId}`)}
              className="rounded-full bg-harper-gold px-8 py-3.5 text-base font-semibold text-midnight transition-all hover:bg-harper-gold/90 hover:shadow-lg hover:shadow-harper-gold/20"
            >
              Start Interview
            </button>
          </div>
        )}

        {/* Failed state */}
        {overallStatus === "failed" && (
          <div className="mt-8 text-center">
            <p className="mb-4 text-sm text-score-red">
              Something went wrong during research. Please contact support.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
