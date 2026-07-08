import type { Metadata } from "next";
import { markOT } from "./fonts";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "uplight IQ | Lead Intelligence",
  description:
    "Central dashboard for lead health, Salesforce pipeline visibility, and uplight.com engagement.",
  openGraph: {
    title: "uplight IQ | Lead Intelligence",
    description:
      "Central dashboard for lead health, Salesforce pipeline visibility, and uplight.com engagement.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "uplight IQ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${markOT.variable} font-sans`}>{children}</body>
    </html>
  );
}
