import { getGameVideos, getTeam } from "@/lib/directus";
import { getTeamGames } from "@/lib/teamgames";

export const dynamic = "force-dynamic";

// Troubleshooting only: /api/video-check?key=<DEBUG_KEY>&team=<team id>
// Shows how many games have a video saved in Directus and, for one team, which of its games do.
// It stays switched off (404) unless DEBUG_KEY is set in the environment.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = process.env.DEBUG_KEY;
  if (!key || url.searchParams.get("key") !== key) return new Response("Not found", { status: 404 });

  const out: Record<string, unknown> = { savedInDirectus: (await getGameVideos()).length };

  const teamId = url.searchParams.get("team");
  const team = teamId ? await getTeam(teamId) : null;
  if (team) {
    const games = await getTeamGames(team);
    out.team = team.name;
    out.games = games.map((g) => ({ gameId: g.gameId, date: g.iso, opponent: g.opponentName, video: g.videoId ?? null }));
  }
  return Response.json(out);
}
