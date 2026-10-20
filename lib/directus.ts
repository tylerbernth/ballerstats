import type { GameStat, ID, Player, Roster, Season, Team } from "./types";

const BASE = (process.env.DIRECTUS_URL ?? "").replace(/\/$/, "");
const TOKEN = process.env.DIRECTUS_TOKEN;

export const COLLECTIONS = {
  teams: "xroads_bball_teams",
  rosters: "xroads_bball_team_rosters",
  seasons: "xroads_bball_seasons",
  players: "xroads_bball_players",
  stats: "xroads_bball_game_stats",
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
    if (e instanceof DirectusError && (e.status === 404 || e.status === 403)) return null;
    throw e;
  }
}

export const getSeasons = () => list<Season>(COLLECTIONS.seasons, { sort: "-start_date" });
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
