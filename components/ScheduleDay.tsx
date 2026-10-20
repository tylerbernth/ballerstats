import Link from "next/link";
import { dayLabel, norm, type Game } from "@/lib/schedule";

type Day = { date: string; iso: string | null; games: Game[] };

const Dot = ({ dark }: { dark: boolean }) => (
  <i aria-hidden className={`inline-block size-3 shrink-0 rounded-full border-2 border-slate-800 ${dark ? "bg-slate-800" : "bg-white"}`} />
);

// Links to the team page when the name matches a team in Directus (playoff placeholders like "Winner (Low Seed)" stay plain text).
function TeamName({ name, ids }: { name: string; ids: Record<string, string> }) {
  const id = ids[norm(name)];
  if (!id) return <>{name}</>;
  return (
    <Link href={`/team/${id}`} className="underline decoration-slate-300 underline-offset-4 hover:text-red-700 hover:decoration-red-600">
      {name}
    </Link>
  );
}

function Matchup({ g, ids }: { g: Game; ids: Record<string, string> }) {
  if (!g.away || !g.home || g.away === g.home) return <span className="font-semibold">{g.away || g.home}</span>;
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="flex items-center gap-2 font-semibold"><Dot dark /><TeamName name={g.away} ids={ids} /></span>
      <span className="text-slate-500">vs.</span>
      <span className="flex items-center gap-2 font-semibold"><Dot dark={false} /><TeamName name={g.home} ids={ids} /></span>
    </span>
  );
}

export default function ScheduleDay({ day, teamIds }: { day: Day; teamIds: Record<string, string> }) {
  return (
    <section>
      <h3 className="mb-2 font-display text-2xl font-bold text-blue-900">{dayLabel(day)}</h3>
      <ul className="overflow-hidden rounded-md border border-slate-300 bg-white">
        {day.games.map((g, i) => (
          <li key={i} className="grid gap-x-6 gap-y-1 border-t border-slate-200 px-4 py-3 first:border-t-0 sm:grid-cols-[6.5rem_1fr] sm:items-baseline">
            <span className="font-semibold tabular-nums text-red-700">{g.time}</span>
            <Matchup g={g} ids={teamIds} />
            {(g.statsTeam || g.statsPeople.length > 0) && (
              <p className="text-sm text-slate-600 sm:col-start-2">
                <span className="font-semibold text-slate-700">Stats:</span>{" "}
                {g.statsTeam && <TeamName name={g.statsTeam} ids={teamIds} />}
                {g.statsPeople.length > 0 && <span>{g.statsTeam ? ` (${g.statsPeople.join(", ")})` : g.statsPeople.join(", ")}</span>}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
