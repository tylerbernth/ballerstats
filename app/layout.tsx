import type { Metadata } from "next";
import { Barlow_Condensed, Source_Sans_3 } from "next/font/google";
import Header from "@/components/Header";
import { LEAGUE, SITE_URL } from "@/lib/site";
import "./globals.css";

const display = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display-src" });
const sans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-sans-src" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Ballerstats | Crossroads Basketball League stats, schedule and rosters", template: "%s | Ballerstats" },
  description: "Standings, rosters, schedule and player stats for the Crossroads Basketball League.",
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    siteName: "Ballerstats",
    locale: "en_US",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: LEAGUE }],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} bg-slate-50 font-sans text-[1.0625rem] leading-relaxed text-slate-900 antialiased`}>
        <Header />
        <main className="mx-auto min-h-[60vh] max-w-6xl px-4 pb-16 pt-10 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
