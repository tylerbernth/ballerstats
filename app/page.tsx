import Link from "next/link";
import { getSeasons } from "@/lib/directus";
import { Empty, Meta, Title } from "@/components/ui";

// Shows the newest season, so render per request instead of at build time.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [season] = await getSeasons();
  if (!season) return <Empty title="No seasons yet">Add a season in Directus and it will appear here.</Empty>;

  return (
    <div className="py-6 sm:py-12">
      <Title>Xroads basketball league</Title>
      <Meta>Standings, rosters and player stats. Showing {season.season_name}, the most recent season.</Meta>
      <div className="flex flex-wrap gap-4">
        <Link href={`/teams/${season.id}`} className="rounded bg-red-600 px-7 py-4 font-display text-2xl font-bold tracking-wide text-white hover:bg-red-700">
          {season.season_name} teams
        </Link>
        <Link href={`/players/${season.id}`} className="rounded bg-blue-900 px-7 py-4 font-display text-2xl font-bold tracking-wide text-white hover:bg-blue-800">
          {season.season_name} players
        </Link>
      </div>
      <p className="mt-8">
        <Link href="/schedule" className="font-semibold underline decoration-slate-300 underline-offset-4 hover:text-red-700">
          See the schedule
        </Link>
      </p>
    </div>
  );
}
