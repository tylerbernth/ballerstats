import { notFound, permanentRedirect, redirect } from "next/navigation";
import { getRecaps, getSeasons } from "@/lib/directus";

// Catches single-segment addresses from the old WordPress site, such as /season-10-players/.
// Real pages (/rules, /schedule, ...) win over this route automatically.
export default async function LegacyPage({ params }: { params: Promise<{ slug: string }> }) {
  const key = (await params).slug.toLowerCase();
  const seasons = await getSeasons();

  const m = key.match(/^season-(\d+)-(players|teams)$/);
  if (m) {
    const s = seasons.find((x) => x.season_name.toLowerCase().replace(/\s+/g, " ").trim() === `season ${m[1]}`);
    if (s) permanentRedirect(`/${m[2]}/${s.id}`);
  }
  if (key === "rules-guidelines") permanentRedirect("/rules");
  if (key === "all-players" && seasons[0]) redirect(`/players/${seasons[0].id}`);
  // Old recap posts: if a recap with the same slug was imported, send visitors (and Google) to it.
  const recap = (await getRecaps()).find((r) => r.slug?.toLowerCase() === key);
  if (recap) permanentRedirect(`/recaps/${recap.slug}`);
  notFound();
}
