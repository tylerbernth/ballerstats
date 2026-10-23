import Link from "next/link";
import type { ID, Player, Team } from "@/lib/types";
import { displayName } from "@/lib/format";

export const Title = ({ children }: { children: React.ReactNode }) => (
  <h1 className="mb-2 font-display text-4xl font-bold uppercase leading-none tracking-tight text-blue-900 sm:text-6xl">{children}</h1>
);

export const Meta = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-10 max-w-prose text-slate-600">{children}</p>
);

export const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-4 mt-12 font-display text-3xl font-bold tracking-wide text-blue-900">{children}</h2>
);

export const Crumb = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="mb-4 inline-block text-[.9375rem] text-slate-600 underline underline-offset-4 hover:text-red-700">
    {children}
  </Link>
);

export const Empty = ({ title, children }: { title: string; children?: React.ReactNode }) => (
  <p className="py-10 text-slate-600">
    <strong className="text-slate-900">{title}.</strong> {children}
  </p>
);

// The headshot field can hold either a full image URL or a Directus file id.
const headshotSrc = (value: string, size: number) =>
  /^https?:\/\//i.test(value) ? value : `/headshot/${value}?w=${size * 2}`;

export function Face({ player, size = 36, fluid = false }: { player?: Pick<Player, "headshot"> | null; size?: number; fluid?: boolean }) {
  // fluid fills the width of its container (square); otherwise the box is `size` pixels.
  const box = fluid ? undefined : { width: size, height: size };
  const shape = fluid ? "aspect-square w-full" : "";
  if (!player?.headshot) {
    return (
      <span className={`inline-flex shrink-0 overflow-hidden rounded-full bg-blue-100 ${shape}`} style={box}>
        <svg viewBox="0 0 100 100" aria-hidden className="h-full w-full">
          <circle cx="50" cy="38" r="17" fill="#93c5fd" />
          <ellipse cx="50" cy="93" rx="34" ry="30" fill="#93c5fd" />
        </svg>
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={headshotSrc(player.headshot, size)}
      alt=""
      loading="lazy"
      className={`shrink-0 rounded-full bg-blue-100 object-cover ${shape}`}
      style={box}
    />
  );
}

// Team photos keep their shape (no square crop); the page decides how to crop them with CSS.
export const photoSrc = (value: string, width: number) =>
  /^https?:\/\//i.test(value) ? value : `/photo/${value}?w=${width}`;

export function TeamPhoto({ team, width = 960, className = "" }: { team: Pick<Team, "name" | "photo">; width?: number; className?: string }) {
  if (!team.photo) {
    const initials = team.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    return (
      <div aria-hidden className={`flex items-center justify-center bg-blue-100 font-display text-6xl font-bold text-blue-300 ${className}`}>
        {initials}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoSrc(team.photo, width)} alt="" loading="lazy" className={`bg-blue-100 object-cover ${className}`} />
  );
}

export function PlayerLink({ player, season }: { player?: Player | null; season?: ID }) {
  if (!player) return null;
  return (
    <Link
      href={`/player/${player.id}${season != null ? `?season=${season}` : ""}`}
      className="font-semibold underline decoration-slate-300 underline-offset-4 hover:text-red-700 hover:decoration-red-600"
    >
      {displayName(player)}
    </Link>
  );
}

export function TeamLink({ team }: { team?: Team | null }) {
  return team ? (
    <Link href={`/team/${team.id}`} className="font-semibold underline decoration-slate-300 underline-offset-4 hover:text-red-700 hover:decoration-red-600">
      {team.name}
    </Link>
  ) : null;
}
