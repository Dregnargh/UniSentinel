import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import "./site.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const SITE = "https://unisentinel.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "UniSentinel — Unified GRC & ERP Platform",
    template: "%s · UniSentinel",
  },
  description:
    "UniSentinel unifies governance, risk and compliance with enterprise resource planning — one platform to run controls, audits, vendors, finance and operations with continuous assurance.",
  keywords: [
    "GRC platform",
    "governance risk compliance",
    "ERP software",
    "SOC 2",
    "ISO 27001",
    "risk management",
    "compliance automation",
    "audit management",
    "vendor risk",
  ],
  authors: [{ name: "UniSentinel" }],
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "UniSentinel",
    title: "UniSentinel — Unified GRC & ERP Platform",
    description:
      "One platform for governance, risk, compliance and ERP — with continuous, evidence-backed assurance.",
  },
  twitter: {
    card: "summary_large_image",
    title: "UniSentinel — Unified GRC & ERP Platform",
    description:
      "One platform for governance, risk, compliance and ERP — with continuous assurance.",
  },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
