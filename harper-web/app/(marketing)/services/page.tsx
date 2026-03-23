import type { Metadata } from "next";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Implementation Services",
  description:
    "Harper doesn't just diagnose — we implement. From SEO to full automation builds, turn recommendations into results.",
  openGraph: {
    title: "Implementation Services | Harper Automation",
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
    name: "SEO & Local Search",
    description:
      "Technical SEO implementation, Google Business Profile optimisation, local citation building, content strategy execution.",
    price: "From £297/month",
    features: [
      "Technical SEO audits & fixes",
      "Google Business Profile optimisation",
      "Local citation building & management",
      "Content strategy & execution",
    ],
  },
  {
    tag: "RUN LEANER",
    name: "Automation & Operations",
    description:
      "CRM setup & migration, workflow automation (Zapier/Make), invoicing & follow-up sequences, data pipeline setup.",
    price: "From £297/month",
    features: [
      "CRM setup & migration",
      "Workflow automation (Zapier/Make)",
      "Invoicing & follow-up sequences",
      "Data pipeline setup",
    ],
  },
  {
    tag: "GROW SMARTER",
    name: "Growth Strategy",
    description:
      "Quarterly diagnostic re-runs, competitor monitoring, revenue opportunity identification, strategic roadmap updates.",
    price: "From £497/month",
    features: [
      "Quarterly diagnostic re-runs",
      "Competitor monitoring dashboards",
      "Revenue opportunity identification",
      "Strategic roadmap updates",
    ],
  },
];

const steps = [
  {
    number: "01",
    title: "Get Your Diagnostic",
    description: "Start with a £47 report",
  },
  {
    number: "02",
    title: "Choose Your Path",
    description: "Pick service tier matching priorities",
  },
  {
    number: "03",
    title: "We Build It",
    description: "Harper implements the recommendations",
  },
  {
    number: "04",
    title: "Measure & Compound",
    description: "Monthly progress reports show compound effect",
  },
];

const retainerPlans = [
  {
    name: "Growth",
    price: "£497/mo",
    popular: true,
    diagnostics: "Quarterly",
    implementations: "2",
    strategyCalls: "Monthly",
    reporting: "Monthly",
    teamAccess: "1 seat",
    toolSetup: "Included",
    prioritySupport: true,
  },
  {
    name: "Automation",
    price: "£297/mo",
    popular: false,
    diagnostics: "Bi-annual",
    implementations: "3",
    strategyCalls: "—",
    reporting: "Monthly",
    teamAccess: "1 seat",
    toolSetup: "Included",
    prioritySupport: true,
  },
  {
    name: "Fractional Director",
    price: "£1,497/mo",
    popular: false,
    diagnostics: "Monthly",
    implementations: "Unlimited",
    strategyCalls: "Weekly",
    reporting: "Weekly",
    teamAccess: "Full team",
    toolSetup: "Included",
    prioritySupport: true,
  },
  {
    name: "Franchise Group",
    price: "£997/mo",
    popular: false,
    diagnostics: "Per-location",
    implementations: "Per-location",
    strategyCalls: "Monthly",
    reporting: "Monthly",
    teamAccess: "Per-location",
    toolSetup: "Included",
    prioritySupport: true,
  },
];

const retainerRows = [
  { label: "Included Diagnostics", key: "diagnostics" as const },
  { label: "Implementations/Month", key: "implementations" as const },
  { label: "Strategy Calls", key: "strategyCalls" as const },
  { label: "Reporting", key: "reporting" as const },
  { label: "Team Access", key: "teamAccess" as const },
  { label: "Tool Setup", key: "toolSetup" as const },
];

const testimonials = [
  {
    quote:
      "Harper took us from invisible to the top 3 on Google locally. The ROI was immediate.",
    name: "Mark T.",
    company: "Thames Valley Plumbing",
  },
  {
    quote:
      "I got 15 hours a week back. I started this business to design, not process spreadsheets.",
    name: "Sarah C.",
    company: "Willow & Thread",
  },
  {
    quote:
      "Harper found £200k we didn't know we were leaving on the table. Extraordinary.",
    name: "David M.",
    company: "Apex Strategy Group",
  },
];

/* ------------------------------------------------------------------ */
/*  Helper: five gold stars                                            */
/* ------------------------------------------------------------------ */

function Stars() {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className="h-5 w-5 text-[#C9A84C]"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
        </svg>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ServicesPage() {
  return (
    <div className="bg-[#0D0D0D] text-[#F5F2EC]">
      {/* ---------------------------------------------------------- */}
      {/*  Hero                                                       */}
      {/* ---------------------------------------------------------- */}
      <section className="mx-auto max-w-4xl px-6 pt-24 pb-20 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          We don&rsquo;t just diagnose.{" "}
          <span className="text-[#C9A84C]">We implement.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-[#F5F2EC]/70">
          From SEO fixes to full automation builds — Harper turns
          recommendations into results.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#retainers"
            className="inline-flex items-center rounded-full bg-[#C9A84C] px-8 py-3 text-sm font-semibold text-[#0D0D0D] transition hover:bg-[#C9A84C]/90"
          >
            View Retainer Plans
          </a>
          <Link
            href="/reports"
            className="inline-flex items-center rounded-full border border-[#F5F2EC]/20 px-8 py-3 text-sm font-semibold text-[#F5F2EC] transition hover:bg-[#F5F2EC]/5"
          >
            Start with a Diagnostic
          </Link>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Services Grid                                              */}
      {/* ---------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.name}
              className="rounded-2xl border border-[#F5F2EC]/10 bg-[#F5F2EC]/[0.02] p-8"
            >
              <span className="inline-block rounded-full bg-[#C9A84C]/10 px-3 py-1 text-xs font-semibold tracking-wider text-[#C9A84C]">
                {service.tag}
              </span>
              <h3 className="font-display mt-4 text-2xl font-bold">
                {service.name}
              </h3>
              <p className="mt-3 text-sm text-[#F5F2EC]/60">
                {service.description}
              </p>
              <p className="mt-6 text-lg font-semibold text-[#C9A84C]">
                {service.price}
              </p>
              <ul className="mt-6 space-y-3">
                {service.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-[#F5F2EC]/80"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A84C]"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  How It Works                                               */}
      {/* ---------------------------------------------------------- */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="font-display text-center text-3xl font-bold sm:text-4xl">
          How It Works
        </h2>
        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <span className="font-display text-5xl font-bold text-[#C9A84C]">
                {step.number}
              </span>
              <h3 className="font-display mt-4 text-lg font-semibold">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-[#F5F2EC]/60">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Retainer Comparison Table                                  */}
      {/* ---------------------------------------------------------- */}
      <section id="retainers" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-center text-3xl font-bold sm:text-4xl">
          Retainer Plans
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[#F5F2EC]/60">
          Choose the plan that fits your growth stage. All plans include
          priority support and tool setup.
        </p>

        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="py-4 pr-4 font-normal text-[#F5F2EC]/40" />
                {retainerPlans.map((plan) => (
                  <th
                    key={plan.name}
                    className={`relative px-6 py-4 text-center ${
                      plan.popular
                        ? "rounded-t-2xl border-x-2 border-t-2 border-[#C9A84C]"
                        : ""
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#C9A84C] px-3 py-0.5 text-xs font-semibold text-[#0D0D0D]">
                        Most Popular
                      </span>
                    )}
                    <div className="font-display text-lg font-bold">
                      {plan.name}
                    </div>
                    <div className="mt-1 text-[#C9A84C]">{plan.price}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {retainerRows.map((row, idx) => (
                <tr
                  key={row.key}
                  className={
                    idx % 2 === 0 ? "bg-[#F5F2EC]/[0.02]" : ""
                  }
                >
                  <td className="py-3 pr-4 font-medium text-[#F5F2EC]/80">
                    {row.label}
                  </td>
                  {retainerPlans.map((plan) => (
                    <td
                      key={plan.name}
                      className={`px-6 py-3 text-center text-[#F5F2EC]/70 ${
                        plan.popular ? "border-x-2 border-[#C9A84C]" : ""
                      }`}
                    >
                      {plan[row.key]}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Priority Support row */}
              <tr className="bg-[#F5F2EC]/[0.02]">
                <td className="py-3 pr-4 font-medium text-[#F5F2EC]/80">
                  Priority Support
                </td>
                {retainerPlans.map((plan) => (
                  <td
                    key={plan.name}
                    className={`px-6 py-3 text-center text-[#C9A84C] ${
                      plan.popular ? "border-x-2 border-[#C9A84C]" : ""
                    }`}
                  >
                    ✓
                  </td>
                ))}
              </tr>

              {/* CTA row */}
              <tr>
                <td className="py-6" />
                {retainerPlans.map((plan) => (
                  <td
                    key={plan.name}
                    className={`px-6 py-6 text-center ${
                      plan.popular
                        ? "rounded-b-2xl border-x-2 border-b-2 border-[#C9A84C]"
                        : ""
                    }`}
                  >
                    <a
                      href="mailto:hello@harper.ai"
                      className={`inline-block rounded-full px-6 py-2 text-sm font-semibold transition ${
                        plan.popular
                          ? "bg-[#C9A84C] text-[#0D0D0D] hover:bg-[#C9A84C]/90"
                          : "border border-[#F5F2EC]/20 text-[#F5F2EC] hover:bg-[#F5F2EC]/5"
                      }`}
                    >
                      Get Started
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Social Proof                                               */}
      {/* ---------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-center text-3xl font-bold sm:text-4xl">
          Join 200+ UK businesses growing with Harper
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-[#F5F2EC]/10 bg-[#F5F2EC]/[0.02] p-8"
            >
              <Stars />
              <blockquote className="mt-4 text-[#F5F2EC]/80">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-6">
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-[#F5F2EC]/50">{t.company}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Final CTA                                                  */}
      {/* ---------------------------------------------------------- */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">
          Start with a diagnostic.{" "}
          <span className="text-[#C9A84C]">Upgrade when you&rsquo;re ready.</span>
        </h2>
        <div className="mt-10">
          <Link
            href="/reports"
            className="inline-flex items-center rounded-full bg-[#C9A84C] px-10 py-4 text-base font-semibold text-[#0D0D0D] transition hover:bg-[#C9A84C]/90"
          >
            Get Your Diagnostic
          </Link>
        </div>
        <p className="mt-4 text-sm text-[#F5F2EC]/50">
          One-time fee. No commitment. Results in 24 hours.
        </p>
      </section>
    </div>
  );
}
