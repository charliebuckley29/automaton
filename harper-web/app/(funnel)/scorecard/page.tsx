"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/score-ring";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Question {
  id: string;
  category: Category;
  text: string;
  options: { label: string; value: number }[];
}

type Category =
  | "digital_presence"
  | "operations"
  | "marketing"
  | "ai_readiness"
  | "growth";

interface CategoryMeta {
  key: Category;
  label: string;
  description: string;
}

interface Recommendation {
  title: string;
  body: string;
}

interface ScorecardResult {
  overall_score: number;
  categories: Record<Category, number>;
  recommendations: Recommendation[];
}

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const CATEGORIES: CategoryMeta[] = [
  {
    key: "digital_presence",
    label: "Digital Presence",
    description: "Website, social media & search visibility",
  },
  {
    key: "operations",
    label: "Operations",
    description: "Processes, tooling & team productivity",
  },
  {
    key: "marketing",
    label: "Marketing",
    description: "Channels, content & advertising",
  },
  {
    key: "ai_readiness",
    label: "AI Readiness",
    description: "Automation, AI tools & data maturity",
  },
  {
    key: "growth",
    label: "Growth",
    description: "Revenue trajectory, acquisition & scale",
  },
];

const SCALE_OPTIONS = [
  { label: "Not at all", value: 1 },
  { label: "Slightly", value: 2 },
  { label: "Moderately", value: 3 },
  { label: "Very much", value: 4 },
  { label: "Completely", value: 5 },
];

const QUESTIONS: Question[] = [
  // ── Digital Presence ──────────────────────────────────────────────
  {
    id: "dp_1",
    category: "digital_presence",
    text: "How would you rate the overall quality and professionalism of your website?",
    options: SCALE_OPTIONS,
  },
  {
    id: "dp_2",
    category: "digital_presence",
    text: "How actively does your business post and engage on social media?",
    options: SCALE_OPTIONS,
  },
  {
    id: "dp_3",
    category: "digital_presence",
    text: "How confident are you in your current SEO strategy and organic search rankings?",
    options: SCALE_OPTIONS,
  },

  // ── Operations ────────────────────────────────────────────────────
  {
    id: "ops_1",
    category: "operations",
    text: "How many of your core business processes are still done manually?",
    options: [
      { label: "Almost all", value: 1 },
      { label: "Most", value: 2 },
      { label: "About half", value: 3 },
      { label: "Few", value: 4 },
      { label: "Almost none", value: 5 },
    ],
  },
  {
    id: "ops_2",
    category: "operations",
    text: "How well do your current tools and software integrate with each other?",
    options: SCALE_OPTIONS,
  },
  {
    id: "ops_3",
    category: "operations",
    text: "How would you rate your team's overall productivity and efficiency?",
    options: SCALE_OPTIONS,
  },

  // ── Marketing ─────────────────────────────────────────────────────
  {
    id: "mkt_1",
    category: "marketing",
    text: "How diversified are the marketing channels you use to reach customers?",
    options: SCALE_OPTIONS,
  },
  {
    id: "mkt_2",
    category: "marketing",
    text: "How consistent and strategic is your content marketing approach?",
    options: SCALE_OPTIONS,
  },
  {
    id: "mkt_3",
    category: "marketing",
    text: "How effectively are you tracking ROI on your advertising spend?",
    options: SCALE_OPTIONS,
  },

  // ── AI Readiness ──────────────────────────────────────────────────
  {
    id: "ai_1",
    category: "ai_readiness",
    text: "To what extent have you automated repetitive tasks in your business?",
    options: SCALE_OPTIONS,
  },
  {
    id: "ai_2",
    category: "ai_readiness",
    text: "How familiar is your team with AI tools and their potential applications?",
    options: SCALE_OPTIONS,
  },
  {
    id: "ai_3",
    category: "ai_readiness",
    text: "How effectively do you collect, organise, and use business data for decision-making?",
    options: SCALE_OPTIONS,
  },

  // ── Growth ────────────────────────────────────────────────────────
  {
    id: "gr_1",
    category: "growth",
    text: "How would you describe your revenue trajectory over the past 12 months?",
    options: [
      { label: "Declining", value: 1 },
      { label: "Flat", value: 2 },
      { label: "Slow growth", value: 3 },
      { label: "Steady growth", value: 4 },
      { label: "Rapid growth", value: 5 },
    ],
  },
  {
    id: "gr_2",
    category: "growth",
    text: "How effective is your current customer acquisition strategy?",
    options: SCALE_OPTIONS,
  },
  {
    id: "gr_3",
    category: "growth",
    text: "How prepared is your business to scale operations in the next 12 months?",
    options: SCALE_OPTIONS,
  },
];

const TOTAL_QUESTION_STEPS = Math.ceil(QUESTIONS.length / 3); // 5 steps
const TOTAL_STEPS = TOTAL_QUESTION_STEPS + 1; // +1 for contact details

const BUSINESS_TYPES = [
  { label: "Small / Medium Business", value: "smb" },
  { label: "Franchise", value: "franchise" },
  { label: "Agency", value: "agency" },
] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getCategoryColor(score: number): string {
  if (score >= 71) return "text-score-green";
  if (score >= 41) return "text-score-amber";
  return "text-score-red";
}

function getCategoryBgColor(score: number): string {
  if (score >= 71) return "bg-score-green/10 border-score-green/20";
  if (score >= 41) return "bg-score-amber/10 border-score-amber/20";
  return "bg-score-red/10 border-score-red/20";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ScorecardPage() {
  const searchParams = useSearchParams();

  /* ── State ─────────────────────────────────────────────────────── */
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ScorecardResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ── UTM capture ───────────────────────────────────────────────── */
  const utmParams = useMemo(() => {
    const keys = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ];
    const params: Record<string, string> = {};
    keys.forEach((k) => {
      const v = searchParams.get(k);
      if (v) params[k] = v;
    });
    return params;
  }, [searchParams]);

  /* ── Derived ───────────────────────────────────────────────────── */
  const progress = ((step + 1) / (TOTAL_STEPS + 1)) * 100; // +1 so bar never starts at 0
  const isContactStep = step === TOTAL_QUESTION_STEPS;

  const currentQuestions = useMemo(() => {
    if (isContactStep) return [];
    const start = step * 3;
    return QUESTIONS.slice(start, start + 3);
  }, [step, isContactStep]);

  const currentCategory = currentQuestions[0]?.category;
  const currentCategoryMeta = CATEGORIES.find((c) => c.key === currentCategory);

  const canAdvance = useMemo(() => {
    if (isContactStep) return email.trim().length > 0;
    return currentQuestions.every((q) => answers[q.id] !== undefined);
  }, [isContactStep, currentQuestions, answers, email]);

  /* ── Handlers ──────────────────────────────────────────────────── */
  const setAnswer = useCallback((id: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  const handleNext = useCallback(async () => {
    if (!canAdvance) return;

    if (isContactStep) {
      setSubmitting(true);
      setError(null);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/scorecard/analyze`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              answers,
              email: email.trim(),
              full_name: fullName.trim() || undefined,
              business_name: businessName.trim() || undefined,
              business_type: businessType || undefined,
              ...utmParams,
            }),
          }
        );

        if (!res.ok) throw new Error("Something went wrong. Please try again.");

        const data: ScorecardResult = await res.json();
        setResult(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        );
      } finally {
        setSubmitting(false);
      }
    } else {
      setStep((s) => s + 1);
    }
  }, [
    canAdvance,
    isContactStep,
    answers,
    email,
    fullName,
    businessName,
    businessType,
    utmParams,
  ]);

  /* ── Keyboard shortcut: Enter to advance ───────────────────────── */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && canAdvance && !submitting && !result) {
        e.preventDefault();
        handleNext();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canAdvance, submitting, result, handleNext]);

  /* ================================================================ */
  /*  Results view                                                     */
  /* ================================================================ */
  if (result) {
    return (
      <main className="min-h-screen bg-midnight px-4 py-12 sm:py-20">
        <div className="mx-auto max-w-3xl animate-fade-in">
          {/* Header */}
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-harper-gold">
              Your Business Scorecard
            </p>
            <h1 className="font-display text-4xl font-bold text-chalk sm:text-5xl">
              Here&rsquo;s where you stand
            </h1>
          </div>

          {/* Overall Score Ring */}
          <div className="mb-14 flex justify-center animate-slide-up">
            <ScoreRing
              score={result.overall_score}
              label="Overall Score"
              size={180}
              strokeWidth={10}
              animated
            />
          </div>

          {/* Category Breakdowns */}
          <div className="mb-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat, i) => {
              const score = result.categories[cat.key] ?? 0;
              return (
                <div
                  key={cat.key}
                  className={cn(
                    "rounded-2xl border p-5 transition-all duration-500 animate-slide-up",
                    getCategoryBgColor(score)
                  )}
                  style={{ animationDelay: `${(i + 1) * 120}ms` }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-chalk/80">
                      {cat.label}
                    </h3>
                    <span
                      className={cn(
                        "text-2xl font-bold font-display",
                        getCategoryColor(score)
                      )}
                    >
                      {score}
                    </span>
                  </div>
                  {/* Mini bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-chalk/10">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${score}%`,
                        backgroundColor:
                          score >= 71
                            ? "#2D6A4F"
                            : score >= 41
                            ? "#D4A017"
                            : "#C0392B",
                        transitionDelay: `${(i + 1) * 120 + 300}ms`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-chalk/50">{cat.description}</p>
                </div>
              );
            })}
          </div>

          {/* Recommendations */}
          <div className="mb-14">
            <h2 className="mb-6 font-display text-2xl font-bold text-chalk">
              Top Recommendations
            </h2>
            <div className="space-y-4">
              {result.recommendations.slice(0, 3).map((rec, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-harper-gold/15 bg-harper-gold/5 p-6 animate-slide-up"
                  style={{ animationDelay: `${(i + 1) * 150 + 600}ms` }}
                >
                  <div className="mb-1 flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-harper-gold text-xs font-bold text-midnight">
                      {i + 1}
                    </span>
                    <h3 className="font-semibold text-chalk">{rec.title}</h3>
                  </div>
                  <p className="pl-10 text-sm leading-relaxed text-chalk/70">
                    {rec.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center animate-slide-up" style={{ animationDelay: "1200ms" }}>
            <p className="mb-4 text-chalk/60">
              Want a detailed action plan tailored to your business?
            </p>
            <Button size="lg">Book a Free Strategy Call</Button>
          </div>
        </div>
      </main>
    );
  }

  /* ================================================================ */
  /*  Form view                                                        */
  /* ================================================================ */
  return (
    <main className="flex min-h-screen flex-col bg-midnight px-4 py-10 sm:py-16">
      {/* ── Progress bar ─────────────────────────────────────────── */}
      <div className="mx-auto mb-10 w-full max-w-xl sm:mb-14">
        <div className="mb-2 flex items-center justify-between text-xs text-chalk/50">
          <span>
            Step {step + 1} of {TOTAL_STEPS}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-chalk/10">
          <div
            className="h-full rounded-full bg-harper-gold transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── Card ─────────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-xl flex-1">
        {/* Category header (question steps only) */}
        {!isContactStep && currentCategoryMeta && (
          <div className="mb-8 animate-fade-in" key={`header-${step}`}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-harper-gold">
              {currentCategoryMeta.label}
            </p>
            <p className="text-sm text-chalk/50">
              {currentCategoryMeta.description}
            </p>
          </div>
        )}

        {/* Contact step header */}
        {isContactStep && (
          <div className="mb-8 animate-fade-in">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-harper-gold">
              Almost there
            </p>
            <h2 className="font-display text-2xl font-bold text-chalk sm:text-3xl">
              Where should we send your results?
            </h2>
            <p className="mt-2 text-sm text-chalk/50">
              We&rsquo;ll also email you a detailed PDF breakdown.
            </p>
          </div>
        )}

        {/* Question cards */}
        {!isContactStep && (
          <div className="space-y-6" key={`questions-${step}`}>
            {currentQuestions.map((q, qi) => (
              <div
                key={q.id}
                className="animate-slide-up rounded-2xl border border-chalk/10 bg-chalk/[0.03] p-6"
                style={{ animationDelay: `${qi * 80}ms` }}
              >
                <p className="mb-4 font-medium leading-snug text-chalk">
                  {q.text}
                </p>
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => {
                    const selected = answers[q.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAnswer(q.id, opt.value)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                          selected
                            ? "border-harper-gold bg-harper-gold/15 text-harper-gold"
                            : "border-chalk/15 text-chalk/60 hover:border-chalk/30 hover:text-chalk/80"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact fields */}
        {isContactStep && (
          <div className="space-y-5 animate-fade-in">
            {/* Email (required) */}
            <div>
              <label
                htmlFor="sc-email"
                className="mb-1.5 block text-sm font-medium text-chalk/80"
              >
                Email address <span className="text-harper-gold">*</span>
              </label>
              <input
                id="sc-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl border border-chalk/15 bg-chalk/[0.04] px-4 py-3 text-chalk placeholder:text-chalk/30 focus:border-harper-gold focus:outline-none focus:ring-1 focus:ring-harper-gold"
              />
            </div>

            {/* Full name */}
            <div>
              <label
                htmlFor="sc-name"
                className="mb-1.5 block text-sm font-medium text-chalk/80"
              >
                Full name
              </label>
              <input
                id="sc-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full rounded-xl border border-chalk/15 bg-chalk/[0.04] px-4 py-3 text-chalk placeholder:text-chalk/30 focus:border-harper-gold focus:outline-none focus:ring-1 focus:ring-harper-gold"
              />
            </div>

            {/* Business name */}
            <div>
              <label
                htmlFor="sc-biz"
                className="mb-1.5 block text-sm font-medium text-chalk/80"
              >
                Business name
              </label>
              <input
                id="sc-biz"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Acme Corp"
                className="w-full rounded-xl border border-chalk/15 bg-chalk/[0.04] px-4 py-3 text-chalk placeholder:text-chalk/30 focus:border-harper-gold focus:outline-none focus:ring-1 focus:ring-harper-gold"
              />
            </div>

            {/* Business type */}
            <div>
              <label
                htmlFor="sc-type"
                className="mb-1.5 block text-sm font-medium text-chalk/80"
              >
                Business type
              </label>
              <select
                id="sc-type"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full appearance-none rounded-xl border border-chalk/15 bg-chalk/[0.04] px-4 py-3 text-chalk focus:border-harper-gold focus:outline-none focus:ring-1 focus:ring-harper-gold"
              >
                <option value="" className="bg-midnight">
                  Select...
                </option>
                {BUSINESS_TYPES.map((bt) => (
                  <option key={bt.value} value={bt.value} className="bg-midnight">
                    {bt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-score-red">{error}</p>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <div className="mx-auto mt-10 flex w-full max-w-xl items-center justify-between sm:mt-14">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={step === 0}
          className={cn(step === 0 && "invisible")}
        >
          Back
        </Button>

        <Button
          size="md"
          onClick={handleNext}
          disabled={!canAdvance || submitting}
        >
          {submitting
            ? "Analysing..."
            : isContactStep
            ? "Get My Score"
            : "Continue"}
        </Button>
      </div>

      {/* ── Subtle branding ──────────────────────────────────────── */}
      <p className="mx-auto mt-8 text-center text-[11px] tracking-wider text-chalk/25">
        Powered by Harper Automation
      </p>
    </main>
  );
}
