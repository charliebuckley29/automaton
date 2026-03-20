import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const features = [
  "50+ dimension business diagnostic",
  "AI-led 15-minute voice interview",
  "Competitor landscape analysis",
  "SEO & online presence audit",
  "Operations efficiency scoring",
  "Revenue growth opportunities",
  "Prioritised action roadmap",
  "Downloadable PDF report",
];

interface ActiveOffer {
  id: string;
  offer_code: string;
  display_name: string;
  offer_price_gbp: number;
  offer_price_usd: number;
  original_price_gbp: number;
  original_price_usd: number;
  stripe_promo_code: string;
  ends_at: string | null;
  max_redemptions: number | null;
  current_redemptions: number;
}

async function getActiveOffer(): Promise<ActiveOffer | null> {
  try {
    const supabase = await createServerClient();
    const now = new Date().toISOString();

    const { data } = await supabase
      .from("active_offers")
      .select("*")
      .eq("active", true)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    // Check redemption limits
    if (data.max_redemptions && data.current_redemptions >= data.max_redemptions) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export default async function ReportsPage() {
  const offer = await getActiveOffer();

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
              href="/"
              className="text-sm text-chalk/70 transition-colors hover:text-chalk"
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-chalk/70 transition-colors hover:text-chalk"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero / VSL Section */}
      <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-6 text-sm font-medium uppercase tracking-[0.3em] text-harper-gold">
            Harper Diagnostic Report
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
            Know exactly where your
            <br />
            <span className="text-gold-gradient">business stands.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-chalk/70">
            A comprehensive AI diagnostic that analyses your business across 50+
            dimensions — then tells you precisely what to fix, in what order, and
            why it matters.
          </p>
        </div>

        {/* VSL Placeholder */}
        <div className="mx-auto mt-12 w-full max-w-3xl">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-chalk/10 bg-chalk/[0.02]">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-harper-gold/40 bg-harper-gold/10">
                <svg
                  className="ml-1 h-6 w-6 text-harper-gold"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-sm text-chalk/40">
                Watch: How Harper Diagnostics Work
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing & Features */}
      <section className="section-divider px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-12 md:grid-cols-2">
            {/* Features */}
            <div>
              <h2 className="mb-8 font-display text-2xl font-bold">
                What&apos;s included
              </h2>
              <ul className="space-y-4">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-harper-gold"
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
                    <span className="text-chalk/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price Card */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-harper-gold/20 bg-chalk/[0.02] p-10">
              {offer && (
                <p className="mb-2 rounded-full bg-harper-gold/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-harper-gold">
                  {offer.display_name ?? "Limited Offer"}
                </p>
              )}
              {offer ? (
                <>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl text-chalk/40 line-through">
                      £{(offer.original_price_gbp / 100).toFixed(0)}
                    </span>
                    <span className="font-display text-5xl font-bold text-chalk">
                      £{(offer.offer_price_gbp / 100).toFixed(0)}
                    </span>
                    <span className="text-chalk/40">/report</span>
                  </div>
                  <p className="mt-1 text-sm text-chalk/50">
                    ~${(offer.offer_price_usd / 100).toFixed(0)} USD
                  </p>
                  {offer.ends_at && (
                    <p className="mt-2 text-xs font-medium text-score-amber">
                      Offer ends {new Date(offer.ends_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-display text-5xl font-bold text-chalk">
                      £47
                    </span>
                    <span className="text-chalk/40">/report</span>
                  </div>
                  <p className="mt-1 text-sm text-chalk/50">~$57 USD</p>
                </>
              )}
              <p className="mt-6 text-center text-sm leading-relaxed text-chalk/60">
                One-time payment. No subscriptions.
                <br />
                Results delivered within 24 hours.
              </p>
              <Link
                href="/reports"
                className="mt-8 w-full rounded-full bg-harper-gold px-8 py-4 text-center text-base font-semibold text-midnight transition-all hover:bg-harper-gold/90 hover:shadow-lg hover:shadow-harper-gold/20"
              >
                Start my report{offer ? ` — £${(offer.offer_price_gbp / 100).toFixed(0)}` : " — £47"}
              </Link>
              <p className="mt-4 text-xs text-chalk/30">
                Secure payment via Stripe
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-divider px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
            Simple Process
          </p>
          <h2 className="mb-16 font-display text-3xl font-bold">
            From purchase to insight in three steps.
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Purchase & Intake",
                desc: "Complete a short intake form about your business. Takes about 5 minutes.",
              },
              {
                step: "02",
                title: "AI Interview",
                desc: "Our AI conducts a focused 15-minute voice interview to understand your goals and challenges.",
              },
              {
                step: "03",
                title: "Your Report",
                desc: "Receive a scored diagnostic report with a prioritised roadmap within 24 hours.",
              },
            ].map((item) => (
              <div key={item.step}>
                <span className="font-mono text-4xl font-bold text-harper-gold/20">
                  {item.step}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-chalk/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-divider px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Stop guessing. Start knowing.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-chalk/60">
            Every day without clarity is a day your competitors get further
            ahead. Get your diagnostic now.
          </p>
          <Link
            href="/reports"
            className="mt-8 inline-block rounded-full bg-harper-gold px-10 py-4 text-lg font-semibold text-midnight transition-all hover:bg-harper-gold/90 hover:shadow-lg hover:shadow-harper-gold/20"
          >
            Start my report — £47
          </Link>
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
