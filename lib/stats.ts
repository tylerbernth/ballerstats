import type { GameStat } from "./types";

export function agg(rows: GameStat[]) {
  const games = new Set(rows.map((r) => r.game ?? `row-${r.id}`));
  const n = (k: keyof GameStat) => rows.reduce((t, r) => t + (Number(r[k]) || 0), 0);
  return {
    gp: games.size,
    pts: n("points"),
    reb: n("rebounds"),
    ast: n("assists"),
    stl: n("steals"),
    blk: n("blocks"),
    fgm: n("two_points_made") + n("three_points_made"),
    fga: n("two_points_attempted") + n("three_points_attempted"),
    tpm: n("three_points_made"),
    tpa: n("three_points_attempted"),
    ftm: n("ft_made"),
    fta: n("ft_attempted"),
  };
}

export type Agg = ReturnType<typeof agg>;

export const per = (total: number, gp: number) => (gp ? (total / gp).toFixed(1) : "-");
export const pct = (made: number, att: number) => (att ? ((made / att) * 100).toFixed(1) + "%" : "-");
export const winPct = (w: number, l: number) => (w + l ? (w / (w + l)).toFixed(3).replace(/^0/, "") : "-");

export function groupBy<T>(rows: T[], key: (r: T) => string) {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const k = key(r);
    m.set(k, [...(m.get(k) ?? []), r]);
  }
  return m;
}
