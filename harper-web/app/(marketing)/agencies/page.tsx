import Link from "next/link";
import type { Metadata } from "next";

/* ------------------------------------------------------------------ */
/*  Metadata (SSG)                                                     */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "White-Label AI Reports for Agencies | Harper Automation",
  description:
    "Deliver AI-powered intelligence reports under your own brand. Bulk pricing saves 50%+. Your clients think it\u2019s your tech.",
};

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const valueProps = [
  {
    icon: (
      <svg className="h-8 w-8 text-harper-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: "Deliver AI Reports Under Your Brand",
    description:
      "Full diagnostic reports your clients receive with your logo, your colours, and your agency name. They never see Harper.",
  },
  {
    icon: (
      <svg className="h-8 w-8 text-harper-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    title: "Bulk Pricing Saves 50%+",
    description:
      "Buy packs of report credits at a fraction of the single-report price. The more you buy, the more margin you make.",
  },
  {
    icon: (
      <svg className="h-8 w-8 text-harper-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    title: "Your Clients Think It\u2019s Your Tech",
    description:
      "Position yourself as the AI-forward agency. Clients see cutting-edge reports with your branding \u2014 you keep the magic behind the curtain.",
  },
];

const pricingTiers = [
  {
    name: "Starter",
    reports: 3,
    price: 99,
    perReport: "33.00",
    savings: "30%",
    popular: false,
  },
  {
    name: "Growth",
    reports: 5,
    price: 149,
    perReport: "29.80",
    savings: "37%",
    popular: true,
  },
  {
    name: "Scale",
    reports: 10,
    price: 249,
    perReport: "24.90",
    savings: "47%",
    popular: false,
  },
  {
    name: "Agency Pro",
    reports: 25,
    price: 499,
    perReport: "19.96",
    savings: "58%",
    popular: false,
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Buy Credits",
    description:
      "Choose a pack size that fits your client pipeline. Credits never expire.",
  },
  {
    step: "02",
    title: "Assign to Clients",
    description:
      "Send your client a branded intake link. They complete the short onboarding form.",
  },
  {
    step: "03",
    title: "They Complete the Interview",
    description:
      "Your client has a 15-minute AI-led voice interview. No effort required from your team.",
  },
  {
    step: "04",
    title: "Report Delivered in Your Branding",
    description:
      "A comprehensive diagnostic report is generated and delivered under your agency\u2019s brand within 24 hours.",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AgenciesPage() {
  return (
    <main className="min-h-screen bg-midnight">
      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-harper-gold/10 bg-midnight/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-display text-xl font-bold text-chalk">
            Harper<span className="text-harper-gold">.</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="text-sm text-chalk/70 transition-colors hover:text-chalk"
            >
              Home
            </Link>
            <Link
              href="/reports"
              className="text-sm text-chalk/70 transition-colors hover:text-chalk"
            >
              Reports
            </Link>
            <a
              href="#pricing"
              className="rounded-full bg-harper-gold px-5 py-2 text-sm font-medium text-midnight transition-all hover:bg-harper-gold/90"
            >
              View Pricing
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden px-6 pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(201,168,76,0.06)_0%,_transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="mb-6 text-sm font-medium uppercase tracking-[0.3em] text-harper-gold">
            For Agencies &amp; Consultancies
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            White-label AI intelligence
            <br />
            <span className="text-gold-gradient">reports for your clients.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-chalk/70">
            Deliver comprehensive business diagnostic reports under your own
            brand. Bulk pricing means you keep the margin. Your clients think
            it&apos;s your tech.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#pricing"
              className="rounded-full bg-harper-gold px-8 py-3.5 text-base font-semibold text-midnight transition-all hover:bg-harper-gold/90 hover:shadow-lg hover:shadow-harper-gold/20"
            >
              Buy your first pack
            </a>
            <a
              href="#how-it-works"
              className="rounded-full border border-chalk/20 px-8 py-3.5 text-base font-medium text-chalk transition-all hover:border-chalk/40 hover:bg-chalk/5"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* ── Value Proposition ─────────────────────────────────────────── */}
      <section className="section-divider px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
              Why Agencies Choose Harper
            </p>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              A new revenue stream with zero extra work.
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {valueProps.map((prop) => (
              <div
                key={prop.title}
                className="rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-8 transition-all hover:border-harper-gold/20 hover:bg-chalk/[0.04]"
              >
                <div className="mb-4">{prop.icon}</div>
                <h3 className="mb-3 font-display text-xl font-semibold">
                  {prop.title}
                </h3>
                <p className="text-sm leading-relaxed text-chalk/60">
                  {prop.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bulk Pricing ──────────────────────────────────────────────── */}
      <section id="pricing" className="section-divider px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
              Bulk Pricing
            </p>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              The more you buy, the more you make.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-chalk/60">
              Single reports retail at &pound;47. Buy in bulk to increase your
              margin and deliver more value to clients.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-8 transition-all hover:border-harper-gold/30 ${
                  tier.popular
                    ? "border-harper-gold/40 bg-harper-gold/[0.04]"
                    : "border-chalk/10 bg-chalk/[0.02]"
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-harper-gold px-3 py-1 text-xs font-semibold text-midnight">
                    Most Popular
                  </span>
                )}
                <h3 className="text-sm font-semibold uppercase tracking-wider text-chalk/50">
                  {tier.name}
                </h3>
                <p className="mt-1 text-xs text-chalk/40">
                  {tier.reports} reports
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-chalk">
                    &pound;{tier.price}
                  </span>
                  <span className="text-sm text-chalk/40">/pack</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-chalk/60">
                    &pound;{tier.perReport}/report
                  </span>
                  <span className="rounded-full bg-score-green/10 px-2 py-0.5 text-xs font-medium text-score-green">
                    Save {tier.savings}
                  </span>
                </div>
                <a
                  href="#pricing"
                  className={`mt-6 block w-full rounded-full py-3 text-center text-sm font-semibold transition-all ${
                    tier.popular
                      ? "bg-harper-gold text-midnight hover:bg-harper-gold/90"
                      : "border border-chalk/20 text-chalk hover:border-chalk/40 hover:bg-chalk/5"
                  }`}
                >
                  Buy {tier.reports}-pack
                </a>
              </div>
            ))}
          </div>

          {/* White-label add-on */}
          <div className="mt-12 rounded-2xl border border-harper-gold/20 bg-harper-gold/[0.03] p-8 md:p-10">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <span className="rounded-full bg-harper-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-harper-gold">
                    Add-On
                  </span>
                  <h3 className="font-display text-xl font-semibold text-chalk">
                    White-Label Branding
                  </h3>
                </div>
                <p className="max-w-lg text-sm leading-relaxed text-chalk/60">
                  Add your custom logo, brand colours, and agency name to every
                  report in the pack. Your clients will never see the Harper
                  name &mdash; it looks and feels like your own proprietary
                  technology.
                </p>
              </div>
              <div className="shrink-0 text-right">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold text-harper-gold">
                    +&pound;50
                  </span>
                  <span className="text-sm text-chalk/40">/pack</span>
                </div>
                <p className="mt-1 text-xs text-chalk/40">
                  Added to any pack above
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="section-divider px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
              How It Works
            </p>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Four steps. Zero effort from your team.
            </h2>
          </div>
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((item) => (
              <div key={item.step} className="relative">
                <span className="font-mono text-5xl font-bold text-harper-gold/20">
                  {item.step}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold">
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

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="section-divider px-6 py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-4xl font-bold md:text-5xl">
            Start delivering AI reports today.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-chalk/60">
            Join agencies already using Harper to deliver premium diagnostic
            reports at scale &mdash; under their own brand.
          </p>
          <a
            href="#pricing"
            className="mt-10 inline-block rounded-full bg-harper-gold px-10 py-4 text-lg font-semibold text-midnight transition-all hover:bg-harper-gold/90 hover:shadow-lg hover:shadow-harper-gold/20"
          >
            Buy your first pack
          </a>
          <p className="mt-4 text-xs text-chalk/40">
            No subscriptions. Credits never expire. White-label available.
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
