import type { Metadata } from "next";
import Link from "next/link";
import { getPlayers, getSeasons, getStats, getTeams } from "@/lib/directus";
import { displayName, same } from "@/lib/format";
import { tensCount } from "@/lib/badges";
import { agg, groupBy, type Agg } from "@/lib/stats";
import type { GameStat } from "@/lib/types";
import { Empty, H2, Meta, PlayerLink, TeamLink, Title } from "@/components/ui";

export const metadata: Metadata = {
  title: "All-time records",
  description: "All-time career leaders and single-game bests in points, rebounds, assists, steals, blocks and shooting for the Crossroads Basketball League.",
};

const num = (v: number | null) => Number(v) || 0;

type Cat = {
  key: string;
  label: string;
  kind: "count" | "pct" | "gp" | "multi";
  tens?: number; // for "multi": how many stats must reach 10 in a game
  total?: keyof Agg; // career total for count stats
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
  { key: "gp", label: "Games played", kind: "gp" },
];

const MIN_OPTIONS = [10, 25, 50];
const DEFAULT_MIN = 25; // minimum attempts for a percentage record

const href = (p: { cat: string; min: number }) => `/records?cat=${p.cat}${p.min !== DEFAULT_MIN ? `&min=${p.min}` : ""}`;

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

export default async function RecordsPage({ searchParams }: { searchParams: Promise<{ cat?: string; min?: string }> }) {
  const sp = await searchParams;
  const minParam = Number(sp.min);
  const min = MIN_OPTIONS.includes(minParam) ? minParam : DEFAULT_MIN;
  const cat = CATS.find((c) => c.key === sp.cat) ?? CATS[0];

  const [seasons, players, teams, stats] = await Promise.all([getSeasons(), getPlayers(), getTeams(), getStats({})]);
  const playerById = new Map(players.map((p) => [String(p.id), p]));
  const teamById = new Map(teams.map((t) => [String(t.id), t]));
  const seasonName = (id: unknown) => seasons.find((s) => same(s.id, id as string))?.season_name ?? "";

  const rowsHeader = (
    <>
      <Title>All-time records</Title>
      <Meta>
        Career totals and single-game bests across {seasons.length} {seasons.length === 1 ? "season" : "seasons"}.
      </Meta>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Stat">
        {CATS.map((c) => (
          <Chip key={c.key} to={href({ cat: c.key, min })} on={c.key === cat.key}>{c.label}</Chip>
        ))}
      </div>
    </>
  );

  /* ---------------- Player records ---------------- */
  const byPlayer = [...groupBy(stats, (r) => String(r.player))].map(([pid, rows]) => ({
    player: playerById.get(pid),
    a: agg(rows),
    seasons: new Set(rows.map((r) => String(r.season))).size,
    rows,
  }));
  const named = (x: { player?: unknown }) => !!x.player;
  const byName = (a: { player?: Parameters<typeof displayName>[0] }, b: { player?: Parameters<typeof displayName>[0] }) => displayName(a.player).localeCompare(displayName(b.player));

  let careerTable: React.ReactNode = null;
  if (cat.kind === "count") {
    const rows = byPlayer.filter(named).map((x) => ({ ...x, v: x.a[cat.total!] })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v || byName(a, b)).slice(0, 10);
    careerTable = rows.length ? (
      <Table>
        <thead><tr><th className="w-12">#</th><th className="l">Player</th><th>Seasons</th><th>GP</th><th>{cat.label}</th><th>Per game</th></tr></thead>
        <tbody>
          {rows.map((x, i) => (
            <tr key={String(x.player!.id)}>
              <Rank i={i} /><td className="l"><PlayerLink player={x.player} /></td><td>{x.seasons}</td><td>{x.a.gp}</td>
              <td className="font-bold text-red-700">{x.v}</td><td>{(x.v / (x.a.gp || 1)).toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    ) : null;
  } else if (cat.kind === "pct") {
    const all = byPlayer.filter(named).map((x) => ({ ...x, made: x.a[cat.made!], att: x.a[cat.att!] }));
    const rows = all.filter((x) => x.att >= min).sort((a, b) => b.made / b.att - a.made / a.att || b.att - a.att).slice(0, 10);
    careerTable = rows.length ? (
      <>
        <Table>
          <thead><tr><th className="w-12">#</th><th className="l">Player</th><th>Seasons</th><th>GP</th><th>Made</th><th>Attempts</th><th>{cat.label}</th></tr></thead>
          <tbody>
            {rows.map((x, i) => (
              <tr key={String(x.player!.id)}>
                <Rank i={i} /><td className="l"><PlayerLink player={x.player} /></td><td>{x.seasons}</td><td>{x.a.gp}</td><td>{x.made}</td><td>{x.att}</td>
                <td className="font-bold text-red-700">{((x.made / x.att) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p className="mt-3 text-slate-600">{all.filter((x) => x.att >= min).length} players have at least {min} attempts.</p>
      </>
    ) : (
      <Empty title={`No player has ${min} attempts yet`}>Try a lower minimum below.</Empty>
    );
  } else if (cat.kind === "multi") {
    const rows = byPlayer
      .filter(named)
      .map((x) => ({ ...x, v: x.rows.filter((r) => tensCount(r) >= cat.tens!).length }))
      .filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v || byName(a, b))
      .slice(0, 10);
    careerTable = rows.length ? (
      <>
        <Table>
          <thead><tr><th className="w-12">#</th><th className="l">Player</th><th>Seasons</th><th>GP</th><th>{cat.label}</th><th>% of games</th></tr></thead>
          <tbody>
            {rows.map((x, i) => (
              <tr key={String(x.player!.id)}>
                <Rank i={i} /><td className="l"><PlayerLink player={x.player} /></td><td>{x.seasons}</td><td>{x.a.gp}</td>
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
      <Empty title={`No ${cat.label.toLowerCase()} recorded yet`}>The first one will show up here.</Empty>
    );
  } else {
    const rows = byPlayer.filter(named).sort((a, b) => b.a.gp - a.a.gp || byName(a, b)).slice(0, 10);
    careerTable = rows.length ? (
      <Table>
        <thead><tr><th className="w-12">#</th><th className="l">Player</th><th>Seasons</th><th>Games played</th></tr></thead>
        <tbody>
          {rows.map((x, i) => (
            <tr key={String(x.player!.id)}><Rank i={i} /><td className="l"><PlayerLink player={x.player} /></td><td>{x.seasons}</td><td className="font-bold text-red-700">{x.a.gp}</td></tr>
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
      {rowsHeader}
      {cat.kind === "pct" && (
        <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Minimum attempts">
          <span className="mr-1 font-semibold">Minimum attempts</span>
          {MIN_OPTIONS.map((m) => (
            <Chip key={m} to={href({ cat: cat.key, min: m })} on={m === min}>{m}</Chip>
          ))}
        </div>
      )}

      <H2>Career {cat.label.toLowerCase()}</H2>
      {careerTable ?? <Empty title="No stats recorded yet" />}

      {single.length > 0 && (
        <>
          <H2>Single-game {singleLabel}</H2>
          <Table>
            <thead><tr><th className="w-12">#</th><th className="l">Player</th><th className="l">Team</th><th className="l">Season</th><th>{cat.kind === "pct" ? "Made" : cat.label}</th></tr></thead>
            <tbody>
              {single.map(({ r, v }, i) => (
                <tr key={String(r.id)}>
                  <Rank i={i} /><td className="l"><PlayerLink player={playerById.get(String(r.player))} /></td>
                  <td className="l"><TeamLink team={teamById.get(String(r.team))} /></td><td className="l">{seasonName(r.season)}</td>
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
