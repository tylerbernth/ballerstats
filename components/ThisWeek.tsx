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
              <div className="mb-5 flex h-20 items-center gap-4">
                {last.top ? (
                  <>
                    <Face player={last.top.player} size={64} />
                    <div>
                      <p className="text-[.9375rem] text-slate-600">Top Performer</p>
                      <p className="text-xl font-semibold">
                        <PlayerLink player={last.top.player} />
                      </p>
                      <p className="text-[.9375rem]">
                        {last.top.pts} points, {last.top.reb} rebounds, {last.top.ast} assists
                        {last.top.team ? ` for ${last.top.team.name}` : ""}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-600">Scores and the top performer show up once the stats are entered.</p>
                )}
              </div>
              <ScheduleDay day={last.day} teamIds={teamIds} showStats={false} scores={last.scores} fill compact />
            </>
          ) : (
            <p className="text-slate-600">Results will show up here after the first game day.</p>
          )}
        </div>
      </div>
    </section>
  );
}
