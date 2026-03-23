import type { Metadata } from "next";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://harper.ai"),
  title: {
    default: "Harper Automation — AI-Powered Growth for SMEs",
    template: "%s | Harper Automation",
  },
  description:
    "Harper Automation diagnoses your business, builds intelligent automations, and compounds growth — so you can focus on what matters.",
  openGraph: {
    title: "Harper Automation — AI-Powered Growth for SMEs",
    description:
      "AI-powered diagnostics and automation for small and medium businesses.",
    type: "website",
    siteName: "Harper Automation",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Harper Automation — AI-Powered Growth for SMEs",
    description:
      "AI-powered diagnostics and automation for small and medium businesses.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  themeColor: "#0D0D0D",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body className="bg-midnight text-chalk font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
