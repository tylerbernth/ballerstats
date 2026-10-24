import Link from "next/link";
import Countdown from "./Countdown";
import JerseyKey from "./JerseyKey";
import ScheduleDay from "./ScheduleDay";
import { Face, PlayerLink } from "./ui";
import type { ThisWeek as Data } from "@/lib/thisweek";

export default function ThisWeek({ data }: { data: Data }) {
  const { next, last, teamIds } = data;

  // Both columns use the same pieces in the same order: heading, a fixed-height summary, then the game list.
  return (
    <section className="mt-14 border-t border-slate-300 pt-8">
      <h2 className="mb-4 font-display text-4xl font-bold text-blue-900">This Week</h2>
      <JerseyKey className="mb-8" />
      <div className="grid gap-x-10 gap-y-10 lg:grid-cols-2 lg:items-stretch">
        <div className="flex flex-col">
          <h3 className="mb-3 text-xl font-semibold">Next Games</h3>
          {next ? (
            <>
              <Countdown target={next.startsAt} />
              <ScheduleDay day={next.day} teamIds={teamIds} showStats={false} fill compact />
            </>
          ) : (
            <p className="text-slate-600">No upcoming games on the schedule.</p>
          )}
        </div>

        <div className="flex flex-col">
          <h3 className="mb-3 text-xl font-semibold">Last Week</h3>
          {last ? (
            <>
              <p className="mb-5 flex h-20 items-center text-slate-600">Select Box score for the full stat lines.</p>
              <ScheduleDay day={last.day} teamIds={teamIds} showStats={false} scores={last.scores} gameIds={last.gameIds} fill compact />
            </>
          ) : (
            <p className="text-slate-600">Results will show up here after the first game day.</p>
          )}
        </div>
      </div>

      {last && last.top.length > 0 && (
        <div className="mt-12">
          <h3 className="mb-3 text-xl font-semibold">Last Week&apos;s Top Performers</h3>
          {/* Large screens: three cards side by side. Smaller screens: one bordered list with dividers. */}
          <ol className="overflow-hidden rounded-md border border-slate-300 bg-white lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent">
            {last.top.map((t, i) => (
              <li
                key={String(t.player.id)}
                className="flex items-center gap-3 border-t border-slate-200 px-4 py-3 first:border-t-0 lg:gap-4 lg:rounded-md lg:border lg:border-slate-300 lg:bg-white lg:p-4 lg:first:border-t"
              >
                <span className="w-5 shrink-0 font-display text-2xl font-bold leading-none text-red-700 lg:text-3xl">{i + 1}</span>
                <Face player={t.player} size={52} />
                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between sm:gap-6 lg:block">
                  <div className="min-w-0">
                    <p className="truncate font-semibold [&_a]:no-underline [&_a:hover]:text-red-700 [&_a:hover]:underline">
                      <PlayerLink player={t.player} />
                    </p>
                    {t.team && <p className="truncate text-[.9375rem] text-slate-600">{t.team.name}</p>}
                  </div>
                  <p className="text-[.9375rem] tabular-nums sm:shrink-0 sm:text-right lg:mt-1 lg:text-left">
                    {t.pts} pts, {t.reb} reb, {t.ast} ast
                    <Link href={`/game/${t.game}`} className="ml-3 font-semibold text-blue-900 hover:text-red-700 hover:underline">
                      Box score
                    </Link>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
