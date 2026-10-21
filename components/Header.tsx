import Link from "next/link";
import { connection } from "next/server";
import { getSeasons } from "@/lib/directus";
import SeasonNav from "./SeasonNav";

export default async function Header() {
  await connection(); // render at request time (the data itself is still cached for about a minute)
  // If Directus is unreachable the pages show the error state; the header still renders.
  const seasons = await getSeasons().catch(() => []);
  return (
    <header className="bg-blue-900 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-10 gap-y-1 px-4 py-2.5 sm:px-6 sm:py-3">
        <Link href="/" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.png" alt="Crossroads Basketball League stats, home" width={204} height={40} className="h-10 w-auto" />
        </Link>
        <SeasonNav seasons={seasons.map((s) => ({ id: String(s.id), name: s.season_name }))} />
      </div>
    </header>
  );
}
