import type { Metadata } from "next";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Implementation Services | Harper",
  description:
    "From SEO fixes to full automation builds — Harper turns recommendations into results. Mid-ticket implementation services for UK businesses.",
  openGraph: {
    title: "Implementation Services | Harper",
    description:
      "From SEO fixes to full automation builds — Harper turns recommendations into results.",
  },
};

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const services = [
  {
    tag: "GET FOUND",
    title: "SEO & Local Search",
    description:
      "Technical SEO implementation, Google Business Profile optimisation, local citation building, content strategy execution.",
    price: "Starting from \u00A3297/month",
  },
  {
    tag: "RUN LEANER",
    title: "Automation & Operations",
    description:
      "CRM setup and migration, workflow automation (Zapier/Make), invoicing and follow-up sequences, data pipeline setup.",
    price: "Starting from \u00A3297/month",
  },
  {
    tag: "GROW SMARTER",
    title: "Growth Strategy",
    description:
      "Quarterly diagnostic re-runs, competitor monitoring, revenue opportunity identification, strategic roadmap updates.",
    price: "Starting from \u00A3497/month",
  },
];

const steps = [
  {
    num: "01",
    title: "Get Your Diagnostic",
    description:
      "Start with a \u00A347 report to identify your opportunities.",
  },
  {
    num: "02",
    title: "Choose Your Path",
    description: "Pick the service tier that matches your priorities.",
  },
  {
    num: "03",
    title: "We Build It",
    description:
      "Harper\u2019s team implements the recommendations from your report.",
  },
  {
    num: "04",
    title: "Measure & Compound",
    description: "Monthly progress reports show the compound effect.",
  },
];

const retainerPlans = [
  {
    name: "Growth",
    price: "\u00A3497/mo",
    diagnostics: "1 per quarter",
    implementations: "2",
    strategyCalls: "Monthly (30 min)",
    reporting: "Monthly",
    teamAccess: "Email support",
  },
  {
    name: "Automation",
    price: "\u00A3497/mo",
    diagnostics: "1 per quarter",
    implementations: "4",
    strategyCalls: "Fortnightly (30 min)",
    reporting: "Fortnightly",
    teamAccess: "Slack channel",
  },
  {
    name: "Fractional Director",
    price: "\u00A3997/mo",
    diagnostics: "Monthly",
    implementations: "8",
    strategyCalls: "Weekly (45 min)",
    reporting: "Weekly",
    teamAccess: "Dedicated strategist",
  },
  {
    name: "Franchise Group",
    price: "Custom",
    diagnostics: "Per-location monthly",
    implementations: "Unlimited",
    strategyCalls: "Weekly (60 min)",
    reporting: "Real-time dashboard",
    teamAccess: "Full team + Slack",
  },
];

const retainerRows: { label: string; key: keyof (typeof retainerPlans)[0] }[] =
  [
    { label: "Price", key: "price" },
    { label: "Included Diagnostics", key: "diagnostics" },
    { label: "Implementations / Month", key: "implementations" },
    { label: "Strategy Calls", key: "strategyCalls" },
    { label: "Reporting Frequency", key: "reporting" },
    { label: "Team Access", key: "teamAccess" },
  ];

const testimonials = [
  {
    quote:
      "Harper\u2019s diagnostic showed us exactly where we were leaking revenue. Within 8 weeks our local search traffic doubled.",
    author: "James T., Plumbing & Heating",
  },
  {
    quote:
      "The automation retainer paid for itself in the first month. We cut 12 hours of admin per week.",
    author: "Sarah M., Dental Practice",
  },
  {
    quote:
      "Finally, a strategy partner that actually implements. No more slide decks collecting dust.",
    author: "David R., Estate Agency",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-midnight pt-24">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
            Implementation Services
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight text-chalk sm:text-5xl lg:text-6xl">
            We don&apos;t just diagnose.
            <br />
            <span className="text-harper-gold">We implement.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-chalk/60">
            From SEO fixes to full automation builds &mdash; Harper turns
            recommendations into results.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#retainers"
              className="inline-flex items-center rounded-full bg-harper-gold px-8 py-3 text-sm font-semibold text-midnight transition hover:opacity-90"
            >
              View Retainer Plans
            </a>
            <Link
              href="/reports"
              className="inline-flex items-center rounded-full border border-chalk/20 px-8 py-3 text-sm font-semibold text-chalk transition hover:bg-chalk/5"
            >
              Start with a Diagnostic
            </Link>
          </div>
        </div>
      </section>

      {/* ── Services Grid ─────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="group rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-8 transition-colors hover:border-harper-gold/20"
            >
              <span className="inline-block rounded-full bg-harper-gold/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-harper-gold">
                {service.tag}
              </span>
              <h3 className="mt-5 font-display text-2xl font-bold text-chalk">
                {service.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-chalk/50">
                {service.description}
              </p>
              <p className="mt-6 text-sm font-semibold text-harper-gold">
                {service.price}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center font-display text-3xl font-bold text-chalk sm:text-4xl">
            How it works
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.num} className="relative">
                <span className="font-display text-5xl font-bold text-harper-gold/20">
                  {step.num}
                </span>
                <h3 className="mt-2 font-display text-lg font-bold text-chalk">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-chalk/50">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Retainer Comparison Table ─────────────────────────────── */}
      <section id="retainers" className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center font-display text-3xl font-bold text-chalk sm:text-4xl">
            Choose your retainer
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-chalk/10 bg-chalk/[0.02]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-chalk/10">
                  <th className="p-5 text-xs font-semibold uppercase tracking-wider text-chalk/40">
                    Feature
                  </th>
                  {retainerPlans.map((plan) => (
                    <th
                      key={plan.name}
                      className="p-5 text-center font-display text-base font-bold text-chalk"
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {retainerRows.map((row, idx) => (
                  <tr
                    key={row.key}
                    className={`border-b border-chalk/5 ${
                      idx % 2 === 0 ? "bg-chalk/[0.01]" : ""
                    }`}
                  >
                    <td className="p-5 text-xs font-semibold uppercase tracking-wider text-chalk/40">
                      {row.label}
                    </td>
                    {retainerPlans.map((plan) => (
                      <td
                        key={plan.name}
                        className={`p-5 text-center text-sm ${
                          row.key === "price"
                            ? "font-display text-lg font-bold text-harper-gold"
                            : "text-chalk/70"
                        }`}
                      >
                        {plan[row.key]}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* CTA row */}
                <tr>
                  <td className="p-5" />
                  {retainerPlans.map((plan) => (
                    <td key={plan.name} className="p-5 text-center">
                      <Link
                        href="/reports"
                        className="inline-block rounded-full bg-harper-gold px-5 py-2.5 text-sm font-semibold text-midnight transition-opacity hover:opacity-90"
                      >
                        {plan.price === "Custom" ? "Contact Us" : "Get Started"}
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Social Proof ──────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <p className="mb-10 text-center text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
            Join 200+ UK businesses growing with Harper
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.author}
                className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-6"
              >
                <p className="text-sm leading-relaxed text-chalk/70">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="mt-4 text-xs font-semibold text-chalk/40">
                  {t.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-chalk sm:text-4xl">
            Start with a diagnostic.
            <br />
            <span className="text-harper-gold">
              Upgrade when you&apos;re ready.
            </span>
          </h2>
          <div className="mt-8">
            <Link
              href="/reports"
              className="inline-block rounded-full bg-harper-gold px-8 py-4 text-base font-semibold text-midnight transition-opacity hover:opacity-90"
            >
              Get Your Diagnostic
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
