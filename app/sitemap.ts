import type { MetadataRoute } from "next";
import { getPlayers, getRecaps, getSeasons, getTeams } from "@/lib/directus";
import { SITE_URL } from "@/lib/site";

// Built per request so new seasons, teams and players appear without a redeploy.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = ["", "/schedule", "/recaps", "/records", "/champions", "/rules"].map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));

  try {
    const [seasons, teams, players, recaps] = await Promise.all([getSeasons(), getTeams(), getPlayers(), getRecaps()]);
    seasons.forEach((s, i) => {
      for (const kind of ["teams", "players", "stats"]) {
        entries.push({ url: `${SITE_URL}/${kind}/${s.id}`, changeFrequency: i === 0 ? "daily" : "yearly", priority: i === 0 ? 0.9 : 0.6 });
      }
    });
    teams.forEach((t) => entries.push({ url: `${SITE_URL}/team/${t.id}`, changeFrequency: "weekly", priority: 0.6 }));
    recaps.forEach((r) => entries.push({ url: `${SITE_URL}/recaps/${r.slug}`, changeFrequency: "yearly", priority: 0.6 }));
    players.forEach((p) => entries.push({ url: `${SITE_URL}/player/${p.id}`, changeFrequency: "weekly", priority: 0.5 }));
  } catch {
    // If Directus is unreachable, still serve the fixed pages.
  }
  return entries;
}
