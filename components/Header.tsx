import Link from "next/link";
import { getSeasons } from "@/lib/directus";
import SeasonNav from "./SeasonNav";

export default async function Header() {
  // If Directus is unreachable the pages show the error state; the header still renders.
  const seasons = await getSeasons().catch(() => []);
  return (
    <header className="bg-blue-900 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-10 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-3xl font-bold uppercase tracking-wide">
          Ballerstats
        </Link>
        <SeasonNav seasons={seasons.map((s) => ({ id: String(s.id), name: s.season_name }))} />
      </div>
    </header>
  );
}
