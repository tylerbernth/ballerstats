import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { Dot } from "@/components/JerseyKey";
import { Crumb, H2, Meta, PlayerLink, TeamLink, Title } from "@/components/ui";
import { getPlayers, getSeasons, getStats, getTeams } from "@/lib/directus";
import { displayName, same } from "@/lib/format";
import { matchSchedule, playedGames } from "@/lib/games";
import { dayLabel, getSchedule, norm, toGames, type Game } from "@/lib/schedule";
import { agg, groupBy } from "@/lib/stats";

const n = (v: number | null) => Number(v) || 0;
const made = (m: number, a: number) => `${m}-${a}`;

// One game's stat rows, the two teams, and (for the newest season) the date and time from the schedule sheet.
const load = cache(async (id: string) => {
  if (!/^[\w-]+$/.test(id)) return null;
  const rows = await getStats({ game: id });
  if (!rows.length) return null;

  const [seasons, teams, players] = await Promise.all([getSeasons(), getTeams(), getPlayers()]);
  const season = seasons.find((s) => same(s.id, rows[0].season));
  const byTeam = groupBy(rows, (r) => String(r.team));

  let when: Game | null = null;
  let awayId: string | undefined;
  if (season && same(season.id, seasons[0]?.id) && byTeam.size === 2) {
    try {
      const sheet = await getSchedule();
      const games = toGames(sheet.head, sheet.body);
      if (games) {
        const teamIds: Record<string, string> = {};
        for (const t of teams.filter((t) => same(t.season, season.id))) {
          for (const name of [t.name, t.other_name]) if (name) teamIds[norm(name)] = String(t.id);
        }
        const played = playedGames(await getStats({ season: season.id }));
        for (const [i, m] of matchSchedule(games, teamIds, played)) {
          if (m.played.id === id) { when = games[i]; awayId = m.awayId; }
        }
      }
    } catch {
      // No schedule: the box score still works, it just has no date.
    }
  }

  // Away (dark jerseys) first when the schedule knows it.
  const ids = [...byTeam.keys()].sort((a, b) => (a === awayId ? -1 : b === awayId ? 1 : Number(a) - Number(b)));
  const teamById = new Map(teams.map((t) => [String(t.id), t]));
  const sides = ids.map((tid) => {
    const list = byTeam.get(tid)!;
    return { team: teamById.get(tid), rows: [...list].sort((a, b) => n(b.points) - n(a.points)), total: agg(list), fouls: list.reduce((t, r) => t + n(r.fouls), 0) };
  });
  return { rows, season, sides, when, hasJerseys: !!awayId, playerById: new Map(players.map((p) => [String(p.id), p])) };
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const g = await load((await params).id);
  if (!g) return {};
  const names = g.sides.map((s) => s.team?.name ?? "Team");
  const line = g.sides.map((s, i) => `${names[i]} ${s.total.pts}`).join(", ");
  return {
    title: names.join(" vs. "),
    description: `Box score: ${line}${g.season ? ` (${g.season.season_name})` : ""}, Crossroads Basketball League.`,
  };
}

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const g = await load((await params).id);
  if (!g) notFound();
  const { sides, season, when, hasJerseys, playerById, rows } = g;

  const two = sides.length === 2;
  const winner = two && sides[0].total.pts !== sides[1].total.pts ? (sides[0].total.pts > sides[1].total.pts ? 0 : 1) : -1;
  const best = rows.reduce((b, r) => (n(r.points) > n(b.points) ? r : b), rows[0]);
  const bestPlayer = playerById.get(String(best.player));

  return (
    <>
      {season && <Crumb href={`/teams/${season.id}`}>{season.season_name} teams</Crumb>}
      <Title>{sides.map((s) => s.team?.name ?? "Team").join(" vs. ")}</Title>
      <Meta>
        {[season?.season_name, when ? `${dayLabel(when)}${when.time ? `, ${when.time}` : ""}` : null].filter(Boolean).join(", ") || "Box score"}.
        {winner >= 0 ? ` ${sides[winner].team?.name ?? "Winner"} won.` : two ? " Final score tied." : ""}
      </Meta>

      <div className="mb-8 grid max-w-2xl gap-3">
        {sides.map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-4 border-b border-slate-300 pb-2">
            <span className="flex items-center gap-2.5 text-2xl font-semibold">
              {hasJerseys && <Dot dark={i === 0} />}
              <TeamLink team={s.team} />
            </span>
            <span className={`font-display text-6xl font-bold leading-none tabular-nums ${winner === i || winner < 0 ? "text-red-700" : "text-slate-500"}`}>
              {s.total.pts}
            </span>
          </div>
        ))}
      </div>

      {bestPlayer && n(best.points) > 0 && (
        <p className="mb-2 text-lg">
          <span className="text-slate-600">Top scorer: </span>
          <span className="font-semibold"><PlayerLink player={bestPlayer} season={season?.id} /></span>
          <span> with {n(best.points)} points, {n(best.rebounds)} rebounds and {n(best.assists)} assists.</span>
        </p>
      )}

      {sides.map((s, i) => (
        <section key={i}>
          <H2>{s.team?.name ?? "Team"}</H2>
          <div className="scroll">
            <table className="tbl sticky-first">
              <thead>
                <tr>
                  <th>Player</th><th>PTS</th><th>REB</th><th>AST</th><th>STL</th><th>BLK</th><th>PF</th><th>FG</th><th>3P</th><th>FT</th>
                </tr>
              </thead>
              <tbody>
                {s.rows.map((r) => {
                  const a = agg([r]);
                  return (
                    <tr key={String(r.id)}>
                      <td><PlayerLink player={playerById.get(String(r.player))} season={season?.id} /></td>
                      <td className="font-bold text-red-700">{n(r.points)}</td>
                      <td>{n(r.rebounds)}</td><td>{n(r.assists)}</td><td>{n(r.steals)}</td><td>{n(r.blocks)}</td><td>{n(r.fouls)}</td>
                      <td>{made(a.fgm, a.fga)}</td><td>{made(a.tpm, a.tpa)}</td><td>{made(a.ftm, a.fta)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-blue-900 bg-slate-50 font-semibold">
                  <td>Team</td>
                  <td className="text-red-700">{s.total.pts}</td>
                  <td>{s.total.reb}</td><td>{s.total.ast}</td><td>{s.total.stl}</td><td>{s.total.blk}</td><td>{s.fouls}</td>
                  <td>{made(s.total.fgm, s.total.fga)}</td><td>{made(s.total.tpm, s.total.tpa)}</td><td>{made(s.total.ftm, s.total.fta)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
