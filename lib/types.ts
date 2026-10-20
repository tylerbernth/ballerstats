export type ID = number | string;

export type Season = {
  id: ID;
  season_name: string;
  start_date: string | null;
  end_date: string | null;
};

export type Player = {
  id: ID;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  headshot: string | null; // Directus file id
};

export type Team = {
  id: ID;
  season: ID;
  name: string;
  other_name: string | null;
  captain: ID | null;
  cocaptain: ID | null;
  wins: number | null;
  losses: number | null;
  google_sheet_team: string | null;
  google_sheet_team_link: string | null;
};

export type Roster = { id: ID; team: ID; player: ID };

export type GameStat = {
  id: ID;
  player: ID;
  game: ID | null;
  team: ID;
  season: ID;
  points: number | null;
  two_points_made: number | null;
  two_points_attempted: number | null;
  three_points_made: number | null;
  three_points_attempted: number | null;
  ft_made: number | null;
  ft_attempted: number | null;
  rebounds: number | null;
  assists: number | null;
  steals: number | null;
  blocks: number | null;
  fouls: number | null;
};
