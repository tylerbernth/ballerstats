import { notFound, redirect } from "next/navigation";
import { getSeasons } from "@/lib/directus";

// Old address /teams/ goes to the newest season.
export default async function Index() {
  const [latest] = await getSeasons();
  if (!latest) notFound();
  redirect(`/teams/${latest.id}`);
}
