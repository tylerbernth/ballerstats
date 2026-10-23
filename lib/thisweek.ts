import { getPlayers, getSeasons, getStats, getTeams } from "./directus";
import { matchSchedule, playedGames } from "./games";
import { getSchedule, groupByDate, norm, startsAt, toGames } from "./schedule";
import type { GameStat, Player, Team } from "./types";

const LATE = 90 * 60_000; // a game day counts as over 90 minutes after its last start time

export type Score = { away: number; home: number };
export type TopPerformer = { player: Player; pts: number; reb: number; ast: number; team?: Team; game: string };

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

    let last: {
      day: (typeof days)[number]["day"];
      scores: Record<number, Score>;
      gameIds: Record<number, string>;
      top: TopPerformer[];
    } | null = null;

    if (lastDay) {
      const [stats, players] = await Promise.all([getStats({ season: latest.id }), getPlayers()]);
      const matches = matchSchedule(games, teamIds, playedGames(stats));

      const scores: Record<number, Score> = {};
      const gameIds: Record<number, string> = {};
      const used: GameStat[] = [];
      for (const [i, g] of lastDay.day.games.entries()) {
        const m = matches.get(games.indexOf(g));
        if (!m) continue;
        used.push(...m.played.rows);
        scores[i] = { away: m.played.pts.get(m.awayId) ?? 0, home: m.played.pts.get(m.homeId) ?? 0 };
        gameIds[i] = m.played.id;
      }

      // Top three scorers, one line per player (their best game of the day).
      const n = (v: number | null) => Number(v) || 0;
      const ranked = [...used].sort(
        (a, b) => n(b.points) - n(a.points) || n(b.rebounds) + n(b.assists) - (n(a.rebounds) + n(a.assists)),
      );
      const playerById = new Map(players.map((p) => [String(p.id), p]));
      const top: TopPerformer[] = [];
      const seen = new Set<string>();
      for (const r of ranked) {
        if (top.length >= 3) break;
        const pid = String(r.player);
        const player = playerById.get(pid);
        if (!player || seen.has(pid)) continue;
        seen.add(pid);
        top.push({
          player, pts: n(r.points), reb: n(r.rebounds), ast: n(r.assists),
          team: teams.find((t) => String(t.id) === String(r.team)), game: String(r.game),
        });
      }
      last = { day: lastDay.day, scores, gameIds, top };
    }

    if (!nextDay && !last) return null;
    return { next: nextDay ? { day: nextDay.day, startsAt: nextDay.first! } : null, last, teamIds };
  } catch {
    return null; // the home page simply leaves this section out
  }
}

export type ThisWeek = NonNullable<Awaited<ReturnType<typeof getThisWeek>>>;
