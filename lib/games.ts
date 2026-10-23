import type { GameStat } from "./types";
import { groupBy } from "./stats";
import { norm, type Game } from "./schedule";

// One finished game, rebuilt from the stat rows that share a `game` value.
export type Played = {
  id: string;
  num: number;
  season: string;
  teams: string[]; // team ids
  pts: Map<string, number>; // team id -> points
  rows: GameStat[];
};

// A game counts as finished when its rows belong to exactly two teams. Oldest first.
export function playedGames(stats: GameStat[]): Played[] {
  const out: Played[] = [];
  for (const [gid, rows] of groupBy(stats.filter((r) => r.game != null), (r) => String(r.game))) {
    const pts = new Map<string, number>();
    for (const r of rows) pts.set(String(r.team), (pts.get(String(r.team)) ?? 0) + (Number(r.points) || 0));
    if (pts.size !== 2) continue;
    out.push({ id: gid, num: Number(gid) || 0, season: String(rows[0].season), teams: [...pts.keys()], pts, rows });
  }
  return out.sort((a, b) => a.num - b.num);
}

export type Match = { played: Played; awayId: string; homeId: string };

const pairKey = (a: string, b: string) => [a, b].sort().join("|");

// Matches scheduled games (by position in the schedule) to finished games.
// If two teams meet more than once, the nth scheduled meeting is the nth finished game between them.
// Pass only one season's stats and that season's schedule.
export function matchSchedule(games: Game[], teamIds: Record<string, string>, played: Played[]): Map<number, Match> {
  const byPair = new Map<string, Played[]>();
  for (const p of played) {
    const k = pairKey(p.teams[0], p.teams[1]);
    byPair.set(k, [...(byPair.get(k) ?? []), p]);
  }
  const seen = new Map<string, number>();
  const out = new Map<number, Match>();
  games.forEach((g, i) => {
    const a = teamIds[norm(g.away)];
    const b = teamIds[norm(g.home)];
    if (!a || !b || a === b) return;
    const k = pairKey(a, b);
    const nth = seen.get(k) ?? 0;
    seen.set(k, nth + 1);
    const p = byPair.get(k)?.[nth];
    if (p) out.set(i, { played: p, awayId: a, homeId: b });
  });
  return out;
}
