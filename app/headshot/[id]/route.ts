// Proxies Directus assets so the token stays on the server and headshots work
// even when directus_files is not public.
export const dynamic = "force-dynamic";

const SIZES = [96, 192, 384, 640];

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const base = (process.env.DIRECTUS_URL ?? "").replace(/\/$/, "");
  if (!base || !/^[\w-]+$/.test(id)) return new Response("Bad request", { status: 400 });

  // Snap to a few sizes so every list and page asks Directus for the same handful of images.
  const wanted = Number(new URL(req.url).searchParams.get("w")) || 192;
  const size = SIZES.find((s) => s >= wanted) ?? 640;
  const headers: Record<string, string> = process.env.DIRECTUS_TOKEN ? { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` } : {};
  const get = (qs: string) => fetch(`${base}/assets/${id}${qs}`, { headers, cache: "no-store" });

  // Try a resized copy first; if Directus cannot transform the file, fall back to the original.
  let upstream = await get(`?width=${size}&height=${size}&fit=cover&format=webp`);
  if (!upstream.ok) upstream = await get("");
  if (!upstream.ok) {
    return new Response(
      `Directus returned ${upstream.status} for file ${id}. If this is 401 or 403, give the role read access to directus_files.`,
      { status: upstream.status, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Only successful images are cached by the browser, so a past failure never sticks.
  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/webp",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
