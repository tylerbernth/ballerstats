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
  const career = agg(stats);

  return (
    <>
      <Crumb href={`/players/${current?.id ?? seasons[0]?.id ?? ""}`}>{current ? `${current.season_name} players` : "All players"}</Crumb>
      <div className="mb-8 flex items-center gap-4 sm:mb-10 sm:gap-8">
        <span className="w-28 shrink-0 sm:w-44">
          <Face player={player} size={176} fluid />
        </span>
        <div>
          <h1 className="break-words font-display text-4xl font-bold uppercase leading-none tracking-tight text-blue-900 sm:text-6xl">{name}</h1>
          <p className="mt-2 text-slate-600">
            {played.length} {played.length === 1 ? "season" : "seasons"} and {career.gp} {career.gp === 1 ? "game" : "games"} on record.
          </p>
        </div>
      </div>

      {career.gp > 0 && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4 sm:gap-x-8 sm:gap-y-8">
          {(
            [
              ["Career PPG", per(career.pts, career.gp)],
              ["Career assists", career.ast],
              ["Career steals", career.stl],
              ["Career rebounds", career.reb],
            ] as [string, string | number][]
          ).map(([label, value]) => (
            <div key={label} className="flex flex-col-reverse">
              <dt className="mt-2 text-slate-600">{label}</dt>
              <dd className="font-display text-5xl font-bold leading-none tabular-nums text-red-700 sm:text-6xl">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <H2>Historical season stats</H2>
      {played.length ? (
        <>
          <div className="scroll">
            <table className="tbl sticky-first">
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
              {played.length > 1 && (
                <tfoot>
                  <tr className="border-t-2 border-blue-900 bg-slate-50 font-semibold">
                    <td>Career</td>
                    <td className="l" />
                    <td>{career.gp}</td>
                    <td className="text-red-700">{per(career.pts, career.gp)}</td>
                    <td>{per(career.reb, career.gp)}</td>
                    <td>{per(career.ast, career.gp)}</td>
                    <td>{per(career.stl, career.gp)}</td>
                    <td>{per(career.blk, career.gp)}</td>
                    <td>{pct(career.fgm, career.fga)}</td>
                    <td>{pct(career.tpm, career.tpa)}</td>
                    <td>{pct(career.ftm, career.fta)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <H2>Game log, {current?.season_name}</H2>
          <div className="scroll">
            <table className="tbl sticky-first">
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
