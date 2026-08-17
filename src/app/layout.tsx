import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";

const fraunces = localFont({
  src: "./fonts/Fraunces.woff2",
  weight: "100 900",
  variable: "--font-fraunces",
  display: "swap",
});

const inter = localFont({
  src: "./fonts/Inter.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

const plexMono = localFont({
  src: [
    { path: "./fonts/IBMPlexMono-Regular.woff2", weight: "400" },
    { path: "./fonts/IBMPlexMono-Medium.woff2", weight: "500" },
    { path: "./fonts/IBMPlexMono-SemiBold.woff2", weight: "600" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HireSense AI — Explainable AI Resume Screening & Job Matching",
  description:
    "Upload a resume and a job description. Get a match score backed by evidence, not a black box.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
