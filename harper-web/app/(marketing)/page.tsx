import Link from "next/link";

const painPoints = [
  {
    icon: "🔍",
    title: "Invisible Online",
    description:
      "Your competitors rank above you. Customers can't find you. Every day without visibility is revenue lost.",
  },
  {
    icon: "⏳",
    title: "Drowning in Manual Work",
    description:
      "Hours spent on repetitive tasks — invoicing, follow-ups, data entry — that add zero strategic value.",
  },
  {
    icon: "📊",
    title: "Flying Blind",
    description:
      "No clear picture of what's working, what's broken, or where the next pound of growth will come from.",
  },
];

const capabilities = [
  {
    tag: "GET FOUND",
    title: "Search & Discovery",
    description:
      "SEO audits, local search optimisation, content strategy, and Google Business Profile management — all diagnosed and automated.",
    features: [
      "Technical SEO audit",
      "Local search optimisation",
      "Content gap analysis",
      "Review management",
    ],
  },
  {
    tag: "RUN LEANER",
    title: "Operations & Automation",
    description:
      "We find the bottlenecks in your workflows and build automations that eliminate them. Less overhead, more output.",
    features: [
      "Workflow automation",
      "CRM integration",
      "Invoicing & follow-ups",
      "Data pipeline setup",
    ],
  },
  {
    tag: "GROW SMARTER",
    title: "Intelligence & Strategy",
    description:
      "AI-powered business intelligence that turns your data into decisions. Know exactly where to invest for maximum return.",
    features: [
      "Competitor analysis",
      "Revenue diagnostics",
      "Growth scoring",
      "Quarterly roadmaps",
    ],
  },
];

const steps = [
  {
    number: "01",
    title: "Diagnose",
    description:
      "A 15-minute AI-led interview analyses your business across 50+ dimensions. We research your market, competitors, and online presence automatically.",
  },
  {
    number: "02",
    title: "Build",
    description:
      "You receive a scored diagnostic report with specific, prioritised recommendations. Every insight is actionable — no fluff, no jargon.",
  },
  {
    number: "03",
    title: "Compound",
    description:
      "Implement recommendations yourself, or let Harper handle it. Either way, each improvement compounds on the last. Growth accelerates.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-harper-gold/10 bg-midnight/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-display text-xl font-bold text-chalk">
            Harper<span className="text-harper-gold">.</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/reports"
              className="text-sm text-chalk/70 transition-colors hover:text-chalk"
            >
              Reports
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-chalk/70 transition-colors hover:text-chalk"
            >
              Dashboard
            </Link>
            <Link
              href="/reports"
              className="rounded-full bg-harper-gold px-5 py-2 text-sm font-medium text-midnight transition-all hover:bg-harper-gold/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
        {/* Subtle radial gradient behind hero */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(201,168,76,0.08)_0%,_transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="mb-6 text-sm font-medium uppercase tracking-[0.3em] text-harper-gold">
            AI-Powered Growth for SMEs
          </p>
          <h1 className="font-display text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            Your business,
            <br />
            <span className="text-gold-gradient">working smarter.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-chalk/70">
            Harper diagnoses your business, identifies hidden opportunities, and
            builds the automations that compound growth — so you can focus on
            what actually matters.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/reports"
              className="rounded-full bg-harper-gold px-8 py-3.5 text-base font-semibold text-midnight transition-all hover:bg-harper-gold/90 hover:shadow-lg hover:shadow-harper-gold/20"
            >
              Start My Diagnostic
            </Link>
            <a
              href="#how-it-works"
              className="rounded-full border border-chalk/20 px-8 py-3.5 text-base font-medium text-chalk transition-all hover:border-chalk/40 hover:bg-chalk/5"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="section-divider px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
              The Problem
            </p>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Most SMEs are leaving growth on the table.
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {painPoints.map((point) => (
              <div
                key={point.title}
                className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-8 transition-all hover:border-harper-gold/20 hover:bg-chalk/[0.04]"
              >
                <div className="mb-4 text-3xl">{point.icon}</div>
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

      {/* Capabilities */}
      <section className="section-divider px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
              Capabilities
            </p>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Everything your business needs to grow.
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {capabilities.map((cap) => (
              <div
                key={cap.tag}
                className="group rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-8 transition-all hover:border-harper-gold/30"
              >
                <span className="mb-4 inline-block rounded-full bg-harper-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-harper-gold">
                  {cap.tag}
                </span>
                <h3 className="mb-3 font-display text-xl font-semibold">
                  {cap.title}
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-chalk/60">
                  {cap.description}
                </p>
                <ul className="space-y-2">
                  {cap.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-chalk/50"
                    >
                      <span className="h-1 w-1 rounded-full bg-harper-gold" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="section-divider px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
              How It Works
            </p>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Three steps to smarter growth.
            </h2>
          </div>
          <div className="grid gap-12 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <span className="font-mono text-5xl font-bold text-harper-gold/20">
                  {step.number}
                </span>
                <h3 className="mt-4 font-display text-2xl font-semibold">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-chalk/60">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-divider px-6 py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-4xl font-bold md:text-5xl">
            Ready to see what you&apos;re missing?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-chalk/60">
            Get a comprehensive AI diagnostic of your business in under 24
            hours. No commitment, no jargon — just clarity.
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

      {/* Footer */}
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
