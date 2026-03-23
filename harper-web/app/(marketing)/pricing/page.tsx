import type { Metadata } from "next";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Transparent pricing for Harper Automation. From one-time diagnostics to monthly growth retainers.",
  openGraph: {
    title: "Pricing | Harper Automation",
    description:
      "Transparent pricing for Harper Automation. From one-time diagnostics to monthly growth retainers.",
  },
};

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const plans = [
  {
    name: "Diagnostic Report",
    price: "\u00a347",
    frequency: "one-time",
    popular: false,
    features: [
      "50+ dimension analysis",
      "15-min AI voice interview",
      "Competitor landscape analysis",
      "SEO & online presence audit",
      "Operations efficiency scoring",
      "Prioritised action roadmap",
      "Downloadable PDF",
    ],
    cta: "Start My Diagnostic",
    href: "/reports",
    external: false,
  },
  {
    name: "Growth Retainer",
    price: "\u00a3497",
    frequency: "/month",
    popular: true,
    features: [
      "Everything in Diagnostic, plus:",
      "Quarterly re-diagnosis",
      "Priority implementation queue",
      "Dedicated growth strategist",
      "Tool setup & migration",
      "Monthly progress reports",
      "Slack/email support",
    ],
    cta: "Book a Discovery Call",
    href: "mailto:hello@harper.ai",
    external: true,
  },
  {
    name: "Agency Pack",
    price: "from \u00a325",
    frequency: "/report",
    popular: false,
    features: [
      "White-label reports",
      "Custom branding",
      "Bulk discount 50%+",
      "API access",
      "Dedicated account manager",
      "Priority support",
    ],
    cta: "Learn More",
    href: "/agencies",
    external: false,
  },
];

const faqs = [
  {
    question: "What happens after I purchase a diagnostic?",
    answer:
      "You\u2019ll receive a short intake form to fill out, followed by a 15-minute AI voice interview about your business. We combine your answers with automated research on your market, competitors, and online presence. Your full scored report is delivered within 24 hours.",
  },
  {
    question: "Can I upgrade from a diagnostic to a retainer?",
    answer:
      "Yes \u2014 and your diagnostic report fee is credited toward your first month\u2019s retainer. You\u2019ll never pay twice for the same insight.",
  },
  {
    question: "How does agency pricing work?",
    answer:
      "Agencies purchase bulk credit packs at volume discounts. The more credits you buy, the lower the per-report cost. Minimum order is 10 credits. All reports can be white-labelled with your own branding.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "We offer a free scorecard at /scorecard that gives you a quick snapshot of your business health. The full diagnostic report at \u00a347 is the entry product \u2014 designed to deliver immediate, actionable value.",
  },
  {
    question: "What if I\u2019m not satisfied?",
    answer:
      "We offer a 30-day money-back guarantee on all diagnostic reports. No questions asked. If you don\u2019t find the report valuable, we\u2019ll refund you in full.",
  },
  {
    question: "Do you work with businesses outside the UK?",
    answer:
      "Yes \u2014 we work with businesses in both the UK and the US. Prices are available in GBP and USD, and our diagnostic framework adapts to local markets and search landscapes.",
  },
];

/* ------------------------------------------------------------------ */
/*  Checkmark icon                                                     */
/* ------------------------------------------------------------------ */

function Check() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 flex-shrink-0 text-harper-gold"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
  return (
    <main className="min-h-screen pt-24">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="px-6 pb-20 pt-16 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
            Pricing
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Simple, transparent pricing.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-chalk/60">
            No hidden fees. No lock-in contracts.
          </p>
        </div>
      </section>

      {/* ── Pricing Cards ─────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-8 transition-all hover:border-harper-gold/30 md:p-10 ${
                plan.popular
                  ? "border-harper-gold/30 bg-harper-gold/[0.04]"
                  : "border-chalk/10 bg-chalk/[0.02]"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-harper-gold px-4 py-1 text-xs font-semibold text-midnight">
                  Most Popular
                </span>
              )}

              <h3 className="font-display text-2xl font-bold">{plan.name}</h3>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold text-chalk">
                  {plan.price}
                </span>
                <span className="text-sm text-chalk/40">{plan.frequency}</span>
              </div>

              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-chalk/70"
                  >
                    <Check />
                    {feature}
                  </li>
                ))}
              </ul>

              {plan.external ? (
                <a
                  href={plan.href}
                  className={`mt-10 block w-full rounded-full py-3.5 text-center text-sm font-semibold transition-all ${
                    plan.popular
                      ? "bg-harper-gold text-midnight hover:bg-harper-gold/90 hover:shadow-lg hover:shadow-harper-gold/20"
                      : "border border-chalk/20 text-chalk hover:border-chalk/40 hover:bg-chalk/5"
                  }`}
                >
                  {plan.cta}
                </a>
              ) : (
                <Link
                  href={plan.href}
                  className={`mt-10 block w-full rounded-full py-3.5 text-center text-sm font-semibold transition-all ${
                    plan.popular
                      ? "bg-harper-gold text-midnight hover:bg-harper-gold/90 hover:shadow-lg hover:shadow-harper-gold/20"
                      : "border border-chalk/20 text-chalk hover:border-chalk/40 hover:bg-chalk/5"
                  }`}
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Money-Back Guarantee ───────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl rounded-2xl border border-harper-gold/20 bg-harper-gold/[0.03] p-8 text-center md:p-12">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
            Risk-Free
          </p>
          <h2 className="font-display text-2xl font-bold md:text-3xl">
            30-day money-back guarantee on all diagnostic reports.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-chalk/60">
            If you don&apos;t find actionable value in your report, we&apos;ll
            refund you in full. No questions asked.
          </p>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="section-divider px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
              FAQ
            </p>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-chalk/10 bg-chalk/[0.02] transition-all open:border-harper-gold/20"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-5 text-left text-sm font-medium text-chalk marker:[font-size:0] [&::-webkit-details-marker]:hidden">
                  <span className="pr-4">{faq.question}</span>
                  <span className="shrink-0 text-lg text-chalk/40 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-6 text-sm leading-relaxed text-chalk/60">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
