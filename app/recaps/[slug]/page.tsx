import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RecapBody from "@/components/RecapBody";
import { Crumb, Face, photoSrc } from "@/components/ui";
import { getPlayers, getRecap, getSeasons } from "@/lib/directus";
import { displayName, same } from "@/lib/format";
import { recapDate, recapPlayerIds, toPlain } from "@/lib/recap";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const recap = await getRecap((await params).slug);
  if (!recap) return {};
  const fallback = toPlain(recap.content ?? "").replace(/\s+/g, " ").trim().slice(0, 155);
  return {
    title: recap.title,
    description: recap.summary || fallback || "Weekly recap from the Crossroads Basketball League.",
    openGraph: {
      type: "article",
      ...(recap.cover_image ? { images: [{ url: photoSrc(recap.cover_image, 960) }] } : {}),
    },
  };
}

export default async function RecapPage({ params }: { params: Promise<{ slug: string }> }) {
  const recap = await getRecap((await params).slug);
  if (!recap) notFound();

  const [seasons, players] = await Promise.all([getSeasons(), getPlayers()]);
  const season = seasons.find((s) => same(s.id, recap.season));
  const tagged = new Set(recapPlayerIds(recap));
  const mentioned = players.filter((p) => tagged.has(String(p.id)));

  return (
    <article>
      <Crumb href="/recaps">All recaps</Crumb>
      <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-tight text-blue-900 sm:text-6xl">{recap.title}</h1>
      <p className="mt-3 text-slate-600">
        {season ? `${season.season_name}, ` : ""}
        {recapDate(recap.date_created)}
      </p>
      {recap.summary && <p className="mt-6 max-w-prose text-xl text-slate-700">{recap.summary}</p>}
      {recap.cover_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoSrc(recap.cover_image, 1600)} alt="" className="mt-8 aspect-[21/9] w-full rounded-md bg-blue-100 object-cover" />
      )}

      <div className="mt-8">
        <RecapBody content={recap.content ?? ""} players={players} />
      </div>

      {mentioned.length > 0 && (
        <section className="border-t border-slate-300 pt-8">
          <h2 className="mb-4 font-display text-3xl font-bold text-blue-900">Players mentioned</h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {mentioned.map((p) => (
              <li key={String(p.id)}>
                <Link href={`/player/${p.id}`} className="flex items-center gap-2 font-semibold hover:text-red-700">
                  <Face player={p} size={32} />
                  {displayName(p)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
