import { notFound } from "next/navigation";
import { getPlayers, getSeasons, getTeams } from "@/lib/directus";
import { fmtDate, same } from "@/lib/format";
import { winPct } from "@/lib/stats";
import { Empty, Meta, PlayerLink, TeamLink, Title } from "@/components/ui";

export default async function TeamsPage({ params }: { params: Promise<{ season: string }> }) {
  const { season } = await params;
  const season_ = (await getSeasons()).find((s) => same(s.id, season));
  if (!season_) notFound();

  const [teams, players] = await Promise.all([getTeams(season_.id), getPlayers()]);
  const byId = new Map(players.map((p) => [String(p.id), p]));
  const rows = teams
    .map((t) => ({ t, w: t.wins ?? 0, l: t.losses ?? 0 }))
    .sort((a, b) => b.w / (b.w + b.l || 1) - a.w / (a.w + a.l || 1) || b.w - a.w);

  return (
    <>
      <Title>{season_.season_name}</Title>
      <Meta>
        {season_.start_date ? `${fmtDate(season_.start_date)} to ${fmtDate(season_.end_date)}. ` : ""}
        {rows.length} {rows.length === 1 ? "team" : "teams"}, ranked by win percentage.
      </Meta>
      {rows.length ? (
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Team</th>
                <th>W</th>
                <th>L</th>
                <th>Pct</th>
                <th className="l">Captain</th>
                <th className="l">Co-captain</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ t, w, l }) => (
                <tr key={t.id}>
                  <td>
                    <TeamLink team={t} />
                    {t.other_name && <span className="ml-2 text-slate-600">{t.other_name}</span>}
                  </td>
                  <td className="font-semibold text-green-700">{w}</td>
                  <td className="font-semibold text-red-700">{l}</td>
                  <td>{winPct(w, l)}</td>
                  <td className="l">
                    <PlayerLink player={byId.get(String(t.captain))} season={season_.id} />
                  </td>
                  <td className="l">
                    <PlayerLink player={byId.get(String(t.cocaptain))} season={season_.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="No teams in this season yet">Check back once rosters are set.</Empty>
      )}
    </>
  );
}
