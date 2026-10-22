import type { Metadata } from "next";
import { getPlayers, getSeasons, getTeams } from "@/lib/directus";
import { Empty, Meta, PlayerLink, TeamLink, TeamPhoto, Title } from "@/components/ui";

export const metadata: Metadata = {
  title: "Past champions",
  description: "Every Crossroads Basketball League champion, with runners-up and season MVPs.",
};

export default async function ChampionsPage() {
  const [seasons, teams, players] = await Promise.all([getSeasons(), getTeams(), getPlayers()]);
  const teamById = new Map(teams.map((t) => [String(t.id), t]));
  const playerById = new Map(players.map((p) => [String(p.id), p]));

  const rows = seasons
    .map((s) => ({
      s,
      champion: s.champion != null ? teamById.get(String(s.champion)) : undefined,
      runnerUp: s.runner_up != null ? teamById.get(String(s.runner_up)) : undefined,
      mvp: s.mvp != null ? playerById.get(String(s.mvp)) : undefined,
    }))
    .filter((r) => r.champion);

  return (
    <>
      <Title>Past champions</Title>
      <Meta>Every season&apos;s champion, newest first.</Meta>
      {rows.length ? (
        <ul>
          {rows.map(({ s, champion, runnerUp, mvp }) => (
            <li key={String(s.id)} className="grid gap-x-10 gap-y-4 border-t border-slate-300 py-8 sm:grid-cols-[15rem_1fr] sm:items-center">
              <TeamPhoto team={champion!} width={480} className="aspect-[4/3] w-full rounded-md" />
              <div>
                <h2 className="font-display text-3xl font-bold text-blue-900">{s.season_name}</h2>
                <p className="mt-1 text-2xl font-semibold">
                  <TeamLink team={champion} />
                </p>
                <dl className="mt-3 space-y-1 text-slate-600">
                  {runnerUp && (
                    <div className="flex gap-2">
                      <dt>Runner-up</dt>
                      <dd className="font-semibold text-slate-900"><TeamLink team={runnerUp} /></dd>
                    </div>
                  )}
                  {mvp && (
                    <div className="flex gap-2">
                      <dt>MVP</dt>
                      <dd className="font-semibold text-slate-900"><PlayerLink player={mvp} /></dd>
                    </div>
                  )}
                </dl>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty title="No champions yet">Add a champion to a season in Directus and it will show up here.</Empty>
      )}
    </>
  );
}
