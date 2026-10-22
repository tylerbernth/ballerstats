import type { GameStat, ID, Player, Recap, Roster, Season, Team } from "./types";

const BASE = (process.env.DIRECTUS_URL ?? "").replace(/\/$/, "");
const TOKEN = process.env.DIRECTUS_TOKEN;

export const COLLECTIONS = {
  teams: "xroads_bball_teams",
  rosters: "xroads_bball_team_rosters",
  seasons: "xroads_bball_seasons",
  players: "xroads_bball_players",
  stats: "xroads_bball_game_stats",
  recaps: "xroads_bball_recaps",
} as const;

export class DirectusError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

type Params = Record<string, string | number | undefined>;

async function request<T>(path: string, params: Params = {}): Promise<T> {
  if (!BASE) throw new DirectusError("DIRECTUS_URL is not set. Copy .env.example to .env.local and fill it in.", 500);
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) qs.set(k, String(v));
  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new DirectusError(`Directus returned ${res.status} for ${path}`, res.status);
  return ((await res.json()) as { data: T }).data;
}

const list = <T>(collection: string, params: Params = {}) =>
  request<T[]>(`/items/${collection}`, { limit: -1, ...params });

async function one<T>(collection: string, id: ID): Promise<T | null> {
  try {
    return await request<T>(`/items/${collection}/${encodeURIComponent(String(id))}`);
  } catch (e) {
    // 400 happens when the id is not valid for the collection, for example an old WordPress slug.
    if (e instanceof DirectusError && [400, 403, 404].includes(e.status)) return null;
    throw e;
  }
}

// Newest first. Sorted by the number in the name ("Season 13"), so a wrong start date cannot shuffle the list;
// start date breaks ties and orders any seasons without a number.
const seasonNumber = (s: Season) => {
  const m = s.season_name?.match(/\d+/);
  return m ? Number(m[0]) : null;
};

export const getSeasons = async () =>
  (await list<Season>(COLLECTIONS.seasons, { sort: "-start_date" })).sort((a, b) => {
    const x = seasonNumber(a);
    const y = seasonNumber(b);
    if (x !== null && y !== null && x !== y) return y - x;
    return (b.start_date ?? "").localeCompare(a.start_date ?? "");
  });
export const getPlayers = () => list<Player>(COLLECTIONS.players, { sort: "last_name" });
export const getPlayer = (id: ID) => one<Player>(COLLECTIONS.players, id);
export const getTeam = (id: ID) => one<Team>(COLLECTIONS.teams, id);
export const getTeams = (seasonId?: ID) =>
  list<Team>(COLLECTIONS.teams, seasonId === undefined ? {} : { "filter[season][_eq]": String(seasonId) });

export const getRosters = (by: { team?: ID; season?: ID }) =>
  list<Roster>(COLLECTIONS.rosters, {
    "filter[team][_eq]": by.team === undefined ? undefined : String(by.team),
    "filter[team][season][_eq]": by.season === undefined ? undefined : String(by.season),
  });

const STAT_FIELDS =
  "id,player,game,team,season,points,two_points_made,two_points_attempted,three_points_made,three_points_attempted,ft_made,ft_attempted,rebounds,assists,steals,blocks,fouls";

export const getStats = (by: { season?: ID; team?: ID; player?: ID }) =>
  list<GameStat>(COLLECTIONS.stats, {
    fields: STAT_FIELDS,
    sort: "game,id",
    "filter[season][_eq]": by.season === undefined ? undefined : String(by.season),
    "filter[team][_eq]": by.team === undefined ? undefined : String(by.team),
    "filter[player][_eq]": by.player === undefined ? undefined : String(by.player),
  });

// Recaps are optional: if the collection is missing or the token cannot read it yet, the site simply shows none.
async function optional<T>(run: () => Promise<T[]>): Promise<T[]> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof DirectusError && [400, 403, 404].includes(e.status)) return [];
    throw e;
  }
}

export const getRecaps = () =>
  optional(() =>
    list<Recap>(COLLECTIONS.recaps, {
      fields: "id,title,slug,season,summary,cover_image,date_created,players.*",
      "filter[status][_eq]": "published",
      sort: "-date_created",
    }),
  );

export const getRecap = async (slug: string) =>
  (
    await optional(() =>
      list<Recap>(COLLECTIONS.recaps, {
        fields: "*,players.*",
        "filter[slug][_eq]": slug,
        "filter[status][_eq]": "published",
        limit: 1,
      }),
    )
  )[0] ?? null;

// Fetches a photo (Directus file id or full image URL) as a data URI, for share cards drawn on the server.
export async function assetDataUri(value: string, size = 400): Promise<string | null> {
  try {
    const isUrl = /^https?:\/\//i.test(value);
    if (!isUrl && !BASE) return null;
    const res = await fetch(
      isUrl ? value : `${BASE}/assets/${encodeURIComponent(value)}?width=${size}&height=${size}&fit=cover&format=jpg&quality=85`,
      { headers: !isUrl && TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}, next: { revalidate: 3600 } },
    );
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/^image\/(png|jpe?g|gif)/.test(type)) return null;
    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
}
