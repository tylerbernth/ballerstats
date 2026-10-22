import type { ID, Player } from "./types";

export const same = (a?: ID | null, b?: ID | null) => a != null && b != null && String(a) === String(b);

export const displayName = (p?: Player | null) =>
  p ? p.name || [p.first_name, p.last_name].filter(Boolean).join(" ") || `Player ${p.id}` : "";

export const fmtDate = (d?: string | null) =>
  d
    ? new Date(d.slice(0, 10) + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

export function nameParts(p: Player) {
  if (p.first_name || p.last_name) return { first: p.first_name ?? "", last: p.last_name ?? "" };
  const bits = displayName(p).split(" ");
  return { first: bits.slice(0, -1).join(" "), last: bits.at(-1) ?? "" };
}

// Matches how the old WordPress site built its addresses: "Jackson's 5" -> "jacksons-5".
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
