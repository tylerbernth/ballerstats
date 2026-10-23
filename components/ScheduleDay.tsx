import Link from "next/link";
import { Dot } from "./JerseyKey";
import { dayLabel, norm, type Game } from "@/lib/schedule";

type Day = { date: string; iso: string | null; games: Game[] };
type Score = { away: number; home: number };

// Links to the team page when the name matches a team in Directus (playoff placeholders like "Winner (Low Seed)" stay plain text).
function TeamName({ name, ids, linkable = true }: { name: string; ids: Record<string, string>; linkable?: boolean }) {
  const id = ids[norm(name)];
  if (!id || !linkable) return <>{name}</>;
  return (
    <Link href={`/team/${id}`} className="underline decoration-slate-300 underline-offset-4 hover:text-red-700 hover:decoration-red-600">
      {name}
    </Link>
  );
}

function Points({ mine, theirs }: { mine: number; theirs: number }) {
  return <span className={`tabular-nums ${mine > theirs ? "font-bold" : "font-normal text-slate-600"}`}>{mine}</span>;
}

function Matchup({ g, ids, score, compact, linkable = true }: { g: Game; ids: Record<string, string>; score?: Score; compact: boolean; linkable?: boolean }) {
  if (!g.away || !g.home || g.away === g.home) return <span className="font-semibold">{g.away || g.home}</span>;
  const side = `flex items-center font-semibold ${compact ? "gap-1.5" : "gap-2"}`;
  return (
    <span className={`flex flex-wrap items-center gap-y-1 ${compact ? "gap-x-2.5" : "gap-x-3"}`}>
      <span className={side}>
        <Dot dark />
        <TeamName name={g.away} ids={ids} linkable={linkable} />
        {score && <Points mine={score.away} theirs={score.home} />}
      </span>
      <span className="text-slate-500">vs.</span>
      <span className={side}>
        <Dot dark={false} />
        <TeamName name={g.home} ids={ids} linkable={linkable} />
        {score && <Points mine={score.home} theirs={score.away} />}
      </span>
    </span>
  );
}

// One game day.
// showStats: show the stat-keepers. scores: final scores keyed by game position.
// fill: stretch the rows to match a taller neighbouring column. compact: narrower time column and smaller text,
// so a matchup fits on one line in a half-width column.
export default function ScheduleDay({
  day, teamIds, showStats = true, scores, gameIds, fill = false, compact = false,
}: {
  day: Day; teamIds: Record<string, string>; showStats?: boolean; scores?: Record<number, Score>; gameIds?: Record<number, string>; fill?: boolean; compact?: boolean;
}) {
  return (
    <section className={fill ? "flex flex-1 flex-col" : undefined}>
      <h3 className="mb-2 font-display text-2xl font-bold text-blue-900">{dayLabel(day)}</h3>
      <ul className={`overflow-hidden rounded-md border border-slate-300 bg-white ${fill ? "flex flex-1 flex-col" : ""}`}>
        {day.games.map((g, i) => {
          const boxScoreHref = gameIds?.[i];
          const matchup = <Matchup g={g} ids={teamIds} score={scores?.[i]} compact={compact} linkable={!boxScoreHref} />;

          return (
            <li
              key={i}
              className={`grid gap-y-1 border-t border-slate-200 py-3 first:border-t-0 sm:items-baseline ${
                compact ? "gap-x-3 px-3.5 text-[.9375rem] sm:grid-cols-[4.5rem_1fr]" : "gap-x-5 px-4 sm:grid-cols-[5.25rem_1fr]"
              } ${fill ? "flex-1 content-center" : ""}`}
            >
              <span className="font-semibold tabular-nums text-red-700">{g.time}</span>
              {boxScoreHref ? (
                <Link href={`/game/${boxScoreHref}`} className="underline decoration-slate-300 underline-offset-4 hover:text-red-700 hover:decoration-red-600">
                  {matchup}
                </Link>
              ) : (
                matchup
              )}
              {showStats && (g.statsTeam || g.statsPeople.length > 0) && (
                <p className="text-sm text-slate-600 sm:col-start-2">
                  <span className="font-semibold text-slate-700">Stats:</span>{" "}
                  {g.statsTeam && <TeamName name={g.statsTeam} ids={teamIds} />}
                  {g.statsPeople.length > 0 && <span>{g.statsTeam ? ` (${g.statsPeople.join(", ")})` : g.statsPeople.join(", ")}</span>}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
