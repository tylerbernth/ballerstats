import Link from "next/link";
import { LEAGUE } from "@/lib/site";

const LINKS = [
  { href: "/schedule", label: "Schedule" },
  { href: "/recaps", label: "Weekly Recaps" },
  { href: "/records", label: "All-Time Records" },
  { href: "/champions", label: "Past Champions" },
  { href: "/rules", label: "Rules & Guidelines" },
];

const YOUTUBE_URL = "https://www.youtube.com/@JDISportsorg";

const socialClass =
  "inline-flex items-center gap-2.5 font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white";

export default function Footer() {
  // Set INSTAGRAM_URL in .env.local, for example https://www.instagram.com/yourhandle
  const instagram = process.env.INSTAGRAM_URL;

  return (
    <footer className="bg-blue-900 text-blue-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto_auto] md:gap-16">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.png" alt={LEAGUE} width={163} height={32} className="h-8 w-auto" />
          <p className="mt-4 max-w-xs">Community basketball on Sundays at Corona Friends Church.</p>

          {/* The logo is black and red, so it sits on a white plate to stay readable on navy. */}
          <span className="mt-8 inline-block rounded bg-white px-3.5 py-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/jdi-sports-logo.png" alt="JDI Sports" width={186} height={36} className="h-9 w-auto" />
          </span>
        </div>

        <nav aria-label="More pages">
          <h2 className="mb-3 font-display text-xl font-bold tracking-wide text-white">Explore</h2>
          <ul className="space-y-2">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="underline decoration-white/30 underline-offset-4 hover:text-white hover:decoration-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mb-3 font-display text-xl font-bold tracking-wide text-white">Follow us</h2>
          <ul className="space-y-3">
            {instagram && (
              <li>
                <a href={instagram} target="_blank" rel="noopener noreferrer" className={socialClass}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                  Instagram
                </a>
              </li>
            )}
            <li>
              <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className={socialClass}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="2" y="5" width="20" height="14" rx="4" />
                  <path d="M10 9.5v5l4.5-2.5z" fill="currentColor" stroke="none" />
                </svg>
                YouTube
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <p className="mx-auto max-w-6xl px-4 py-4 text-[.9375rem] sm:px-6">
          © {new Date().getFullYear()} {LEAGUE}
        </p>
      </div>
    </footer>
  );
}
