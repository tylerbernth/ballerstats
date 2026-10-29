import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayers, getSeasons, getStats, getTeams } from "@/lib/directus";
import { displayName, same } from "@/lib/format";
import { tensCount } from "@/lib/badges";
import { agg, groupBy, type Agg } from "@/lib/stats";
import type { GameStat } from "@/lib/types";
import { Empty, H2, Meta, PlayerLink, TeamLink, Title } from "@/components/ui";

const num = (v: number | null) => Number(v) || 0;

type Cat = {
  key: string;
  label: string;
  kind: "count" | "pct" | "gp" | "multi";
  tens?: number; // for "multi": how many stats must reach 10 in a game
  total?: keyof Agg; // season total for count stats
  made?: keyof Agg; // made and attempted for percentage stats
  att?: keyof Agg;
  game?: (r: GameStat) => number; // value in one stat row (one player, one game)
  gameLabel?: string;
};

const CATS: Cat[] = [
  { key: "pts", label: "PTS", kind: "count", total: "pts", game: (r) => num(r.points) },
  { key: "reb", label: "REB", kind: "count", total: "reb", game: (r) => num(r.rebounds) },
  { key: "ast", label: "AST", kind: "count", total: "ast", game: (r) => num(r.assists) },
  { key: "stl", label: "STL", kind: "count", total: "stl", game: (r) => num(r.steals) },
  { key: "blk", label: "BLK", kind: "count", total: "blk", game: (r) => num(r.blocks) },
  { key: "tpm", label: "3PM", kind: "count", total: "tpm", game: (r) => num(r.three_points_made) },
  { key: "fg", label: "FG%", kind: "pct", made: "fgm", att: "fga", game: (r) => num(r.two_points_made) + num(r.three_points_made), gameLabel: "field goals made" },
  { key: "tp", label: "3P%", kind: "pct", made: "tpm", att: "tpa", game: (r) => num(r.three_points_made), gameLabel: "3-pointers made" },
  { key: "ft", label: "FT%", kind: "pct", made: "ftm", att: "fta", game: (r) => num(r.ft_made), gameLabel: "free throws made" },
  { key: "dd", label: "Double-doubles", kind: "multi", tens: 2 },
  { key: "td", label: "Triple-doubles", kind: "multi", tens: 3 },
];

// A season is far shorter than a career, so the attempt minimums are lower than on /records.
const MIN_OPTIONS = [5, 10, 25];
const DEFAULT_MIN = 10;

const href = (p: { season: unknown; cat: string; min: number }) =>
  `/stats/${p.season}?cat=${p.cat}${p.min !== DEFAULT_MIN ? `&min=${p.min}` : ""}`;

export async function generateMetadata({ params }: { params: Promise<{ season: string }> }): Promise<Metadata> {
  const { season } = await params;
  const s = (await getSeasons()).find((x) => same(x.id, season));
  if (!s) return {};
  return {
    title: `${s.season_name} stat leaders`,
    description: `Season leaders and single-game bests in points, rebounds, assists, steals, blocks and shooting for ${s.season_name} of the Crossroads Basketball League.`,
  };
}

function Chip({ to, on, children }: { to: string; on: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={to}
      aria-current={on ? "true" : undefined}
      className="min-h-10 rounded border border-slate-300 bg-white px-4 py-2 font-semibold hover:bg-blue-100 aria-[current=true]:border-blue-900 aria-[current=true]:bg-blue-900 aria-[current=true]:text-white"
    >
      {children}
    </Link>
  );
}

const Rank = ({ i }: { i: number }) => <td className="text-slate-600">{i + 1}</td>;
const Table = ({ children }: { children: React.ReactNode }) => (
  <div className="scroll">
    <table className="tbl">{children}</table>
  </div>
);

export default async function StatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ season: string }>;
  searchParams: Promise<{ cat?: string; min?: string }>;
}) {
  const { season } = await params;
  const sp = await searchParams;
  const s = (await getSeasons()).find((x) => same(x.id, season));
  if (!s) notFound();

  const minParam = Number(sp.min);
  const min = MIN_OPTIONS.includes(minParam) ? minParam : DEFAULT_MIN;
  const cat = CATS.find((c) => c.key === sp.cat) ?? CATS[0];

  const [players, teams, stats] = await Promise.all([getPlayers(), getTeams(s.id), getStats({ season: s.id })]);
  const playerById = new Map(players.map((p) => [String(p.id), p]));
  const teamById = new Map(teams.map((t) => [String(t.id), t]));

  const byPlayer = [...groupBy(stats, (r) => String(r.player))]
    .map(([pid, rows]) => ({
      player: playerById.get(pid),
      team: teamById.get(String(rows[0].team)),
      a: agg(rows),
      rows,
    }))
    .filter((x) => x.player && x.a.gp);
  const byName = (a: { player?: Parameters<typeof displayName>[0] }, b: { player?: Parameters<typeof displayName>[0] }) =>
    displayName(a.player).localeCompare(displayName(b.player));

  const PlayerCells = ({ x }: { x: (typeof byPlayer)[number] }) => (
    <>
      <td className="l"><PlayerLink player={x.player} season={s.id} /></td>
      <td className="l"><TeamLink team={x.team} /></td>
    </>
  );

  let leaders: React.ReactNode = null;
  if (cat.kind === "count") {
    const rows = byPlayer
      .map((x) => ({ ...x, total: x.a[cat.total!], v: x.a[cat.total!] / (x.a.gp || 1) }))
      .filter((x) => x.total > 0)
      .sort((a, b) => b.v - a.v || b.total - a.total || byName(a, b))
      .slice(0, 10);
    const max = rows[0]?.v || 1;
    leaders = rows.length ? (
      <Table>
        <thead><tr><th className="w-12">#</th><th className="l">Player</th><th className="l">Team</th><th>GP</th><th>{cat.label}</th><th>Per game</th><th aria-hidden="true" /></tr></thead>
        <tbody>
          {rows.map((x, i) => (
            <tr key={String(x.player!.id)}>
              <Rank i={i} /><PlayerCells x={x} /><td>{x.a.gp}</td><td>{x.total}</td>
              <td className="font-bold text-red-700">{x.v.toFixed(1)}</td>
              <td className="w-40">
                <span className="block h-2 rounded-sm bg-blue-100">
                  <span className="block h-full rounded-sm bg-red-600" style={{ width: `${(x.v / max) * 100}%` }} />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    ) : null;
  } else if (cat.kind === "pct") {
    const all = byPlayer.map((x) => ({ ...x, made: x.a[cat.made!], att: x.a[cat.att!] }));
    const qualified = all.filter((x) => x.att >= min);
    const rows = [...qualified].sort((a, b) => b.made / b.att - a.made / a.att || b.att - a.att || byName(a, b)).slice(0, 10);
    leaders = rows.length ? (
      <>
        <Table>
          <thead><tr><th className="w-12">#</th><th className="l">Player</th><th className="l">Team</th><th>GP</th><th>Made</th><th>Attempts</th><th>{cat.label}</th></tr></thead>
          <tbody>
            {rows.map((x, i) => (
              <tr key={String(x.player!.id)}>
                <Rank i={i} /><PlayerCells x={x} /><td>{x.a.gp}</td><td>{x.made}</td><td>{x.att}</td>
                <td className="font-bold text-red-700">{((x.made / x.att) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p className="mt-3 text-slate-600">{qualified.length} players have at least {min} attempts.</p>
      </>
    ) : (
      <Empty title={`No player has ${min} attempts yet`}>Try a lower minimum above.</Empty>
    );
  } else if (cat.kind === "multi") {
    const rows = byPlayer
      .map((x) => ({ ...x, v: x.rows.filter((r) => tensCount(r) >= cat.tens!).length }))
      .filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v || byName(a, b))
      .slice(0, 10);
    leaders = rows.length ? (
      <>
        <Table>
          <thead><tr><th className="w-12">#</th><th className="l">Player</th><th className="l">Team</th><th>GP</th><th>{cat.label}</th><th>% of games</th></tr></thead>
          <tbody>
            {rows.map((x, i) => (
              <tr key={String(x.player!.id)}>
                <Rank i={i} /><PlayerCells x={x} /><td>{x.a.gp}</td>
                <td className="font-bold text-red-700">{x.v}</td><td>{((x.v / (x.a.gp || 1)) * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p className="mt-3 text-slate-600">
          {cat.tens === 3
            ? "Ten or more in three of points, rebounds, assists, steals and blocks."
            : "Ten or more in two of points, rebounds, assists, steals and blocks. Triple-doubles count too."}
        </p>
      </>
    ) : (
      <Empty title={`No ${cat.label.toLowerCase()} recorded this season`} />
    );
  } else {
    const rows = [...byPlayer].sort((a, b) => b.a.gp - a.a.gp || byName(a, b)).slice(0, 10);
    leaders = rows.length ? (
      <Table>
        <thead><tr><th className="w-12">#</th><th className="l">Player</th><th className="l">Team</th><th>Games played</th></tr></thead>
        <tbody>
          {rows.map((x, i) => (
            <tr key={String(x.player!.id)}>
              <Rank i={i} /><PlayerCells x={x} /><td className="font-bold text-red-700">{x.a.gp}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    ) : null;
  }

  const single = cat.game
    ? stats.map((r) => ({ r, v: cat.game!(r) })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 10)
    : [];
  const singleLabel = cat.kind === "pct" ? cat.gameLabel : cat.label.toLowerCase();

  return (
    <>
      <Title>Stat leaders</Title>
      <Meta>Season leaders and single-game bests for {s.season_name}. Top ten players.</Meta>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Stat">
        {CATS.map((c) => (
          <Chip key={c.key} to={href({ season: s.id, cat: c.key, min })} on={c.key === cat.key}>{c.label}</Chip>
        ))}
      </div>

      {cat.kind === "pct" && (
        <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Minimum attempts">
          <span className="mr-1 font-semibold">Minimum attempts</span>
          {MIN_OPTIONS.map((m) => (
            <Chip key={m} to={href({ season: s.id, cat: cat.key, min: m })} on={m === min}>{m}</Chip>
          ))}
        </div>
      )}

      <H2>{cat.label} leaders</H2>
      {leaders ?? <Empty title="No games recorded this season" />}

      {single.length > 0 && (
        <>
          <H2>Single-game {singleLabel}</H2>
          <Table>
            <thead><tr><th className="w-12">#</th><th className="l">Player</th><th className="l">Team</th><th>{cat.kind === "pct" ? "Made" : cat.label}</th></tr></thead>
            <tbody>
              {single.map(({ r, v }, i) => (
                <tr key={String(r.id)}>
                  <Rank i={i} />
                  <td className="l"><PlayerLink player={playerById.get(String(r.player))} season={s.id} /></td>
                  <td className="l"><TeamLink team={teamById.get(String(r.team))} /></td>
                  <td className="font-bold text-red-700">{v}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </>
  );
}