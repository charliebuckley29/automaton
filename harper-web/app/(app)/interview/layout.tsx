import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interview",
  description: "AI-led voice interview for your Harper business diagnostic.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function InterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
