import type { Metadata } from "next";
import { Barlow_Condensed, Source_Sans_3 } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const display = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display-src" });
const sans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-sans-src" });

export const metadata: Metadata = {
  title: { default: "Ballerstats", template: "%s | Ballerstats" },
  description: "Standings, rosters and player stats for the Xroads basketball league.",
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
