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

// ---------- Streaks ----------
// Rows come back sorted by game, but sort again so streaks never depend on the fetch order.
const order = (r: GameStat) => Number(r.game ?? r.id) || 0;
const chrono = (rows: GameStat[]) => [...rows].sort((a, b) => order(a) - order(b) || (Number(a.id) || 0) - (Number(b.id) || 0));

function runs(rows: GameStat[], hit: (r: GameStat) => boolean) {
  let best = 0, cur = 0;
  for (const r of rows) {
    cur = hit(r) ? cur + 1 : 0;
    if (cur > best) best = cur;
  }
  return { best, cur };
}

const STREAKS: { label: string; min: number; tiers: number[]; val: (r: GameStat) => number }[] = [
  { label: "points", min: 3, tiers: [25, 20, 15, 10], val: (r) => n(r.points) },
  { label: "rebounds", min: 3, tiers: [15, 10, 7, 5], val: (r) => n(r.rebounds) },
  { label: "assists", min: 3, tiers: [10, 7, 5, 3], val: (r) => n(r.assists) },
  { label: "threes", min: 3, tiers: [3, 2, 1], val: (r) => n(r.three_points_made) },
];

// "Hot streak" is a streak still running at the player's latest game, and only counts if that game was in the
// newest season. "Best" is the longest streak ever at the highest level reached.
export function streakBadges(rows: GameStat[], latestSeason?: ID | null): string[] {
  const sorted = chrono(rows);
  const live = sorted.length > 0 && latestSeason != null && String(sorted[sorted.length - 1].season) === String(latestSeason);
  const hot: string[] = [];
  const best: string[] = [];
  for (const s of STREAKS) {
    const tiers = s.tiers.map((t) => ({ t, ...runs(sorted, (r) => s.val(r) >= t) }));
    const longest = tiers.find((x) => x.best >= s.min);
    const current = live ? tiers.find((x) => x.cur >= s.min) : undefined;
    if (current) hot.push(`Hot streak: ${current.cur} straight games of ${current.t}+ ${s.label}`);
    if (longest && !(current && current.t === longest.t && current.cur === longest.best)) {
      best.push(`${longest.best} straight games of ${longest.t}+ ${s.label}`);
    }
  }
  return [...hot, ...best];
}

// ---------- Career milestones ----------
const MILESTONES = [
  { key: "pts", label: "career points", tiers: [100, 250, 500, 1000, 1500, 2000, 3000] },
  { key: "reb", label: "career rebounds", tiers: [50, 100, 250, 500, 1000] },
  { key: "ast", label: "career assists", tiers: [25, 50, 100, 250, 500] },
  { key: "stl", label: "career steals", tiers: [25, 50, 100, 250] },
  { key: "blk", label: "career blocks", tiers: [25, 50, 100] },
  { key: "tpm", label: "career 3-pointers", tiers: [25, 50, 100, 250] },
  { key: "gp", label: "career games", tiers: [25, 50, 100, 150, 200] },
] as const;

// Only the highest milestone reached in each category, so a 500-point scorer shows "500+" and not every step before it.
export function milestoneBadges(rows: GameStat[]): string[] {
  const a = agg(rows);
  const out: string[] = [];
  for (const m of MILESTONES) {
    const tier = [...m.tiers].reverse().find((t) => a[m.key] >= t);
    if (tier) out.push(`${tier}+ ${m.label}`);
  }
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
