"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type StatRow = {
  id: string; first: string; last: string; gp: number;
  pts: number; fg: number | null; tp: number | null; tpm: number; tpa: number; ft: number | null;
  ast: number; stl: number; blk: number; reb: number;
};
type Key = keyof StatRow;

const COLS: { k: Key; label: string; avg?: boolean; pct?: boolean; text?: boolean }[] = [
  { k: "last", label: "Last", text: true },
  { k: "first", label: "First", text: true },
  { k: "gp", label: "GP" },
  { k: "pts", label: "PTS", avg: true },
  { k: "fg", label: "FG%", pct: true },
  { k: "tp", label: "3P%", pct: true },
  { k: "tpm", label: "3PM", avg: true },
  { k: "tpa", label: "3PA", avg: true },
  { k: "ft", label: "FT%", pct: true },
  { k: "ast", label: "AST", avg: true },
  { k: "stl", label: "STL", avg: true },
  { k: "blk", label: "BLK", avg: true },
  { k: "reb", label: "REB", avg: true },
];

export default function StatsTable({ rows, seasonId }: { rows: StatRow[]; seasonId: string }) {
  const [mode, setMode] = useState<"total" | "avg">("total");
  const [sort, setSort] = useState<{ k: Key; dir: 1 | -1 }>({ k: "pts", dir: -1 });

  const val = (r: StatRow, k: Key): number | string | null => {
    const col = COLS.find((c) => c.k === k)!;
    const v = r[k];
    return mode === "avg" && col.avg && typeof v === "number" ? v / (r.gp || 1) : v;
  };

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const x = val(a, sort.k), y = val(b, sort.k);
        if (x == null && y == null) return 0;
        if (x == null) return 1;
        if (y == null) return -1;
        const c = typeof x === "string" ? x.localeCompare(y as string) : (x as number) - (y as number);
        return c * sort.dir || a.last.localeCompare(b.last);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, sort, mode],
  );

  const show = (r: StatRow, c: (typeof COLS)[number]) => {
    const v = val(r, c.k);
    if (v == null) return "-";
    if (c.pct) return `${(v as number).toFixed(1)}%`;
    return mode === "avg" && c.avg ? (v as number).toFixed(1) : String(v);
  };

  const toggle = (k: Key) =>
    setSort((s) => (s.k === k ? { k, dir: (s.dir * -1) as 1 | -1 } : { k, dir: COLS.find((c) => c.k === k)?.text ? 1 : -1 }));

  return (
    <>
      <div className="mb-4 flex" role="group" aria-label="Show stats as">
        {(["total", "avg"] as const).map((m, i) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={`min-h-10 border border-slate-300 bg-white px-4 font-semibold hover:bg-blue-100 aria-pressed:border-blue-900 aria-pressed:bg-blue-900 aria-pressed:text-white ${
              i === 0 ? "rounded-l" : "rounded-r"
            }`}
          >
            {m === "total" ? "Totals" : "Per game"}
          </button>
        ))}
      </div>
      <div className="scroll">
        <table className="tbl">
          <thead>
            <tr>
              {COLS.map((c) => (
                <th
                  key={c.k}
                  className={c.text ? "l" : ""}
                  aria-sort={sort.k === c.k ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
                >
                  <button type="button" onClick={() => toggle(c.k)} className="inline-flex items-center gap-1 font-semibold">
                    {c.label}
                    <span aria-hidden className="w-3 text-xs text-red-600">{sort.k === c.k ? (sort.dir === 1 ? "▲" : "▼") : ""}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id}>
                {COLS.map((c) =>
                  c.k === "last" ? (
                    <td key={c.k} className="l"><Link href={`/player/${r.id}?season=${seasonId}`}>{r.last || r.first}</Link></td>
                  ) : (
                    <td key={c.k} className={c.text ? "l" : c.k === "pts" ? "font-bold text-red-700" : ""}>{show(r, c)}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
