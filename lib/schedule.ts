// Reads a Google Sheet as CSV. The sheet must be shared as "Anyone with the link can view"
// (or published to the web). Set GOOGLE_SHEET_ID, and GOOGLE_SHEET_GID for a tab other than the first.

const ID = process.env.GOOGLE_SHEET_ID;
const GID = process.env.GOOGLE_SHEET_GID ?? "0";

export const sheetUrl = ID ? `https://docs.google.com/spreadsheets/d/${ID}/edit` : null;

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

export async function getSchedule(): Promise<{ head: string[]; body: string[][] }> {
  if (!ID) throw new Error("GOOGLE_SHEET_ID is not set.");
  const res = await fetch(`https://docs.google.com/spreadsheets/d/${ID}/export?format=csv&gid=${GID}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok || !res.headers.get("content-type")?.includes("csv")) {
    throw new Error("Google did not return the sheet. Share it as Anyone with the link can view.");
  }
  const rows = parseCsv(await res.text()).map((r) => r.map((c) => c.trim())).filter((r) => r.some(Boolean));
  const width = Math.max(0, ...rows.map((r) => r.length));
  const keep = Array.from({ length: width }, (_, i) => i).filter((i) => rows.some((r) => r[i]));
  const grid = rows.map((r) => keep.map((i) => r[i] ?? ""));
  return { head: grid[0] ?? [], body: grid.slice(1) };
}

// ---------- Structured view ----------
// Finds Date / Time / Away / Home columns by header name. Any other named columns are treated as
// stat-keeping info. Returns null when the sheet does not look like a schedule (the page then shows a plain table).

const LEAGUE_TZ = "America/Los_Angeles";
export const todayIso = () => new Date().toLocaleDateString("en-CA", { timeZone: LEAGUE_TZ });

export type Game = { date: string; iso: string | null; time: string; away: string; home: string; statsTeam: string; statsPeople: string[] };

// Normalizes team names so "Jackson's 5" in the sheet matches the Directus team name.
export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const blank = (s: string) => !s || /^#n\/a$/i.test(s);

function toIso(s: string) {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}

export function toGames(head: string[], body: string[][]): Game[] | null {
  const find = (re: RegExp) => head.findIndex((h) => re.test(h));
  const d = find(/^date/i), t = find(/^time/i), a = find(/away/i), h = find(/home/i);
  if (d < 0 || a < 0 || h < 0) return null;

  const extra = head.map((_, i) => i).filter((i) => ![d, t, a, h].includes(i) && head[i]);
  const teamCol = extra.find((i) => /team/i.test(head[i]));

  return body
    .filter((r) => r[d])
    .map((r) => {
      const people = extra.filter((i) => i !== teamCol).map((i) => r[i]).filter((v) => !blank(v));
      const team = teamCol === undefined ? "" : r[teamCol];
      return { date: r[d], iso: toIso(r[d]), time: t >= 0 ? r[t] : "", away: r[a], home: r[h], statsTeam: blank(team) ? "" : team, statsPeople: people };
    });
}

export function groupByDate(games: Game[]) {
  const days = new Map<string, { date: string; iso: string | null; games: Game[] }>();
  for (const g of games) {
    const day = days.get(g.date) ?? { date: g.date, iso: g.iso, games: [] };
    day.games.push(g);
    days.set(g.date, day);
  }
  return [...days.values()];
}

export const dayLabel = (day: { date: string; iso: string | null }) =>
  day.iso
    ? new Date(day.iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : day.date;

// ---------- Start times ----------
export const GAME_MINUTES = 60;

// Converts a wall-clock time in the league's time zone (for example 2026-10-25 17:30) to a UTC timestamp.
function laToUtc(iso: string, hour: number, minute: number) {
  const [y, mo, d] = iso.split("-").map(Number);
  const wall = Date.UTC(y, mo - 1, d, hour, minute);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: LEAGUE_TZ, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric",
  });
  const offsetAt = (t: number) => {
    const p = Object.fromEntries(fmt.formatToParts(new Date(t)).map((x) => [x.type, x.value]));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - t;
  };
  const first = wall - offsetAt(wall);
  return wall - offsetAt(first); // second pass settles daylight saving changes
}

export function startsAt(g: Game): number | null {
  const m = g.time.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!m || !g.iso) return null;
  const hour = (Number(m[1]) % 12) + (/pm/i.test(m[3]) ? 12 : 0);
  return laToUtc(g.iso, hour, Number(m[2] ?? 0));
}
