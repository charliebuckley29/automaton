import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/reports", label: "Reports" },
  { href: "/pricing", label: "Pricing" },
  { href: "/agencies", label: "Agencies" },
  { href: "/scorecard", label: "Scorecard" },
];

const footerColumns = [
  {
    title: "Product",
    links: [
      { href: "/reports", label: "Reports" },
      { href: "/scorecard", label: "Scorecard" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/agencies", label: "Agencies" },
      { href: "/pricing", label: "Pricing" },
      { href: "/case-studies", label: "Case Studies" },
    ],
  },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-harper-gold/10 bg-midnight/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-display text-xl font-bold text-chalk"
          >
            Harper<span className="text-harper-gold">.</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-chalk/70 transition-colors hover:text-chalk"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/reports"
              className="rounded-full bg-harper-gold px-5 py-2 text-sm font-medium text-midnight transition-all hover:bg-harper-gold/90"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <label
            htmlFor="mobile-menu-toggle"
            className="relative z-50 flex h-8 w-8 cursor-pointer flex-col items-center justify-center gap-1.5 md:hidden"
            aria-label="Toggle menu"
          >
            <input
              type="checkbox"
              id="mobile-menu-toggle"
              className="peer sr-only"
            />
            <span className="block h-0.5 w-5 bg-chalk transition-all peer-checked:translate-y-[0.375rem] peer-checked:rotate-45" />
            <span className="block h-0.5 w-5 bg-chalk transition-all peer-checked:opacity-0" />
            <span className="block h-0.5 w-5 bg-chalk transition-all peer-checked:-translate-y-[0.375rem] peer-checked:-rotate-45" />
          </label>
        </div>

        {/* Mobile menu panel — uses CSS :has() to toggle on checkbox */}
        <div className="max-h-0 overflow-hidden transition-all duration-300 ease-in-out md:hidden [nav:has(#mobile-menu-toggle:checked)_&]:max-h-[400px]">
          <div className="border-t border-chalk/10 px-6 pb-6 pt-4">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-chalk/70 transition-colors hover:text-chalk"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/reports"
                className="mt-2 rounded-full bg-harper-gold px-5 py-2.5 text-center text-sm font-medium text-midnight transition-all hover:bg-harper-gold/90"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Nav spacer */}
      <div className="h-[73px]" />

      {/* Page content */}
      {children}

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-chalk/10 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 md:grid-cols-4">
            {/* Brand column */}
            <div className="md:col-span-2">
              <p className="font-display text-xl font-bold">
                Harper<span className="text-harper-gold">.</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-chalk/50">
                AI-powered growth intelligence for small and medium businesses.
              </p>
            </div>

            {/* Link columns */}
            {footerColumns.map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-chalk/40">
                  {col.title}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={`${col.title}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-sm text-chalk/60 transition-colors hover:text-chalk"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-chalk/10 pt-8 md:flex-row">
            <p className="text-xs text-chalk/40">
              &copy; {new Date().getFullYear()} Harper Automation Ltd. All
              rights reserved.
            </p>
            <p className="text-xs text-chalk/30">
              AI-powered growth intelligence
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
