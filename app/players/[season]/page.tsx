import { notFound } from "next/navigation";
import PlayerTable, { type PlayerRow } from "@/components/PlayerTable";
import { getPlayers, getRosters, getSeasons, getStats } from "@/lib/directus";
import { displayName, same } from "@/lib/format";
import { agg, groupBy, per } from "@/lib/stats";
import { Meta, Title } from "@/components/ui";

export default async function PlayersPage({ params }: { params: Promise<{ season: string }> }) {
  const { season } = await params;
  const s = (await getSeasons()).find((x) => same(x.id, season));
  if (!s) notFound();

  const [players, rosters, stats] = await Promise.all([getPlayers(), getRosters({ season: s.id }), getStats({ season: s.id })]);
  const byPlayer = groupBy(stats, (r) => String(r.player));
  const inSeason = new Set([...rosters.map((r) => String(r.player)), ...byPlayer.keys()]);

  const rows: PlayerRow[] = players
    .filter((p) => inSeason.has(String(p.id)))
    .map((p) => {
      const a = agg(byPlayer.get(String(p.id)) ?? []);
      return { id: String(p.id), name: displayName(p), headshot: p.headshot, gp: a.gp, pts: per(a.pts, a.gp), reb: per(a.reb, a.gp), ast: per(a.ast, a.gp) };
    });

  return (
    <>
      <Title>Players</Title>
      <Meta>
        {rows.length} players in {s.season_name}, with per-game averages.
      </Meta>
      <PlayerTable rows={rows} seasonId={String(s.id)} />
    </>
  );
}
