// Proxies Directus assets so the token stays on the server and headshots work
// even when directus_files is not public.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const base = (process.env.DIRECTUS_URL ?? "").replace(/\/$/, "");
  if (!base || !/^[\w-]+$/.test(id)) return new Response("Bad request", { status: 400 });

  const size = Math.min(Math.max(Number(new URL(req.url).searchParams.get("w")) || 240, 32), 640);
  const upstream = await fetch(`${base}/assets/${id}?width=${size}&height=${size}&fit=cover&format=webp`, {
    headers: process.env.DIRECTUS_TOKEN ? { Authorization: `Bearer ${process.env.DIRECTUS_TOKEN}` } : {},
    next: { revalidate: 86400 },
  });
  if (!upstream.ok) return new Response("Not found", { status: 404 });

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/webp",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
