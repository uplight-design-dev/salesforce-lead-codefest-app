import localFont from "next/font/local";

export const markOT = localFont({
  src: [
    { path: "../MarkOT/MarkOT-Book.otf", weight: "400", style: "normal" },
    { path: "../MarkOT/MarkOT-Medium.otf", weight: "500", style: "normal" },
    { path: "../MarkOT/MarkOT-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-markot",
  display: "swap",
});
