import Link from "next/link";
import { getRecaps, getSeasons } from "@/lib/directus";
import { Empty, Meta, Title } from "@/components/ui";

// Shows the newest season, so render per request instead of at build time.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [[season], [recap]] = await Promise.all([getSeasons(), getRecaps()]);
  if (!season) return <Empty title="No seasons yet">Add a season in Directus and it will appear here.</Empty>;

  return (
    <div className="py-6 sm:py-12">
      <Title>Crossroads Basketball League</Title>
      <Meta>
        Crossroads Basketball League plays Sundays from 5:30-8:30pm. Follow the schedule, rosters and player stats for every season. Showing {season.season_name}, the most recent season.
      </Meta>
      <div className="flex flex-wrap gap-4">
        <Link href={`/teams/${season.id}`} className="rounded bg-red-600 px-7 py-4 font-display text-2xl font-bold tracking-wide text-white hover:bg-red-700">
          {season.season_name} teams
        </Link>
        <Link href={`/players/${season.id}`} className="rounded bg-blue-900 px-7 py-4 font-display text-2xl font-bold tracking-wide text-white hover:bg-blue-800">
          {season.season_name} players
        </Link>
      </div>
      {recap && (
        <p className="mt-8 text-lg">
          <span className="text-slate-600">Latest recap: </span>
          <Link href={`/recaps/${recap.slug}`} className="font-semibold underline decoration-slate-300 underline-offset-4 hover:text-red-700">
            {recap.title}
          </Link>
        </p>
      )}
      <p className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
        <Link href="/schedule" className="font-semibold underline decoration-slate-300 underline-offset-4 hover:text-red-700">
          See the schedule
        </Link>
        <Link href="/records" className="font-semibold underline decoration-slate-300 underline-offset-4 hover:text-red-700">
          All-time records
        </Link>
        <Link href="/champions" className="font-semibold underline decoration-slate-300 underline-offset-4 hover:text-red-700">
          Past champions
        </Link>
        <Link href="/rules" className="font-semibold underline decoration-slate-300 underline-offset-4 hover:text-red-700">
          Rules &amp; guidelines
        </Link>
      </p>
    </div>
  );
}
