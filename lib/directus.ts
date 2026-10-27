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
  games: "xroads_bball_games",
  announcements: "xroads_bball_announcements",
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

export const getStats = (by: { season?: ID; team?: ID; player?: ID; game?: ID }) =>
  list<GameStat>(COLLECTIONS.stats, {
    fields: STAT_FIELDS,
    sort: "game,id",
    "filter[season][_eq]": by.season === undefined ? undefined : String(by.season),
    "filter[team][_eq]": by.team === undefined ? undefined : String(by.team),
    "filter[player][_eq]": by.player === undefined ? undefined : String(by.player),
    "filter[game][_eq]": by.game === undefined ? undefined : String(by.game),
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

// Games that have a YouTube video saved on them (the n8n flow fills this in). The id is the same
// value as the game field on the stat rows. Optional like recaps: without read access there are simply none.
export type GameVideo = { id: ID; youtube_video_id: string };

export const getGameVideos = async (): Promise<GameVideo[]> =>
  (
    await optional(() =>
      list<GameVideo>(COLLECTIONS.games, {
        fields: "id,youtube_video_id",
        "filter[youtube_video_id][_nempty]": "true",
      }),
    )
  ).filter((g) => g.youtube_video_id?.trim());

// Short-lived home page links (voting, signups). A link shows from starts_at (blank means right away) until
// ends_at, so it disappears on its own. The dates are checked here, not in the query, so they are always
// current. Only web addresses and site paths are accepted. At most three, lowest sort first.
export type Announcement = {
  id: ID;
  label: string;
  url: string;
  note?: string | null;
  starts_at?: string | null;
  ends_at: string;
  sort?: number | null;
};

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const now = Date.now();
    return (await optional(() => list<Announcement>(COLLECTIONS.announcements, { fields: "id,label,url,note,starts_at,ends_at,sort" })))
      .filter((a) => {
        if (!a.label?.trim() || !/^(https?:\/\/|\/(?!\/))/i.test(a.url?.trim() ?? "")) return false;
        const ends = Date.parse(a.ends_at);
        const starts = a.starts_at ? Date.parse(a.starts_at) : -Infinity;
        return !Number.isNaN(ends) && ends >= now && starts <= now;
      })
      .sort((a, b) => (a.sort ?? 999) - (b.sort ?? 999) || Date.parse(a.ends_at) - Date.parse(b.ends_at))
      .slice(0, 3);
  } catch {
    return []; // decorative: the home page just leaves it out
  }
}

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
