import Link from "next/link";
import Countdown from "./Countdown";
import JerseyKey from "./JerseyKey";
import ScheduleDay from "./ScheduleDay";
import { Face, PlayerLink } from "./ui";
import type { ThisWeek as Data } from "@/lib/thisweek";

export default function ThisWeek({ data }: { data: Data }) {
  const { next, last, teamIds } = data;
  const finals = last ? Object.keys(last.scores).length : 0;

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
              <p className="mb-5 flex h-20 items-center text-slate-600">
                {finals
                  ? `${finals} ${finals === 1 ? "game has a final score" : "games have final scores"}. Select Box score for the full stat lines.`
                  : "Scores show up once the stats are entered."}
              </p>
              <ScheduleDay day={last.day} teamIds={teamIds} showStats={false} scores={last.scores} gameIds={last.gameIds} fill compact />
            </>
          ) : (
            <p className="text-slate-600">Results will show up here after the first game day.</p>
          )}
        </div>
      </div>

      {last && last.top.length > 0 && (
        <div className="mt-10">
          <h3 className="mb-3 text-xl font-semibold">Last Week&apos;s Top Performers</h3>
          <ol className="grid gap-4 sm:grid-cols-3">
            {last.top.map((t, i) => (
              <li key={String(t.player.id)} className="flex items-center gap-4 rounded-md border border-slate-300 bg-white p-4">
                <span className="w-5 font-display text-3xl font-bold leading-none text-red-700">{i + 1}</span>
                <Face player={t.player} size={56} />
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold"><PlayerLink player={t.player} /></p>
                  <p className="text-[.9375rem]">{t.pts} pts, {t.reb} reb, {t.ast} ast</p>
                  <p className="text-[.9375rem] text-slate-600">
                    {t.team ? `${t.team.name}. ` : ""}
                    <Link href={`/game/${t.game}`} className="font-semibold underline decoration-slate-300 underline-offset-4 hover:text-red-700">Box score</Link>
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
