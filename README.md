# Ballerstats

Read-only Next.js (App Router) front end for the Xroads basketball league, backed by Directus.

## Run it

```bash
npm install
cp .env.example .env.local   # set DIRECTUS_URL (and DIRECTUS_TOKEN if needed)
npm run dev
```

## Directus access

All Directus calls happen on the server, so the token is never sent to the browser and no CORS setup is needed.

Give a role (or the Public role) read access to:
`xroads_bball_seasons`, `xroads_bball_teams`, `xroads_bball_team_rosters`, `xroads_bball_players`, `xroads_bball_game_stats`.
Headshots are served through `/headshot/[id]`, which fetches `directus_files` with the same token, so that collection also needs read access.

Data is cached for 60 seconds, so edits in Directus show up within a minute.

## Routes

| Path | Page |
| --- | --- |
| `/` | Landing page with links to the newest season's teams and players |
| `/schedule` | Schedule read from a Google Sheet |
| `/records?cat=pts` | All-time career totals and single-game bests |
| `/rules` | Rules and guidelines (text lives in `app/rules/page.tsx`) |
| `/teams/[season]` | Standings |
| `/team/[id]` | Team roster and averages |
| `/stats/[season]?cat=pts` | Stat leaders |
| `/players/[season]` | Searchable player list |
| `/player/[id]?season=` | Season splits and game log |

The Teams, Stats and Players header menus list every row of `xroads_bball_seasons`, newest `start_date` first.

## Assumptions about the schema

- `season`, `captain`, `cocaptain`, `team`, `player` and `game` are many-to-one fields that return plain ids.
- `game` is only used to count games played, so it can point at any collection.
- Roster membership comes from `xroads_bball_team_rosters`; averages come from `xroads_bball_game_stats`.

## Code map

- `lib/directus.ts`: the only file that talks to Directus
- `lib/stats.ts`: averages and shooting percentages
- `components/SeasonNav.tsx`: header dropdowns

## Schedule sheet

Set `GOOGLE_SHEET_ID` (and `GOOGLE_SHEET_GID` for a tab other than the first) in `.env.local`.
Share the sheet as "Anyone with the link can view". The first row becomes the column headings and every other
row is shown as written. Changes appear within about five minutes.

## Docker

```bash
docker compose up -d --build   # build and start in the background on http://localhost:3000
docker compose logs -f         # watch the logs
docker compose down            # stop it
```

Settings come from `.env.local` at start-up, so changing a value only needs `docker compose up -d`.
Code changes need `docker compose up -d --build`.
