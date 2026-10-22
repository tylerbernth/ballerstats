import Link from "next/link";
import Countdown from "./Countdown";
import ScheduleDay from "./ScheduleDay";
import { Face, PlayerLink } from "./ui";
import type { ThisWeek as Data } from "@/lib/thisweek";

const teamClass = "underline decoration-slate-300 underline-offset-4 hover:text-red-700 hover:decoration-red-600";

export default function ThisWeek({ data }: { data: Data }) {
  const { next, last, teamIds } = data;

  const Side = ({ name, id, pts, win }: { name: string; id?: string; pts: number; win: boolean }) => (
    <span className={win ? "font-bold text-slate-900" : "text-slate-700"}>
      {id ? <Link href={`/team/${id}`} className={teamClass}>{name}</Link> : name}{" "}
      <span className="tabular-nums">{pts}</span>
    </span>
  );

  return (
    <section className="mt-14 border-t border-slate-300 pt-8">
      <h2 className="mb-6 font-display text-4xl font-bold text-blue-900">This Week</h2>
      <div className="grid gap-x-14 gap-y-10 lg:grid-cols-2">
        {/* Left Column: Next Games */}
        <div>
          <h3 className="mb-3 text-xl font-semibold text-slate-900">Next Games</h3>
          {next ? (
            <>
              <Countdown target={next.startsAt} />
              <ScheduleDay day={next.day} teamIds={teamIds} />
            </>
          ) : (
            <p className="text-slate-600">No upcoming games on the schedule.</p>
          )}
        </div>

        {/* Right Column: Last Week Results */}
        <div>
          <h3 className="mb-3 text-xl font-semibold text-slate-900">Last Week</h3>
          {last ? (
            <>
              {/* Top Performer slot matching the exact h-14 height of <Countdown /> */}
              <div className="relative mb-5 flex h-14 items-center">
                {last.top && (
                  <div className="absolute left-0 top-1/2 flex -translate-y-1/2 items-center gap-4">
                    <Face player={last.top.player} size={64} />
                    <div>
                      <p className="text-[.9375rem] text-slate-600">Top Performer</p>
                      <p className="text-xl font-semibold leading-tight">
                        <PlayerLink player={last.top.player} />
                      </p>
                      <p className="text-sm text-slate-700">
                        {last.top.pts} points, {last.top.reb} rebounds, {last.top.ast} assists
                        {last.top.team ? ` for ${last.top.team.name}` : ""}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <p className="mb-3 text-xl font-bold text-blue-900">{last.label}</p>
              {last.results.length ? (
                <ul className="overflow-hidden rounded-md border border-slate-300 bg-white">
                  {last.results.map((r, i) => (
                    <li
                      key={i}
                      className="flex h-[88px] items-center gap-x-5 border-t border-slate-200 px-4 first:border-t-0"
                    >
                      <span className="w-20 shrink-0 tabular-nums text-slate-600">{r.time}</span>
                      <span className="flex flex-wrap gap-x-4">
                        <Side name={r.away} id={r.awayId} pts={r.awayPts} win={r.awayPts > r.homePts} />
                        <Side name={r.home} id={r.homeId} pts={r.homePts} win={r.homePts > r.awayPts} />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-600">Results will show up here once the stats are entered.</p>
              )}
            </>
          ) : (
            <p className="text-slate-600">Results will show up here after the first game day.</p>
          )}
        </div>
      </div>
    </section>
  );
}