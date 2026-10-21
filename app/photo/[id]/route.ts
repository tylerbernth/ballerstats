// Proxies Directus images at their natural shape (used for team photos).
export const dynamic = "force-dynamic";

const WIDTHS = [480, 960, 1600];

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const base = (process.env.DIRECTUS_URL ?? "").replace(/\/$/, "");
  if (!base || !/^[\w-]+$/.test(id)) return new Response("Bad request", { status: 400 });

  const wanted = Number(new URL(req.url).searchParams.get("w")) || 960;
  const width = WIDTHS.find((w) => w >= wanted) ?? 1600;
  const headers: Record<string, string> = process.env.DIRECTUS_TOKEN ? { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` } : {};
  const get = (qs: string) => fetch(`${base}/assets/${id}${qs}`, { headers, cache: "no-store" });

  let upstream = await get(`?width=${width}&fit=inside&withoutEnlargement=true&format=webp&quality=82`);
  if (!upstream.ok) upstream = await get("");
  if (!upstream.ok) {
    return new Response(
      `Directus returned ${upstream.status} for file ${id}. If this is 401 or 403, give the role read access to directus_files.`,
      { status: upstream.status, headers: { "Cache-Control": "no-store" } },
    );
  }
  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/webp",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
