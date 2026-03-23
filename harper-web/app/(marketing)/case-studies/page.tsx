import type { Metadata } from "next";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Case Studies — Real Results from Real Businesses",
  description:
    "See how UK SMEs are using Harper to improve SEO rankings, automate operations, and uncover missed revenue. Real businesses, real results.",
  openGraph: {
    title: "Case Studies | Harper Automation",
    description:
      "Real results from real businesses — see how Harper diagnostics drive measurable growth for UK SMEs.",
    type: "website",
  },
  alternates: {
    canonical: "/case-studies",
  },
};

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const stats = [
  { value: "200+", label: "Diagnostics Delivered" },
  { value: "73", label: "Avg Score Improvement" },
  { value: "15hrs", label: "Saved Per Week" },
];

const caseStudies = [
  {
    tag: "Local Services",
    headline: "From Page 3 to the Top 3",
    business: "Thames Valley Plumbing",
    before: [
      { label: "Google ranking", value: "Page 3" },
      { label: "Enquiries/month", value: "12" },
    ],
    after: [
      { label: "Google ranking", value: "Top 3 local" },
      { label: "Enquiries/month", value: "53 (340% increase)" },
    ],
    story: [
      "Thames Valley Plumbing is a family plumbing business with 15 years of trading history — well-respected locally but virtually invisible online.",
      "Harper\u2019s diagnostic revealed critical gaps: missing Google Business optimisation, zero local SEO strategy, and no review management in place. The scored report laid out exactly what was broken and provided a prioritised action roadmap.",
      "Over 8 weeks, the team implemented the recommendations step by step. The results spoke for themselves — a jump from page 3 to top 3 in local search results and a 340% increase in monthly enquiries.",
    ],
    quote:
      "We knew we were good at what we do \u2014 we just couldn\u2019t get found. Harper showed us exactly what was broken and how to fix it.",
    quoteAuthor: "Mark Thompson",
    quoteRole: "Owner",
  },
  {
    tag: "E-commerce",
    headline: "15 Hours Saved Every Week",
    business: "Willow & Thread",
    before: [
      { label: "Weekly manual ops", value: "15hrs/week" },
      { label: "Margin", value: "31%" },
    ],
    after: [
      { label: "Weekly oversight", value: "2hrs/week" },
      { label: "Margin", value: "54%" },
    ],
    story: [
      "Willow & Thread is a sustainable clothing brand whose founder was spending hours every week on manual order processing, inventory updates, and customer follow-ups \u2014 time that should have been spent designing.",
      "Harper\u2019s diagnostic identified 8 automation opportunities across their operations, scoring their efficiency at critically low levels. The report included specific tool recommendations and step-by-step implementation guides.",
      "After implementing the automations, manual operations dropped from 15 hours per week to just 2 hours of oversight. Margins improved from 31% to 54% as operational costs fell and the founder reinvested time into growth.",
    ],
    quote:
      "I started this business to design clothes, not process spreadsheets. Harper gave me my time back.",
    quoteAuthor: "Sarah Chen",
    quoteRole: "Founder",
  },
  {
    tag: "B2B Consultancy",
    headline: "\u00A3200K in Missed Revenue Uncovered",
    business: "Apex Strategy Group",
    before: [
      { label: "Annual revenue", value: "\u00A3180K" },
      { label: "Close rate", value: "23%" },
    ],
    after: [
      { label: "Pipeline identified", value: "\u00A3380K" },
      { label: "Close rate on re-engaged leads", value: "67%" },
    ],
    story: [
      "Apex Strategy Group is a boutique consultancy with a strong reputation but poor systems. They knew they were leaving opportunities on the table but couldn\u2019t pinpoint where.",
      "Harper\u2019s intelligence report revealed they were losing leads in follow-up gaps and had no reactivation strategy for dormant contacts. The diagnostic scored their sales pipeline efficiency well below industry benchmarks.",
      "By implementing the recommended follow-up automations and lead reactivation strategy, the team identified \u00A3380K in pipeline and achieved a 67% close rate on re-engaged leads \u2014 transforming dormant contacts into active revenue.",
    ],
    quote:
      "Harper found money we didn\u2019t know we were leaving on the table. The ROI on a \u00A347 report was extraordinary.",
    quoteAuthor: "David Morgan",
    quoteRole: "Managing Director",
  },
];

/* ------------------------------------------------------------------ */
/*  Arrow icon                                                         */
/* ------------------------------------------------------------------ */

function Arrow() {
  return (
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
        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CaseStudiesPage() {
  return (
    <main className="min-h-screen pt-24">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="px-6 pb-16 pt-16 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
            Case Studies
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Real Results from Real Businesses
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-chalk/70">
            See how UK SMEs are using Harper to grow smarter.
          </p>
        </div>
      </section>

      {/* ── Stats Banner ─────────────────────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-8 rounded-2xl border border-chalk/10 bg-chalk/[0.02] py-10">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl font-bold text-harper-gold md:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wider text-chalk/50">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Case Studies ─────────────────────────────────────────────── */}
      <section className="section-divider px-6 pb-24">
        <div className="mx-auto max-w-6xl space-y-24">
          {caseStudies.map((study, index) => {
            const reversed = index % 2 !== 0;

            return (
              <article key={study.headline}>
                {/* Tag */}
                <span className="mb-6 inline-block rounded-full bg-harper-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-harper-gold">
                  {study.tag}
                </span>

                <h2 className="mb-8 font-display text-3xl font-bold md:text-4xl">
                  {study.headline}
                </h2>

                <div
                  className={`grid items-start gap-12 lg:grid-cols-2 ${
                    reversed ? "lg:[&>*:first-child]:order-2" : ""
                  }`}
                >
                  {/* Story & quote */}
                  <div>
                    <div className="space-y-4">
                      {study.story.map((paragraph, i) => (
                        <p
                          key={i}
                          className="text-sm leading-relaxed text-chalk/70"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    <blockquote className="mt-8 border-l-2 border-harper-gold/40 pl-6">
                      <p className="text-sm italic leading-relaxed text-chalk/80">
                        &ldquo;{study.quote}&rdquo;
                      </p>
                      <footer className="mt-3">
                        <p className="text-sm font-semibold text-chalk">
                          {study.quoteAuthor}
                        </p>
                        <p className="text-xs text-chalk/40">
                          {study.quoteRole}, {study.business}
                        </p>
                      </footer>
                    </blockquote>
                  </div>

                  {/* Before / After card */}
                  <div className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-8">
                    <div className="mb-6">
                      <p className="text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
                        Before &amp; After
                      </p>
                    </div>

                    <div className="space-y-6">
                      {study.before.map((metric, i) => (
                        <div key={metric.label}>
                          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-chalk/40">
                            {metric.label}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xl font-bold text-chalk/50">
                              {metric.value}
                            </span>
                            <Arrow />
                            <span className="font-mono text-xl font-bold text-harper-gold">
                              {study.after[i].value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="section-divider px-6 py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-4xl font-bold md:text-5xl">
            Ready to see what Harper finds in your business?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-chalk/60">
            Join the businesses already using Harper to uncover hidden
            opportunities and compound their growth.
          </p>
          <Link
            href="/reports"
            className="mt-10 inline-block rounded-full bg-harper-gold px-10 py-4 text-lg font-semibold text-midnight transition-all hover:bg-harper-gold/90 hover:shadow-lg hover:shadow-harper-gold/20"
          >
            Start My Diagnostic — £47
          </Link>
          <p className="mt-4 text-xs text-chalk/40">
            One-time fee. No subscriptions. Results in 24 hours.
          </p>
        </div>
      </section>
    </main>
  );
}
