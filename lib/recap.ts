import type { ID, Recap } from "./types";

export type Block = { text: string; kind: "plain" | "game" | "stats" };
export type Section = { heading: string | null; blocks: Block[]; signature: boolean };

// The content field may hold plain text (like the weekly email) or HTML saved by Directus's editor.
// HTML is flattened to text on purpose, so nothing from the field is ever inserted into the page as markup.
export function toPlain(content: string): string {
  if (!/<\/?[a-z][^>]*>/i.test(content)) return content;
  return content
    .replace(/<hr\s*\/?>/gi, "\n---\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#(39|x27);/g, "'")
    .replace(/&rsquo;/g, "’")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

const kindOf = (line: string): Block["kind"] =>
  /^stats\s*[-–:]/i.test(line) ? "stats" : /^\d{1,2}(:\d{2})?\s*(am|pm)\b/i.test(line) ? "game" : "plain";

// Sections are separated by lines of "---". A first line ending in ":" becomes the section heading.
export function parseRecap(raw: string): Section[] {
  const chunks = toPlain(raw).replace(/\r\n?/g, "\n").split(/^[ \t]*-{2,}[ \t]*$/m);
  const sections = chunks
    .map((chunk) => {
      const lines = chunk.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
      let heading: string | null = null;
      if (lines.length > 1 && /^[^.!?]{2,60}:$/.test(lines[0])) heading = lines.shift()!.slice(0, -1);
      return { heading, blocks: lines.map((text) => ({ text, kind: kindOf(text) })), signature: false };
    })
    .filter((s) => s.heading || s.blocks.length);
  const last = sections[sections.length - 1];
  if (sections.length > 1 && last && !last.heading && last.blocks.length <= 3) last.signature = true;
  return sections;
}

// Ids of the players tagged on a recap. Handles the many-to-many rows however the junction fields are named.
export function recapPlayerIds(r: Recap): string[] {
  const ids: string[] = [];
  for (const row of r.players ?? []) {
    if (!row || typeof row !== "object") continue;
    const hit = Object.entries(row as Record<string, unknown>).find(([k]) => /players?_id$/.test(k));
    const v = hit?.[1];
    const id = v && typeof v === "object" ? (v as { id?: ID }).id : (v as ID | undefined);
    if (id != null) ids.push(String(id));
  }
  return ids;
}

export const recapDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" }) : "";
