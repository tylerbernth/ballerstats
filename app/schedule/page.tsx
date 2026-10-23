import type { Metadata } from "next";
import AddToCalendar from "@/components/AddToCalendar";
import JerseyKey from "@/components/JerseyKey";
import ScheduleDay from "@/components/ScheduleDay";
import { Empty, Title } from "@/components/ui";
import { getSeasons, getTeams } from "@/lib/directus";
import { getSchedule, groupByDate, norm, toGames, todayIso } from "@/lib/schedule";

export const metadata: Metadata = {
  title: "Schedule",
  description: "Game times, matchups and stat-keepers for the Crossroads Basketball League.",
};
export const revalidate = 300;

// Maps team names to Directus team ids for the newest season. If Directus is unreachable, names just stay unlinked.
async function getTeamIds() {
  try {
    const [latest] = await getSeasons();
    if (!latest) return {};
    const ids: Record<string, string> = {};
    for (const t of await getTeams(latest.id)) for (const n of [t.name, t.other_name]) if (n) ids[norm(n)] = String(t.id);
    return ids;
  } catch {
    return {};
  }
}

async function getCurrentTeams() {
  try {
    const [latest] = await getSeasons();
    return latest ? (await getTeams(latest.id)).sort((a, b) => a.name.localeCompare(b.name)) : [];
  } catch {
    return [];
  }
}

export default async function SchedulePage() {
  let data: Awaited<ReturnType<typeof getSchedule>> | null = null;
  let problem = "";
  try {
    data = await getSchedule();
  } catch (e) {
    problem = e instanceof Error ? e.message : "Unknown error";
  }

  const [teamIds, currentTeams] = await Promise.all([getTeamIds(), getCurrentTeams()]);
  const games = data ? toGames(data.head, data.body) : null;
  const days = games ? groupByDate(games) : [];
  const today = todayIso();
  const upcoming = days.filter((d) => !d.iso || d.iso >= today);
  const past = days.filter((d) => d.iso && d.iso < today).reverse();
  const hasJerseys = data?.head.some((h) => /dark|light/i.test(h));

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <Title>Schedule</Title>
        {!problem && currentTeams.length > 0 && <AddToCalendar teams={currentTeams.map((t) => ({ id: String(t.id), name: t.name }))} />}
      </div>

      {problem ? (
        <Empty title="Could not load the schedule">{problem} Check GOOGLE_SHEET_ID in your environment settings.</Empty>
      ) : !data || (data.head.length === 0 && data.body.length === 0) ? (
        <Empty title="The schedule sheet is empty">Add rows to the sheet and they will show up here.</Empty>
      ) : games ? (
        <>
          {hasJerseys && <JerseyKey className="mb-6" />}
          <div className="space-y-8">
            {upcoming.length ? upcoming.map((d) => <ScheduleDay key={d.date} day={d} teamIds={teamIds} />) : <Empty title="No upcoming games">Check the earlier games below.</Empty>}
          </div>
          {past.length > 0 && (
            <details className="mt-12" open={upcoming.length === 0}>
              <summary className="cursor-pointer font-display text-2xl font-bold text-blue-900">
                Earlier games ({past.reduce((n, d) => n + d.games.length, 0)})
              </summary>
              <div className="mt-4 space-y-8">{past.map((d) => <ScheduleDay key={d.date} day={d} teamIds={teamIds} />)}</div>
            </details>
          )}
        </>
      ) : (
        <div className="scroll">
          <table className="tbl left">
            <thead><tr>{data.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{data.body.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}

    </>
  );
}
