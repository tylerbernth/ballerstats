import { notFound, permanentRedirect } from "next/navigation";
import { getPlayers, getSeasons, getTeams } from "./directus";
import { displayName, slugify } from "./format";

const decode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

// Old WordPress address /teams/goon-squad/ -> /team/<id> (newest season if the name repeats).
export async function redirectLegacyTeam(slug: string): Promise<never> {
  const key = slugify(decode(slug));
  const [seasons, teams] = await Promise.all([getSeasons(), getTeams()]);
  const rank = new Map(seasons.map((s, i) => [String(s.id), i])); // seasons come newest first
  const hit = teams
    .filter((t) => [t.name, t.other_name].some((n) => n && slugify(n) === key))
    .sort((a, b) => (rank.get(String(a.season)) ?? 999) - (rank.get(String(b.season)) ?? 999))[0];
  if (hit) permanentRedirect(`/team/${hit.id}`);
  notFound();
}

// Old WordPress address /player/ryan-lambert/ -> /player/<id>.
export async function redirectLegacyPlayer(slug: string): Promise<never> {
  const key = slugify(decode(slug));
  const hit = (await getPlayers()).find((p) => slugify(displayName(p)) === key);
  if (hit) permanentRedirect(`/player/${hit.id}`);
  notFound();
}
