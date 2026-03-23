import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Business Scorecard",
  description:
    "Rate your business across digital presence, operations, marketing, AI readiness, and growth in under 5 minutes. Get a free scored assessment with personalised recommendations.",
  openGraph: {
    title: "Free Business Scorecard | Harper Automation",
    description:
      "Score your business across 5 key dimensions and get instant AI-powered recommendations — completely free.",
    type: "website",
  },
  alternates: {
    canonical: "/scorecard",
  },
};

export default function ScorecardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
