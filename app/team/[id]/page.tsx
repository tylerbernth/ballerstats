import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCalendar from "@/components/AddToCalendar";
import LineChart from "@/components/LineChart";
import StatsTable, { type StatRow } from "@/components/StatsTable";
import { getPlayers, getRosters, getSeasons, getStats, getTeam } from "@/lib/directus";
import { displayName, nameParts, same } from "@/lib/format";
import { agg, groupBy } from "@/lib/stats";
import type { Player } from "@/lib/types";
import { Crumb, Empty, Face, H2, Meta, Title, photoSrc } from "@/components/ui";

const rate = (made: number, att: number) => (att ? (made / att) * 100 : null);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const team = await getTeam(id);
  if (!team) return {};
  const season = (await getSeasons()).find((s) => same(s.id, team.season))?.season_name ?? "";
  const photo = team.photo ? (/^https?:\/\//i.test(team.photo) ? team.photo : `/photo/${team.photo}?w=960`) : null;
  return {
    title: `${team.name}${season ? `, ${season}` : ""}`,
    description: `${team.name} roster, stats and record (${team.wins ?? 0}-${team.losses ?? 0}) for ${season} of the Crossroads Basketball League.`,
    ...(photo ? { openGraph: { images: [{ url: photo }] } } : {}),
  };
}

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await getTeam(id);
  if (!team) notFound();

  const [seasons, players, rosters, stats] = await Promise.all([
    getSeasons(),
    getPlayers(),
    getRosters({ team: team.id }),
    getStats({ team: team.id }),
  ]);
  const season = seasons.find((s) => same(s.id, team.season));
  const byId = new Map(players.map((p) => [String(p.id), p]));
  const byPlayer = groupBy(stats, (r) => String(r.player));

  const roster = rosters
    .map((r) => byId.get(String(r.player)))
    .filter((p): p is Player => !!p)
    .sort((a, b) => nameParts(a).last.localeCompare(nameParts(b).last));

  const rows: StatRow[] = roster.map((p) => {
    const a = agg(byPlayer.get(String(p.id)) ?? []);
    const { first, last } = nameParts(p);
    return {
      id: String(p.id), first, last, gp: a.gp, pts: a.pts, fg: rate(a.fgm, a.fga), tp: rate(a.tpm, a.tpa),
      tpm: a.tpm, tpa: a.tpa, ft: rate(a.ftm, a.fta), ast: a.ast, stl: a.stl, blk: a.blk, reb: a.reb,
    };
  });

  // Only rows with a game value can be grouped into games.
  const withGame = stats.filter((r) => r.game != null);
  const byGame = groupBy(withGame, (r) => String(r.game));
  const games = [...byGame.values()].map((g) => {
    const a = agg(g);
    return { pts: a.pts, reb: a.reb, fg: rate(a.fgm, a.fga) };
  });
  const rowsPerGame = withGame.length / (byGame.size || 1);
  // If each "game" holds about one player's row, team totals by game would be wrong, so do not draw them.
  const chartOk = games.length > 0 && !(rowsPerGame < 2 && roster.length >= 4);
  const role = (p: Player) => (same(p.id, team.captain) ? "Captain" : same(p.id, team.cocaptain) ? "Co-captain" : "");

  return (
    <>
      <Crumb href={`/teams/${team.season}`}>{season?.season_name} teams</Crumb>
      {team.photo ? (
        <div className="relative mb-6 overflow-hidden rounded-md bg-blue-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoSrc(team.photo, 1600)} alt={`${team.name} team photo`} className="aspect-[16/10] w-full object-cover object-top sm:aspect-[21/9]" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 to-transparent px-5 pb-5 pt-20 sm:px-8 sm:pb-7">
            <h1 className="font-display text-5xl font-bold uppercase leading-none text-white sm:text-7xl">{team.name}</h1>
          </div>
        </div>
      ) : (
        <Title>{team.name}</Title>
      )}
      <Meta>
        {season?.season_name}
        {team.other_name ? `, also known as ${team.other_name}` : ""}. Record {team.wins ?? 0}-{team.losses ?? 0}.
      </Meta>

      {same(team.season, seasons[0]?.id) && <AddToCalendar teams={[{ id: String(team.id), name: team.name }]} />}

      <H2>Roster</H2>
      {roster.length ? (
        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4">
          {roster.map((p) => (
            <li key={String(p.id)}>
              <Link href={`/player/${p.id}?season=${team.season}`} className="group flex flex-col items-center gap-2 text-center">
                <span className="w-full max-w-44">
                  <Face player={p} size={192} fluid />
                </span>
                <span className="font-semibold underline decoration-transparent underline-offset-4 group-hover:text-red-700 group-hover:decoration-red-600">
                  {displayName(p)}
                </span>
                {role(p) && <span className="-mt-1.5 text-sm text-slate-600">{role(p)}</span>}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty title="No players on this roster" />
      )}

      {stats.length > 0 && (
        <>
          <H2>Team stats by game</H2>
          {chartOk ? (
            <div className="space-y-4">
              <LineChart
                heading="Points, rebounds and field goal percentage"
                title={`${team.name} points, rebounds and field goal percentage by game`}
                labels={games.map((_, i) => `Game ${i + 1}`)}
                series={[
                  { name: "Points", color: "#dc2626", values: games.map((g) => g.pts) },
                  { name: "Rebounds", color: "#d97706", values: games.map((g) => g.reb) },
                  { name: "FG%", color: "#2563eb", values: games.map((g) => g.fg), suffix: "%" },
                ]}
              />
              {stats.length > withGame.length && (
                <p className="text-slate-600">{stats.length - withGame.length} stat rows have no game assigned and are left out of these charts.</p>
              )}
            </div>
          ) : (
            <Empty title="Stats cannot be charted by game yet">
              Every player&apos;s row from the same game needs the same value in the game field. Right now {stats.length - withGame.length} of {stats.length} rows have
              no game, and the rest average {rowsPerGame.toFixed(1)} rows per game.
            </Empty>
          )}
        </>
      )}

      {rows.length > 0 && (
        <>
          <H2>Player stats</H2>
          <StatsTable rows={rows} seasonId={String(team.season)} />
        </>
      )}
    </>
  );
}
