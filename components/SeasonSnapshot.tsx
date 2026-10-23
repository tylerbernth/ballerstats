import Link from "next/link";
import { winPct } from "@/lib/stats";
import type { Snapshot } from "@/lib/snapshot";
import { PlayerLink, TeamLink } from "./ui";

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
                      <td className="font-bold text-red-700">{s.w}</td>
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
            <div className="grid gap-4 sm:grid-cols-2">
              {leaders.map((c) => (
                <div key={c.key} className="rounded-md border border-slate-300 bg-white p-4">
                  <h4 className="mb-2 font-semibold text-blue-900">{c.label}</h4>
                  <ol className="space-y-1.5">
                    {c.rows.map((r, i) => (
                      <li key={String(r.player.id)} className="flex items-baseline gap-3">
                        <span className="w-4 text-slate-600 tabular-nums">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate"><PlayerLink player={r.player} season={season.id} /></span>
                        <span className={`tabular-nums ${i === 0 ? "font-bold text-red-700" : ""}`}>{r.v.toFixed(1)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
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
