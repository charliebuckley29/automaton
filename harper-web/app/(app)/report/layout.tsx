import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diagnostic Report",
  description: "Your comprehensive Harper AI diagnostic report with scored insights and prioritised recommendations.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
