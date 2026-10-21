import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayers, getSeasons, getStats, getTeams } from "@/lib/directus";
import { displayName, same } from "@/lib/format";
import { agg, groupBy, type Agg } from "@/lib/stats";
import { Empty, Meta, PlayerLink, TeamLink, Title } from "@/components/ui";

const CATS = [
  { key: "pts", label: "Points" },
  { key: "reb", label: "Rebounds" },
  { key: "ast", label: "Assists" },
  { key: "stl", label: "Steals" },
  { key: "blk", label: "Blocks" },
] as const;

export default async function StatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ season: string }>;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { season } = await params;
  const { cat: catParam } = await searchParams;
  const s = (await getSeasons()).find((x) => same(x.id, season));
  if (!s) notFound();
  const cat = CATS.find((c) => c.key === catParam) ?? CATS[0];

  const [players, teams, stats] = await Promise.all([getPlayers(), getTeams(s.id), getStats({ season: s.id })]);
  const playerById = new Map(players.map((p) => [String(p.id), p]));
  const teamById = new Map(teams.map((t) => [String(t.id), t]));

  const rows = [...groupBy(stats, (r) => String(r.player))]
    .map(([pid, games]) => {
      const a = agg(games);
      return { player: playerById.get(pid), team: teamById.get(String(games[0].team)), gp: a.gp, v: a[cat.key as keyof Agg] / (a.gp || 1) };
    })
    .filter((r) => r.player && r.gp)
    .sort((a, b) => b.v - a.v || displayName(a.player).localeCompare(displayName(b.player)))
    .slice(0, 10);
  const max = rows[0]?.v || 1;

  return (
    <>
      <Title>Stat leaders</Title>
      <Meta>Per-game averages for {s.season_name}. Top ten players.</Meta>

      <div className="mb-6 flex flex-wrap" role="group" aria-label="Stat">
        {CATS.map((c, i) => (
          <Link
            key={c.key}
            href={`/stats/${s.id}?cat=${c.key}`}
            aria-current={c.key === cat.key ? "true" : undefined}
            className={`min-h-10 border border-slate-300 bg-white px-4 py-2 font-semibold hover:bg-blue-100 aria-[current=true]:border-blue-900 aria-[current=true]:bg-blue-900 aria-[current=true]:text-white ${
              i === 0 ? "rounded-l" : ""
            } ${i === CATS.length - 1 ? "rounded-r" : ""}`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {rows.length ? (
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th className="l">Player</th>
                <th className="l">Team</th>
                <th>GP</th>
                <th>{cat.label}</th>
                <th aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={String(r.player!.id)}>
                  <td className="text-slate-600">{i + 1}</td>
                  <td className="l">
                    <PlayerLink player={r.player} season={s.id} />
                  </td>
                  <td className="l">
                    <TeamLink team={r.team} />
                  </td>
                  <td>{r.gp}</td>
                  <td className="font-bold text-red-700">{r.v.toFixed(1)}</td>
                  <td className="w-40">
                    <span className="block h-2 rounded-sm bg-blue-100">
                      <span className="block h-full rounded-sm bg-red-600" style={{ width: `${(r.v / max) * 100}%` }} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="No games recorded this season" />
      )}
    </>
  );
}
