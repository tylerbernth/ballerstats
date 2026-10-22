import { notFound, redirect } from "next/navigation";
import { getSeasons } from "@/lib/directus";

// Old address /stats/ goes to the newest season.
export default async function Index() {
  const [latest] = await getSeasons();
  if (!latest) notFound();
  redirect(`/stats/${latest.id}`);
}
