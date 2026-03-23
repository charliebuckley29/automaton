import type { Metadata } from "next";
import Link from "next/link";
import { ScoreRing } from "@/components/ui/score-ring";

export const metadata: Metadata = {
  title: "Small Business Diagnostic",
  description:
    "Stop wasting money on marketing that doesn't work. For just £47, get an AI-powered diagnostic that reveals exactly what's working, what's broken, and where to grow next.",
  openGraph: {
    title: "Small Business Diagnostic | Harper Automation",
    description:
      "A comprehensive AI diagnostic for small businesses — scored insights across SEO, operations, marketing, and growth. Results in 24 hours.",
    type: "website",
  },
  alternates: {
    canonical: "/smb",
  },
};

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const painPoints = [
  {
    icon: (
      <svg className="h-8 w-8 text-harper-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Wasting Time on Manual Tasks",
    description:
      "You\u2019re spending hours on repetitive work \u2014 social posts, follow-ups, reporting \u2014 instead of actually growing your business.",
  },
  {
    icon: (
      <svg className="h-8 w-8 text-harper-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
    title: "No Idea What\u2019s Working",
    description:
      "You\u2019re spending money on marketing but have no clear picture of what\u2019s driving results and what\u2019s just burning cash.",
  },
  {
    icon: (
      <svg className="h-8 w-8 text-harper-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    title: "Been Burnt by Agencies",
    description:
      "You\u2019ve paid thousands to agencies who delivered jargon-filled reports and zero tangible results. You need clarity, not waffle.",
  },
];

const deliverables = [
  {
    step: "01",
    title: "Voice Interview",
    description:
      "A focused 15-minute AI-led conversation that digs into your business challenges, goals, and current setup. No forms, no faff.",
  },
  {
    step: "02",
    title: "Pre-Research",
    description:
      "Before we even speak, we analyse your website, competitors, local SEO, and online presence across 50+ data points.",
  },
  {
    step: "03",
    title: "Full Analysis Report",
    description:
      "A scored diagnostic report with specific, prioritised recommendations. Every insight is actionable \u2014 no fluff, no jargon.",
  },
];

const mockScores = [
  { label: "Overall", score: 62 },
  { label: "SEO", score: 41 },
  { label: "Operations", score: 78 },
  { label: "Marketing", score: 55 },
  { label: "Revenue", score: 69 },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SMBLandingPage() {
  return (
    <main className="min-h-screen bg-midnight">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(201,168,76,0.06)_0%,_transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="mb-6 text-sm font-medium uppercase tracking-[0.3em] text-harper-gold">
            Harper Diagnostic Report
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            Stop wasting money on marketing
            <br />
            <span className="text-gold-gradient">that doesn&apos;t work.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-chalk/70">
            For <span className="font-semibold text-chalk">&pound;47</span>, get
            a comprehensive AI diagnostic that tells you exactly what&apos;s
            working, what&apos;s broken, and where your next pound of growth
            will come from. No retainers. No jargon. Just clarity.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/reports"
              className="rounded-full bg-harper-gold px-8 py-3.5 text-base font-semibold text-midnight transition-all hover:bg-harper-gold/90 hover:shadow-lg hover:shadow-harper-gold/20"
            >
              Start my report &mdash; &pound;47
            </Link>
          </div>
          <p className="mt-4 text-xs text-chalk/40">
            One-time fee. No subscriptions. Results in 24 hours.
          </p>
        </div>
      </section>

      {/* ── Pain Points ───────────────────────────────────────────────── */}
      <section className="section-divider px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
              Sound Familiar?
            </p>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              You know something isn&apos;t working.
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {painPoints.map((point) => (
              <div
                key={point.title}
                className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-8 transition-all hover:border-harper-gold/20 hover:bg-chalk/[0.04]"
              >
                <div className="mb-4">{point.icon}</div>
                <h3 className="mb-3 font-display text-xl font-semibold">
                  {point.title}
                </h3>
                <p className="text-sm leading-relaxed text-chalk/60">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What You Get ──────────────────────────────────────────────── */}
      <section className="section-divider px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
              What You Get
            </p>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              A complete picture of your business in 24 hours.
            </h2>
          </div>
          <div className="grid gap-12 md:grid-cols-3">
            {deliverables.map((item) => (
              <div key={item.step} className="relative">
                <span className="font-mono text-5xl font-bold text-harper-gold/20">
                  {item.step}
                </span>
                <h3 className="mt-4 font-display text-2xl font-semibold">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-chalk/60">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Score Preview ─────────────────────────────────────────────── */}
      <section className="section-divider px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
              Report Preview
            </p>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              See exactly where you stand.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-chalk/60">
              Your report includes scored diagnostics across every dimension of
              your business &mdash; so you know precisely where to focus.
            </p>
          </div>
          <div className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-8 md:p-12">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {mockScores.map((item) => (
                <ScoreRing
                  key={item.label}
                  score={item.score}
                  label={item.label}
                  size={item.label === "Overall" ? 140 : 100}
                  strokeWidth={item.label === "Overall" ? 10 : 6}
                />
              ))}
            </div>
            <p className="mt-8 text-center text-xs text-chalk/30">
              Example scores shown. Your report will reflect your actual
              business data.
            </p>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section className="section-divider px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
              What Owners Are Saying
            </p>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Real businesses. Real results.
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                quote:
                  "Finally, someone who told me what was actually wrong instead of trying to sell me a retainer.",
                name: "Business Owner",
                role: "E-commerce, London",
              },
              {
                quote:
                  "The report paid for itself in the first week. I had no idea my Google Business Profile was so poorly optimised.",
                name: "Business Owner",
                role: "Services, Manchester",
              },
              {
                quote:
                  "I\u2019ve spent thousands on agencies. This \u00A347 report gave me more actionable insight than all of them combined.",
                name: "Business Owner",
                role: "Retail, Birmingham",
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-8"
              >
                <svg
                  className="mb-4 h-6 w-6 text-harper-gold/40"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="mb-6 text-sm leading-relaxed text-chalk/70">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-medium text-chalk">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-chalk/40">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="section-divider px-6 py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-4xl font-bold md:text-5xl">
            Stop guessing. Start knowing.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-chalk/60">
            Every day without clarity is a day your competitors get further
            ahead. Get your diagnostic now.
          </p>
          <Link
            href="/reports"
            className="mt-10 inline-block rounded-full bg-harper-gold px-10 py-4 text-lg font-semibold text-midnight transition-all hover:bg-harper-gold/90 hover:shadow-lg hover:shadow-harper-gold/20"
          >
            Start my report &mdash; &pound;47
          </Link>
          <p className="mt-4 text-xs text-chalk/40">
            One-time payment. No subscriptions. Results in 24 hours.
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-chalk/10 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <p className="font-display text-lg font-bold">
            Harper<span className="text-harper-gold">.</span>
          </p>
          <p className="text-xs text-chalk/40">
            &copy; {new Date().getFullYear()} Harper Automation Ltd. All rights
            reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
