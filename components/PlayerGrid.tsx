"use client";

import Link from "next/link";
import { useState } from "react";
import { Face } from "./ui";

export type PlayerCard = { id: string; name: string; headshot: string | null };

export default function PlayerGrid({ players, seasonId }: { players: PlayerCard[]; seasonId: string }) {
  const [q, setQ] = useState("");
  const list = players.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <label className="mb-10 flex max-w-sm flex-col gap-1.5 font-semibold">
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
        <ul className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {list.map((p) => (
            <li key={p.id}>
              <Link href={`/player/${p.id}?season=${seasonId}`} className="group flex flex-col items-center gap-3 text-center">
                <span className="w-full max-w-56">
                  <Face player={p} size={192} fluid />
                </span>
                <span className="text-lg font-semibold underline decoration-transparent underline-offset-4 group-hover:text-red-700 group-hover:decoration-red-600">
                  {p.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-slate-600">
          <strong className="text-slate-900">No player matches &quot;{q}&quot;.</strong> Check the spelling or clear the search.
        </p>
      )}
    </>
  );
}
