"use client";

import Link from "next/link";
import { useState } from "react";
import { Face } from "./ui";

export type PlayerRow = {
  id: string;
  name: string;
  headshot: string | null;
  gp: number;
  pts: string;
  reb: string;
  ast: string;
};

export default function PlayerTable({ rows, seasonId }: { rows: PlayerRow[]; seasonId: string }) {
  const [q, setQ] = useState("");
  const list = rows.filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <label className="mb-6 flex max-w-sm flex-col gap-1.5 font-semibold">
        Find a player
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name"
          className="min-h-10 rounded border border-slate-300 bg-white px-3 font-normal"
        />
      </label>
      {list.length ? (
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Player</th>
                <th>GP</th>
                <th>PTS</th>
                <th>REB</th>
                <th>AST</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className="flex items-center gap-3">
                      <Face player={r} />
                      <Link href={`/player/${r.id}?season=${seasonId}`}>{r.name}</Link>
                    </span>
                  </td>
                  <td>{r.gp || "-"}</td>
                  <td>{r.pts}</td>
                  <td>{r.reb}</td>
                  <td>{r.ast}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-6 text-slate-600">
          <strong className="text-slate-900">No player matches &quot;{q}&quot;.</strong> Check the spelling or clear the search.
        </p>
      )}
    </>
  );
}
