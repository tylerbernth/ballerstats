import { getPlayers, getSeasons, getStats, getTeams } from "./directus";
import { dayLabel, getSchedule, groupByDate, norm, startsAt, toGames, type Game } from "./schedule";
import { groupBy } from "./stats";
import type { GameStat, Player, Team } from "./types";

const LATE = 90 * 60_000; // a game day counts as over 90 minutes after its last start time

export type WeekResult = { time: string; away: string; home: string; awayId?: string; homeId?: string; awayPts: number; homePts: number };
export type TopPerformer = { player: Player; pts: number; reb: number; ast: number; team?: Team };

// Next game day (with a start time for the countdown) and last game day's results, matched from the schedule sheet and the stat rows.
export async function getThisWeek() {
  try {
    const [data, seasons] = await Promise.all([getSchedule(), getSeasons()]);
    const latest = seasons[0];
    const games = toGames(data.head, data.body);
    if (!latest || !games) return null;

    const now = Date.now();
    const days = groupByDate(games)
      .filter((d) => d.iso)
      .map((day) => {
        const starts = day.games.map(startsAt).filter((t): t is number => t != null);
        return { day, first: starts.length ? Math.min(...starts) : null, last: starts.length ? Math.max(...starts) : null };
      })
      .filter((d) => d.first != null);
    const over = (d: (typeof days)[number]) => now > d.last! + LATE;
    const nextDay = days.find((d) => !over(d));
    const lastDay = [...days].reverse().find((d) => over(d) && d.day.games.some((g) => g.away !== g.home));

    const teams = await getTeams(latest.id);
    const teamIds: Record<string, string> = {};
    for (const t of teams) for (const n of [t.name, t.other_name]) if (n) teamIds[norm(n)] = String(t.id);

    let last: { label: string; results: WeekResult[]; top?: TopPerformer } | null = null;
    if (lastDay) {
      const [stats, players] = await Promise.all([getStats({ season: latest.id }), getPlayers()]);

      // Group stat rows into games; a game with exactly two teams is a finished matchup.
      type Played = { id: number; pts: Map<string, number>; rows: GameStat[] };
      const pairs = new Map<string, Played[]>();
      for (const [gid, rows] of groupBy(stats.filter((r) => r.game != null), (r) => String(r.game))) {
        const pts = new Map<string, number>();
        for (const r of rows) pts.set(String(r.team), (pts.get(String(r.team)) ?? 0) + (Number(r.points) || 0));
        if (pts.size !== 2) continue;
        const key = [...pts.keys()].sort().join("|");
        pairs.set(key, [...(pairs.get(key) ?? []), { id: Number(gid) || 0, pts, rows }]);
      }
      for (const list of pairs.values()) list.sort((a, b) => a.id - b.id);

      const pairOf = (g: Game) => {
        const a = teamIds[norm(g.away)];
        const b = teamIds[norm(g.home)];
        return a && b ? { a, b, key: [a, b].sort().join("|") } : null;
      };

      const results: WeekResult[] = [];
      const used: GameStat[] = [];
      for (const g of lastDay.day.games) {
        const pair = pairOf(g);
        if (!pair) continue;
        // If two teams meet more than once, the nth scheduled meeting is the nth game in the stats.
        const nth = games.slice(0, games.indexOf(g) + 1).filter((x) => pairOf(x)?.key === pair.key).length;
        const played = pairs.get(pair.key)?.[nth - 1];
        if (!played) continue;
        used.push(...played.rows);
        results.push({
          time: g.time, away: g.away, home: g.home, awayId: pair.a, homeId: pair.b,
          awayPts: played.pts.get(pair.a) ?? 0, homePts: played.pts.get(pair.b) ?? 0,
        });
      }

      let top: TopPerformer | undefined;
      const best = used.reduce<GameStat | null>((b, r) => ((Number(r.points) || 0) > (b ? Number(b.points) || 0 : -1) ? r : b), null);
      const player = best && players.find((p) => String(p.id) === String(best.player));
      if (best && player) {
        top = {
          player, pts: Number(best.points) || 0, reb: Number(best.rebounds) || 0, ast: Number(best.assists) || 0,
          team: teams.find((t) => String(t.id) === String(best.team)),
        };
      }
      last = { label: dayLabel(lastDay.day), results, top };
    }

    if (!nextDay && !last) return null;
    return { next: nextDay ? { day: nextDay.day, startsAt: nextDay.first! } : null, last, teamIds };
  } catch {
    return null; // the home page simply leaves this section out
  }
}

export type ThisWeek = NonNullable<Awaited<ReturnType<typeof getThisWeek>>>;
