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

export function Face({ player, size = 36 }: { player?: Pick<Player, "headshot"> | null; size?: number }) {
  const box = { width: size, height: size };
  if (!player?.headshot) return <span className="inline-block shrink-0 rounded-full bg-blue-200" style={box} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/headshot/${player.headshot}?w=${size * 2}`}
      alt=""
      loading="lazy"
      className="shrink-0 rounded-full bg-blue-200 object-cover"
      style={box}
    />
  );
}

export function PlayerLink({ player, season }: { player?: Player | null; season?: ID }) {
  if (!player) return null;
  return <Link href={`/player/${player.id}${season != null ? `?season=${season}` : ""}`}>{displayName(player)}</Link>;
}

export function TeamLink({ team }: { team?: Team | null }) {
  return team ? <Link href={`/team/${team.id}`}>{team.name}</Link> : null;
}
