import { norm } from "./schedule";

// The JDI Sports channel (@JDISportsorg). Its game streams have the team names in their titles.
export const CHANNEL_ID = "UCLxgyDyqJRyaVC-TYCDVPxA";

export type Video = { id: string; title: string; published: string };

const decode = (s: string) =>
  s.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

// The channel's public feed: no key needed, but YouTube only includes the 15 newest videos.
export function parseFeed(xml: string): Video[] {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
    .map((m) => ({
      id: m[1].match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? "",
      title: decode(m[1].match(/<title>([^<]*)<\/title>/)?.[1] ?? ""),
      published: m[1].match(/<published>([^<]+)<\/published>/)?.[1] ?? "",
    }))
    .filter((v) => v.id && v.title);
}

async function fromFeed(): Promise<Video[]> {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`YouTube feed returned ${res.status}`);
  const videos = parseFeed(await res.text());
  if (!videos.length) throw new Error("YouTube feed returned no videos");
  return videos;
}

// With a free YouTube Data API key the whole upload history is available (the "UU" playlist holds a channel's uploads).
async function fromApi(key: string): Promise<Video[]> {
  const out: Video[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 4; page++) {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("playlistId", "UU" + CHANNEL_ID.slice(2));
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", key);
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`YouTube API returned ${res.status}`);
    const json = (await res.json()) as {
      nextPageToken?: string;
      items: { snippet: { title: string; publishedAt: string; resourceId: { videoId: string } } }[];
    };
    for (const it of json.items) {
      const { title, publishedAt, resourceId } = it.snippet;
      if (!/^(private|deleted) video$/i.test(title)) out.push({ id: resourceId.videoId, title, published: publishedAt });
    }
    pageToken = json.nextPageToken;
    if (!pageToken) break;
  }
  return out;
}

// Newest first. Never throws: no videos just means no Watch links. source says where they came from,
// and error says why the preferred source failed (shown by the troubleshooting page).
export async function getVideosWithSource(): Promise<{ videos: Video[]; source: "api" | "feed" | "none"; error?: string }> {
  const key = process.env.YOUTUBE_API_KEY;
  const problems: string[] = [];
  const describe = (e: unknown) => (e instanceof Error ? e.message : String(e));

  if (key) {
    try {
      return { videos: await fromApi(key), source: "api" };
    } catch (e) {
      problems.push(`API: ${describe(e)}`); // a bad key or quota problem falls back to the public feed
    }
  }
  try {
    return { videos: await fromFeed(), source: "feed", error: problems.join("; ") || undefined };
  } catch (e) {
    problems.push(`Feed: ${describe(e)}`);
    return { videos: [], source: "none", error: problems.join("; ") };
  }
}

export async function getVideos(): Promise<Video[]> {
  return (await getVideosWithSource()).videos;
}

const DAY = 86_400_000;
export const mentions = (title: string, names: string[]) => {
  const t = ` ${norm(title)} `;
  return names.some((n) => n && t.includes(` ${norm(n)} `));
};

// Finds the stream for a game: the title names both teams, and it was published near the game.
// With a game date the window is the day before to a week after; otherwise it uses the season's dates.
// With neither, nothing is matched, so a team's video from another season is never attached by mistake.
export function findVideo(
  videos: Video[],
  teamNames: string[],
  opponentNames: string[],
  when: { gameIso?: string | null; from?: number; to?: number },
  used?: Set<string>, // videos already given to another game
): Video | undefined {
  let from: number | undefined, to: number | undefined, anchor: number | undefined;
  if (when.gameIso) {
    anchor = Date.parse(when.gameIso + "T00:00:00Z");
    from = anchor - 1.5 * DAY;
    to = anchor + 8 * DAY;
  } else if (when.from != null && when.to != null) {
    from = when.from;
    to = when.to;
    anchor = from;
  }
  if (from == null || to == null || anchor == null || Number.isNaN(anchor)) return undefined;

  return videos
    .filter((v) => !used?.has(v.id) && mentions(v.title, teamNames) && mentions(v.title, opponentNames))
    .filter((v) => {
      const t = Date.parse(v.published);
      return t >= from! && t <= to!;
    })
    .sort((a, b) => Math.abs(Date.parse(a.published) - anchor!) - Math.abs(Date.parse(b.published) - anchor!))[0];
}