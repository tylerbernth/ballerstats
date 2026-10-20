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
