import type { Metadata } from "next";
import Link from "next/link";
import { getRecaps, getSeasons } from "@/lib/directus";
import { same } from "@/lib/format";
import { recapDate } from "@/lib/recap";
import { Empty, H2, Meta, Title } from "@/components/ui";

export const metadata: Metadata = {
  title: "Weekly recaps",
  description: "Weekly recaps, shoutouts and fun stats from the Crossroads Basketball League.",
};

export default async function RecapsPage() {
  const [recaps, seasons] = await Promise.all([getRecaps(), getSeasons()]);
  const groups = seasons.map((s) => ({ name: s.season_name, items: recaps.filter((r) => same(r.season, s.id)) })).filter((g) => g.items.length);
  const loose = recaps.filter((r) => !seasons.some((s) => same(s.id, r.season)));
  if (loose.length) groups.push({ name: "Other", items: loose });

  return (
    <>
      <Title>Weekly recaps</Title>
      <Meta>Game recaps, shoutouts and fun stats, newest first.</Meta>
      {groups.length ? (
        groups.map((g) => (
          <section key={g.name}>
            <H2>{g.name}</H2>
            <ul>
              {g.items.map((r) => (
                <li key={String(r.id)} className="border-t border-slate-200 py-4 first:border-t-0">
                  <Link href={`/recaps/${r.slug}`} className="text-xl font-semibold underline decoration-slate-300 underline-offset-4 hover:text-red-700 hover:decoration-red-600">
                    {r.title}
                  </Link>
                  <p className="text-[.9375rem] text-slate-600">{recapDate(r.date_created)}</p>
                  {r.summary && <p className="mt-1 max-w-prose">{r.summary}</p>}
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <Empty title="No recaps yet">Published recaps will show up here.</Empty>
      )}
    </>
  );
}
