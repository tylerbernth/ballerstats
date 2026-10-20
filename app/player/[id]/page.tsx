import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayer, getSeasons, getStats, getTeams } from "@/lib/directus";
import { displayName, same } from "@/lib/format";
import { agg, groupBy, pct, per } from "@/lib/stats";
import { Crumb, Empty, Face, H2, Meta, TeamLink } from "@/components/ui";

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const { id } = await params;
  const { season } = await searchParams;
  const player = await getPlayer(id);
  if (!player) notFound();

  const [stats, teams, seasons] = await Promise.all([getStats({ player: player.id }), getTeams(), getSeasons()]);
  const teamById = new Map(teams.map((t) => [String(t.id), t]));
  const bySeason = groupBy(stats, (r) => String(r.season));
  const played = seasons.filter((s) => bySeason.has(String(s.id)));
  const current = played.find((s) => same(s.id, season)) ?? played[0];
  const log = current ? bySeason.get(String(current.id)) ?? [] : [];
  const name = displayName(player);

  return (
    <>
      <Crumb href={`/players/${current?.id ?? seasons[0]?.id ?? ""}`}>{current ? `${current.season_name} players` : "All players"}</Crumb>
      <div className="mb-10 flex items-center gap-6">
        <Face player={player} size={96} />
        <div>
          <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-tight text-blue-900 sm:text-6xl">{name}</h1>
          <p className="mt-2 text-slate-600">
            {played.length} {played.length === 1 ? "season" : "seasons"} on record.
          </p>
        </div>
      </div>

      <H2>By season</H2>
      {played.length ? (
        <>
          <div className="scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Season</th>
                  <th className="l">Team</th>
                  <th>GP</th>
                  <th>PTS</th>
                  <th>REB</th>
                  <th>AST</th>
                  <th>STL</th>
                  <th>BLK</th>
                  <th>FG%</th>
                  <th>3P%</th>
                  <th>FT%</th>
                </tr>
              </thead>
              <tbody>
                {played.map((s) => {
                  const rows = bySeason.get(String(s.id))!;
                  const a = agg(rows);
                  return (
                    <tr key={s.id}>
                      <td>
                        <Link href={`/player/${player.id}?season=${s.id}`} aria-current={same(s.id, current?.id) ? "true" : undefined}>
                          {s.season_name}
                        </Link>
                      </td>
                      <td className="l">
                        <TeamLink team={teamById.get(String(rows[0].team))} />
                      </td>
                      <td>{a.gp}</td>
                      <td className="font-bold text-red-700">{per(a.pts, a.gp)}</td>
                      <td>{per(a.reb, a.gp)}</td>
                      <td>{per(a.ast, a.gp)}</td>
                      <td>{per(a.stl, a.gp)}</td>
                      <td>{per(a.blk, a.gp)}</td>
                      <td>{pct(a.fgm, a.fga)}</td>
                      <td>{pct(a.tpm, a.tpa)}</td>
                      <td>{pct(a.ftm, a.fta)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <H2>Game log, {current?.season_name}</H2>
          <div className="scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Game</th>
                  <th className="l">Team</th>
                  <th>PTS</th>
                  <th>REB</th>
                  <th>AST</th>
                  <th>STL</th>
                  <th>BLK</th>
                  <th>PF</th>
                  <th>FG</th>
                  <th>3P</th>
                  <th>FT</th>
                </tr>
              </thead>
              <tbody>
                {log.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td className="l">
                      <TeamLink team={teamById.get(String(r.team))} />
                    </td>
                    <td className="font-bold text-red-700">{r.points ?? 0}</td>
                    <td>{r.rebounds ?? 0}</td>
                    <td>{r.assists ?? 0}</td>
                    <td>{r.steals ?? 0}</td>
                    <td>{r.blocks ?? 0}</td>
                    <td>{r.fouls ?? 0}</td>
                    <td>
                      {(r.two_points_made ?? 0) + (r.three_points_made ?? 0)}-{(r.two_points_attempted ?? 0) + (r.three_points_attempted ?? 0)}
                    </td>
                    <td>
                      {r.three_points_made ?? 0}-{r.three_points_attempted ?? 0}
                    </td>
                    <td>
                      {r.ft_made ?? 0}-{r.ft_attempted ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Meta>Select a season in the table above to see its game log.</Meta>
        </>
      ) : (
        <Empty title="No games recorded" />
      )}
    </>
  );
}
