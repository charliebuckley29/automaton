import type { Metadata } from "next";
import { DashboardNav } from "./dashboard-nav";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "View your Harper diagnostic reports, recommendations, and business insights.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-midnight text-chalk">
      <DashboardNav />
      <main>{children}</main>
    </div>
  );
}
