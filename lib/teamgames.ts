import { getGameVideos, getSeasons, getStats, getTeams } from "./directus";
import { same } from "./format";
import { getSchedule, norm, toGames } from "./schedule";
import { groupBy } from "./stats";
import type { Team } from "./types";

export type TeamGame = {
  gameId: string; // the stat rows' game value, also the box score address
  iso: string | null; // date, when it can be matched to the schedule sheet
  time: string;
  opponent?: Team;
  opponentName: string;
  mine: number;
  theirs: number;
  videoId?: string; // YouTube video saved on the game in Directus (filled in by the n8n flow)
};

// Every finished game for a team in its season, oldest first, with the final score.
// A game is finished when stat rows exist for exactly two teams with the same game value.
// For the current season the schedule sheet supplies each game's date (the nth meeting of two teams
// in the sheet is the nth game between them in the stats); earlier seasons just show game numbers.
export async function getTeamGames(team: Team): Promise<TeamGame[]> {
  const [stats, teams, seasons, saved] = await Promise.all([
    getStats({ season: team.season }),
    getTeams(team.season),
    getSeasons(),
    getGameVideos(),
  ]);
  const savedById = new Map(saved.map((g) => [String(g.id), g.youtube_video_id.trim()]));
  const teamById = new Map(teams.map((t) => [String(t.id), t]));

  type Played = { id: string; num: number; pts: Map<string, number> };
  const played: Played[] = [];
  for (const [gid, rows] of groupBy(stats.filter((r) => r.game != null), (r) => String(r.game))) {
    const pts = new Map<string, number>();
    for (const r of rows) pts.set(String(r.team), (pts.get(String(r.team)) ?? 0) + (Number(r.points) || 0));
    if (pts.size === 2) played.push({ id: gid, num: Number(gid) || 0, pts });
  }
  played.sort((a, b) => a.num - b.num);

  const dates = new Map<string, { iso: string | null; time: string }>();
  if (same(team.season, seasons[0]?.id)) {
    try {
      const data = await getSchedule();
      const ids: Record<string, string> = {};
      for (const t of teams) for (const n of [t.name, t.other_name]) if (n) ids[norm(n)] = String(t.id);

      const byPair = new Map<string, Played[]>();
      for (const p of played) {
        const key = [...p.pts.keys()].sort().join("|");
        byPair.set(key, [...(byPair.get(key) ?? []), p]);
      }
      const seen = new Map<string, number>();
      for (const g of toGames(data.head, data.body) ?? []) {
        const a = ids[norm(g.away)];
        const b = ids[norm(g.home)];
        if (!a || !b) continue;
        const key = [a, b].sort().join("|");
        const nth = (seen.get(key) ?? 0) + 1;
        seen.set(key, nth);
        const match = byPair.get(key)?.[nth - 1];
        if (match) dates.set(match.id, { iso: g.iso, time: g.time });
      }
    } catch {
      // without the schedule, games are simply numbered
    }
  }

  const me = String(team.id);
  return played
    .filter((p) => p.pts.has(me))
    .map((p) => {
      const oppId = [...p.pts.keys()].find((k) => k !== me)!;
      const opponent = teamById.get(oppId);
      const when = dates.get(p.id);
      return {
        gameId: p.id,
        iso: when?.iso ?? null,
        time: when?.time ?? "",
        opponent,
        opponentName: opponent?.name ?? "Unknown",
        mine: p.pts.get(me) ?? 0,
        theirs: p.pts.get(oppId) ?? 0,
        videoId: savedById.get(p.id),
      };
    });
}
