import type { Metadata } from "next";
import "@unisentinel/ui/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "UniSentinel", template: "%s · UniSentinel" },
  description: "UniSentinel GRC platform",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
