import { getPlayers, getStats, getTeams } from "./directus";
import { displayName } from "./format";
import { playedGames } from "./games";
import { agg, groupBy } from "./stats";
import type { Player, Season, Team } from "./types";

export type Standing = { team: Team; w: number; l: number; pf: number; pa: number };
export type Leader = { player: Player; team?: Team; v: number; gp: number };
export type LeaderCat = { key: string; label: string; rows: Leader[] };
export type Snapshot = { season: Season; standings: Standing[]; leaders: LeaderCat[]; minGp: number };

const CATS = [
  { key: "pts", label: "Points" },
  { key: "reb", label: "Rebounds" },
  { key: "ast", label: "Assists" },
  { key: "stl", label: "Steals" },
  { key: "blk", label: "Blocks" },
] as const;

// Standings rely on the season's team record fields, which are the official league standings.
// Leaders need at least half of the most games anyone has played, so one big game cannot top a list.
export async function getSnapshot(season: Season): Promise<Snapshot | null> {
  try {
    const [teams, players, stats] = await Promise.all([getTeams(season.id), getPlayers(), getStats({ season: season.id })]);
    if (!stats.length) return null;
    const teamById = new Map(teams.map((t) => [String(t.id), t]));
    const playerById = new Map(players.map((p) => [String(p.id), p]));

    const standings = teams
      .map((t) => ({
        team: t,
        w: Number(t.wins ?? 0),
        l: Number(t.losses ?? 0),
        pf: 0,
        pa: 0,
      }))
      .sort((x, y) => (y.w / (y.w + y.l || 1)) - (x.w / (x.w + x.l || 1)) || x.team.name.localeCompare(y.team.name));

    const byPlayer = [...groupBy(stats, (r) => String(r.player))]
      .map(([pid, rows]) => ({ player: playerById.get(pid), team: teamById.get(String(rows[0].team)), a: agg(rows) }))
      .filter((x) => x.player && x.a.gp);
    const minGp = Math.max(1, Math.floor(Math.max(0, ...byPlayer.map((x) => x.a.gp)) / 2));
    const eligible = byPlayer.filter((x) => x.a.gp >= minGp);

    const leaders: LeaderCat[] = CATS.map((c) => ({
      key: c.key,
      label: c.label,
      rows: eligible
        .map((x) => ({ player: x.player!, team: x.team, gp: x.a.gp, v: x.a[c.key] / x.a.gp }))
        .filter((x) => x.v > 0)
        .sort((p, q) => q.v - p.v || displayName(p.player).localeCompare(displayName(q.player)))
        .slice(0, 3),
    })).filter((c) => c.rows.length);

    return { season, standings, leaders, minGp };
  } catch {
    return null; // the home page simply leaves this section out
  }
}
