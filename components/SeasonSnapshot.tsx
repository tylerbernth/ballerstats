import Link from "next/link";
import { winPct } from "@/lib/stats";
import type { Snapshot } from "@/lib/snapshot";
import LeaderTabs from "./LeaderTabs";
import { TeamLink } from "./ui";

const linkClass = "font-semibold underline decoration-slate-300 underline-offset-4 hover:text-red-700 hover:decoration-red-600";

export default function SeasonSnapshot({ data }: { data: Snapshot }) {
  const { season, standings, leaders, minGp } = data;
  const played = standings.some((s) => s.w + s.l > 0);

  return (
    <section className="mt-14 border-t border-slate-300 pt-8">
      <h2 className="mb-6 font-display text-4xl font-bold text-blue-900">{season.season_name} So Far</h2>
      <div className="grid gap-x-10 gap-y-10 lg:grid-cols-2">
        {played && (
          <div>
            <h3 className="mb-3 text-xl font-semibold">Standings</h3>
            <div className="scroll">
              <table className="tbl">
                <thead>
                  <tr><th>Team</th><th>W</th><th>L</th><th>PCT</th></tr>
                </thead>
                <tbody>
                  {standings.map((s) => (
                    <tr key={String(s.team.id)}>
                      <td><TeamLink team={s.team} /></td>
                      <td className="font-bold">{s.w}</td>
                      <td>{s.l}</td>
                      <td>{winPct(s.w, s.l)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {leaders.length > 0 && (
          <div className={played ? "" : "lg:col-span-2"}>
            <h3 className="mb-3 text-xl font-semibold">Per-Game Leaders</h3>
            <LeaderTabs cats={leaders} seasonId={season.id} />
            <p className="mt-3 text-[.9375rem] text-slate-600">
              Players need at least {minGp} {minGp === 1 ? "game" : "games"} to qualify.{" "}
              <Link href={`/stats/${season.id}`} className={linkClass}>Full Stat Leaders</Link>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
