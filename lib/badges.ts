import type { GameStat, ID } from "./types";
import { agg, groupBy } from "./stats";

const n = (v: number | null) => Number(v) || 0;
const times = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

// How many of points, rebounds, assists, steals and blocks reached 10 in one game (2 = double-double, 3 = triple-double).
export const tensCount = (r: GameStat) => [r.points, r.rebounds, r.assists, r.steals, r.blocks].filter((v) => n(v) >= 10).length;

// Milestones from a player's own game rows.
export function gameBadges(rows: GameStat[]): string[] {
  let doubleDoubles = 0, tripleDoubles = 0, twenty = 0, thirty = 0, fiveThrees = 0;
  for (const r of rows) {
    const tens = tensCount(r);
    if (tens >= 2) doubleDoubles++;
    if (tens >= 3) tripleDoubles++;
    if (n(r.points) >= 20) twenty++;
    if (n(r.points) >= 30) thirty++;
    if (n(r.three_points_made) >= 5) fiveThrees++;
  }
  const out: string[] = [];
  if (thirty) out.push(times(thirty, "game of 30+ points", "games of 30+ points"));
  if (twenty) out.push(times(twenty, "game of 20+ points", "games of 20+ points"));
  if (doubleDoubles) out.push(times(doubleDoubles, "double-double", "double-doubles"));
  if (tripleDoubles) out.push(times(tripleDoubles, "triple-double", "triple-doubles"));
  if (fiveThrees) out.push(times(fiveThrees, "game with 5+ threes", "games with 5+ threes"));
  return out;
}

const LEADERS = [
  ["pts", "scoring"],
  ["reb", "rebounding"],
  ["ast", "assists"],
  ["stl", "steals"],
  ["blk", "blocks"],
] as const;

// Season per-game leaders (at least 3 games played). Ties share the badge.
export function leaderBadges(playerId: ID, seasons: { name: string; rows: GameStat[] }[]): string[] {
  const out: string[] = [];
  for (const { name, rows } of seasons) {
    const players = [...groupBy(rows, (r) => String(r.player))].map(([id, g]) => ({ id, a: agg(g) })).filter((p) => p.a.gp >= 3);
    for (const [key, label] of LEADERS) {
      const best = Math.max(...players.map((p) => p.a[key] / p.a.gp), 0);
      const me = players.find((p) => p.id === String(playerId));
      if (best > 0 && me && me.a[key] / me.a.gp >= best) out.push(`${name} ${label} leader`);
    }
  }
  return out;
}
