import Link from "next/link";
import { getRecaps, getSeasons } from "@/lib/directus";
import SeasonSnapshot from "@/components/SeasonSnapshot";
import ThisWeek from "@/components/ThisWeek";
import { Empty, Meta, Title } from "@/components/ui";
import { getSnapshot } from "@/lib/snapshot";
import { getThisWeek } from "@/lib/thisweek";

// Shows the newest season, so render per request instead of at build time.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [[season], [recap], week] = await Promise.all([getSeasons(), getRecaps(), getThisWeek()]);
  if (!season) return <Empty title="No seasons yet">Add a season and it will appear here.</Empty>;
  const snapshot = await getSnapshot(season);

  return (
    <div className="py-6 sm:py-12">
      <Title>Crossroads Basketball League</Title>
      <Meta>
        Crossroads Basketball League plays Sundays from 5:30-8:30pm. Follow the schedule, rosters and player stats for every season.
      </Meta>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:gap-8">
        <div className="flex flex-wrap items-center gap-4">
          <Link href={`/teams/${season.id}`} className="rounded bg-red-600 px-7 py-4 font-display text-2xl font-bold tracking-wide text-white hover:bg-red-700">
            {season.season_name} Teams
          </Link>
          <Link href={`/players/${season.id}`} className="rounded bg-blue-900 px-7 py-4 font-display text-2xl font-bold tracking-wide text-white hover:bg-blue-800">
            {season.season_name} Players
          </Link>
        </div>

        {/* Plain text link: the bordered, shadowed box around it competed with the buttons. */}
        {recap && (
          <p className="text-slate-700 md:pb-4">
            <span className="text-slate-600">Latest recap: </span>
            <Link
              href={`/recaps/${recap.slug}`}
              className="font-semibold text-blue-900 underline decoration-slate-300 underline-offset-4 hover:text-red-700 hover:decoration-red-600"
            >
              {recap.title}
            </Link>
          </p>
        )}
      </div>

      {week && <ThisWeek data={week} />}
      {snapshot && <SeasonSnapshot data={snapshot} />}
    </div>
  );
}
