import { getTeam } from "@/lib/directus";
import { buildIcs, type IcsEvent } from "@/lib/ics";
import { GAME_MINUTES, getSchedule, norm, startsAt, toGames } from "@/lib/schedule";
import { SITE_URL, VENUE } from "@/lib/site";

export const dynamic = "force-dynamic";

// /calendar/<team id>.ics: one team's games, as a subscribable calendar feed.
export async function GET(req: Request, { params }: { params: Promise<{ team: string }> }) {
  const id = (await params).team.replace(/\.ics$/i, "");
  const team = await getTeam(id);
  if (!team) return new Response("Team not found", { status: 404 });

  const data = await getSchedule().catch(() => null);
  const games = data ? toGames(data.head, data.body) ?? [] : [];
  const names = new Set([team.name, team.other_name].filter((n): n is string => !!n).map(norm));
  const host = new URL(SITE_URL).host;

  const events: IcsEvent[] = [];
  for (const g of games) {
    const start = startsAt(g);
    if (start == null || g.away === g.home) continue;
    const base = { start, end: start + GAME_MINUTES * 60_000, location: VENUE };
    const matchup = `${g.away} vs. ${g.home}`;
    if (names.has(norm(g.away)) || names.has(norm(g.home))) {
      events.push({
        ...base,
        uid: `${g.iso}-${g.time}-${team.id}-game@${host}`.replace(/\s+/g, ""),
        summary: matchup,
        description: `${g.away} (dark jerseys) vs. ${g.home} (light jerseys)`,
      });
    }
    if (g.statsTeam && names.has(norm(g.statsTeam))) {
      events.push({
        ...base,
        uid: `${g.iso}-${g.time}-${team.id}-stats@${host}`.replace(/\s+/g, ""),
        summary: `Keep stats: ${matchup}`,
        description: g.statsPeople.length ? `Stat keepers: ${g.statsPeople.join(", ")}` : undefined,
      });
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "text/calendar; charset=utf-8",
    "Cache-Control": "public, max-age=300",
  };
  if (new URL(req.url).searchParams.has("download")) {
    headers["Content-Disposition"] = `attachment; filename="${team.name.replace(/[^\w-]+/g, "-")}-games.ics"`;
  }
  return new Response(buildIcs(`${team.name} games`, events), { headers });
}
