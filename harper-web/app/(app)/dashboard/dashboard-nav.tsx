"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/retainer", label: "Retainer" },
  { href: "/dashboard/implementations", label: "Implementations" },
] as const;

export function DashboardNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <nav className="border-b border-chalk/10 bg-midnight/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center gap-8 h-14">
          {NAV_LINKS.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors duration-150 ${
                  active
                    ? "text-harper-gold border-b-2 border-harper-gold pb-[calc(0.875rem-2px)] pt-[0.875rem]"
                    : "text-chalk/50 hover:text-chalk/80"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
