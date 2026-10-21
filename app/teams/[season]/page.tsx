import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeasons, getTeams } from "@/lib/directus";
import { same } from "@/lib/format";
import { Empty, Meta, TeamPhoto, Title } from "@/components/ui";

export default async function TeamsPage({ params }: { params: Promise<{ season: string }> }) {
  const { season } = await params;
  const s = (await getSeasons()).find((x) => same(x.id, season));
  if (!s) notFound();

  const teams = (await getTeams(s.id)).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <Title>{s.season_name} teams</Title>
      <Meta>
        {teams.length} {teams.length === 1 ? "team" : "teams"}. Select a team for its roster and stats.
      </Meta>
      {teams.length ? (
        <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <li key={String(t.id)}>
              <Link href={`/team/${t.id}`} className="group flex flex-col gap-3">
                <TeamPhoto team={t} className="aspect-[4/3] w-full rounded-md" />
                <span className="text-xl font-semibold underline decoration-transparent underline-offset-4 group-hover:text-red-700 group-hover:decoration-red-600">
                  {t.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty title="No teams in this season yet">Check back once rosters are set.</Empty>
      )}
    </>
  );
}
