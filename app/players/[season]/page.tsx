import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PlayerGrid, { type PlayerCard } from "@/components/PlayerGrid";
import { getPlayers, getRosters, getSeasons, getStats } from "@/lib/directus";
import { displayName, same } from "@/lib/format";
import { Meta, Title } from "@/components/ui";

export async function generateMetadata({ params }: { params: Promise<{ season: string }> }): Promise<Metadata> {
  const { season } = await params;
  const s = (await getSeasons()).find((x) => same(x.id, season));
  if (!s) return {};
  return {
    title: `${s.season_name} players`,
    description: `Everyone who played in ${s.season_name} of the Crossroads Basketball League. Select a player for career and season stats.`,
  };
}

export default async function PlayersPage({ params }: { params: Promise<{ season: string }> }) {
  const { season } = await params;
  const s = (await getSeasons()).find((x) => same(x.id, season));
  if (!s) notFound();

  const [players, rosters, stats] = await Promise.all([getPlayers(), getRosters({ season: s.id }), getStats({ season: s.id })]);
  const inSeason = new Set([...rosters.map((r) => String(r.player)), ...stats.map((r) => String(r.player))]);

  const cards: PlayerCard[] = players
    .filter((p) => inSeason.has(String(p.id)))
    .map((p) => ({ id: String(p.id), name: displayName(p), headshot: p.headshot }));

  return (
    <>
      <Title>{s.season_name} players</Title>
      <Meta>{cards.length} players. Select a player to see their stats.</Meta>
      <PlayerGrid players={cards} seasonId={String(s.id)} />
    </>
  );
}
