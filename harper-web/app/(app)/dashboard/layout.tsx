import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your Harper diagnostic reports, recommendations, and business insights.",
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
  return children;
}
