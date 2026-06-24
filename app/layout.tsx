import type { Metadata } from "next";
import { markOT } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "uplight IQ | Lead Intelligence",
  description:
    "Central dashboard for lead health, Salesforce pipeline visibility, and uplight.com engagement.",
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
