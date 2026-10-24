"use client";

import { useState } from "react";
import type { LeaderCat } from "@/lib/snapshot";
import type { ID } from "@/lib/types";
import { PlayerLink } from "./ui";

const shown = (v: number) => v.toFixed(1);

// One stat at a time: tabs for the categories and a single list below, instead of five separate boxes.
export default function LeaderTabs({ cats, seasonId }: { cats: LeaderCat[]; seasonId: ID }) {
  const [key, setKey] = useState(cats[0]?.key);
  const cat = cats.find((c) => c.key === key) ?? cats[0];
  if (!cat) return null;

  // Players on the same displayed number share a rank: 1, T2, T2, 4.
  const rows = cat.rows.map((r) => {
    const same = cat.rows.filter((x) => shown(x.v) === shown(r.v)).length;
    return { ...r, rank: cat.rows.findIndex((x) => shown(x.v) === shown(r.v)) + 1, tied: same > 1 };
  });

  return (
    <div>
      <div role="tablist" aria-label="Stat" className="mb-3 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c.key}
            role="tab"
            id={`leaders-tab-${c.key}`}
            aria-selected={c.key === cat.key}
            aria-controls="leaders-panel"
            onClick={() => setKey(c.key)}
            className="min-h-10 rounded border border-slate-300 bg-white px-3.5 font-semibold hover:bg-blue-100 aria-selected:border-blue-900 aria-selected:bg-blue-900 aria-selected:text-white"
          >
            {c.label}
          </button>
        ))}
      </div>

      <ol id="leaders-panel" role="tabpanel" aria-labelledby={`leaders-tab-${cat.key}`} className="overflow-hidden rounded-md border border-slate-300 bg-white">
        {rows.map((r) => (
          <li key={String(r.player.id)} className="flex items-baseline gap-3 border-t border-slate-200 px-4 py-3 first:border-t-0">
            <span className="w-7 shrink-0 tabular-nums text-slate-600">{r.tied ? `T${r.rank}` : r.rank}</span>
            <span className="min-w-0 flex-1 truncate font-semibold [&_a]:no-underline [&_a:hover]:text-red-700 [&_a:hover]:underline">
              <PlayerLink player={r.player} season={seasonId} />
            </span>
            <span className={`tabular-nums ${r.rank === 1 ? "font-bold text-red-700" : ""}`}>{shown(r.v)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
