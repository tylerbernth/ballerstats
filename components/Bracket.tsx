import Link from "next/link";
import type { ReactNode } from "react";
import { TeamLink } from "./ui";
import type { BracketData, Matchup, Slot } from "@/lib/bracket";

function Row({ s }: { s: Slot }) {
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4 ${s.won ? "font-bold" : s.lost ? "text-slate-500" : ""}`}>
      <span className="w-4 shrink-0 text-right text-sm tabular-nums text-slate-600">{s.seed ?? ""}</span>
      <span className="min-w-0 flex-1 leading-snug">
        {s.team ? <TeamLink team={s.team} /> : <span className="font-normal text-slate-600">{s.label}</span>}
      </span>
      {s.pts != null && <span className="tabular-nums">{s.pts}</span>}
    </div>
  );
}

function Match({ m }: { m: Matchup }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-300 bg-white">
      <Row s={m.a} />
      <div className="border-t border-slate-200">
        <Row s={m.b} />
      </div>
      {m.gameId && (
        <div className="border-t border-slate-200 px-3 py-1.5 text-right text-sm sm:px-4">
          <Link href={`/game/${m.gameId}`} className="font-semibold text-blue-900 hover:text-red-700 hover:underline">
            Box score
          </Link>
        </div>
      )}
    </div>
  );
}

// Small round name above a matchup, used in the phone layout.
function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="h-8 pt-2 text-sm leading-6 text-slate-600">{label}</p>
      {children}
    </div>
  );
}

// One child of a matchup in the phone layout: a rail down the left side with a short stub into the child.
// The rail starts right under the parent's box and, for the last child, stops at the stub.
function Branch({ children }: { children: ReactNode }) {
  return (
    <div className="relative pb-2 pl-6 before:absolute before:left-2 before:top-0 before:h-full before:border-l-2 before:border-slate-300 after:absolute after:left-2 after:top-5 after:w-3 after:border-t-2 after:border-slate-300 last:pb-0 last:before:h-5">
      {children}
    </div>
  );
}

const heading = "pb-3 text-xl font-semibold";
const cell = "self-center py-3";

// The playoff bracket for the home page.
//
// Large screens: three round columns with connector columns between them. The matchups sit in two equal
// rows, so each line meets the middle of the boxes it joins.
//
// Phones: a vertical tree with the final at the top, the semifinals under it, and each semifinal's
// first-round game under that. The first-round games join the tree once both are done, because only then is
// it known which semifinal each winner plays in; until then they are listed below the tree.
export default function Bracket({ data }: { data: BracketData }) {
  const [r1Top, r1Bottom] = data.first;
  const [semiTop, semiBottom] = data.semis;

  return (
    <section className="mt-14 border-t border-slate-300 pt-8">
      <h2 className="mb-2 font-display text-4xl font-bold text-blue-900">Playoffs</h2>
      <p className="mb-6 text-slate-600">
        {data.champion ? (
          <>
            Champion: <span className="font-semibold text-slate-900">{data.champion.name}</span>
          </>
        ) : (
          "Seeds 1 and 2 have a first-round bye."
        )}
      </p>

      {/* Large screens */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-[1fr_2.5rem_1fr_2.5rem_1fr] grid-rows-[auto_1fr_1fr]">
          <h3 className={`${heading} col-start-1 row-start-1`}>First round</h3>
          <div className={`${cell} col-start-1 row-start-2`}>
            <Match m={r1Top} />
          </div>
          <div className={`${cell} col-start-1 row-start-3`}>
            <Match m={r1Bottom} />
          </div>

          <h3 className={`${heading} col-start-3 row-start-1`}>Semifinals</h3>
          <div className={`${cell} col-start-3 row-start-2`}>
            <Match m={semiTop} />
          </div>
          <div className={`${cell} col-start-3 row-start-3`}>
            <Match m={semiBottom} />
          </div>

          <h3 className={`${heading} col-start-5 row-start-1`}>Final</h3>
          <div className="col-start-5 row-span-2 row-start-2 self-center">
            <Match m={data.final} />
          </div>

          {/* First round to semifinals: drawn once both first-round games are done. */}
          {data.linked && (
            <>
              <div aria-hidden="true" className="col-start-2 row-start-2 self-center border-t-2 border-slate-300" />
              <div aria-hidden="true" className="col-start-2 row-start-3 self-center border-t-2 border-slate-300" />
            </>
          )}

          {/* Semifinals to final: always the same two games. */}
          <div aria-hidden="true" className="relative col-start-4 row-span-2 row-start-2">
            <span className="absolute left-0 top-1/4 w-1/2 border-t-2 border-slate-300" />
            <span className="absolute left-0 top-3/4 w-1/2 border-t-2 border-slate-300" />
            <span className="absolute left-1/2 top-1/4 h-1/2 border-l-2 border-slate-300" />
            <span className="absolute left-1/2 top-1/2 w-1/2 border-t-2 border-slate-300" />
          </div>
        </div>
      </div>

      {/* Phones and tablets */}
      <div className="lg:hidden">
        <Labeled label="Final">
          <Match m={data.final} />
        </Labeled>
        <div>
          {data.semis.map((m, i) => (
            <Branch key={i}>
              <Labeled label="Semifinal">
                <Match m={m} />
              </Labeled>
              {data.linked && (
                <Branch>
                  <Labeled label="First round">
                    <Match m={data.first[i]} />
                  </Labeled>
                </Branch>
              )}
            </Branch>
          ))}
        </div>
        {!data.linked && (
          <div className="mt-2">
            {data.first.map((m, i) => (
              <Labeled key={i} label="First round">
                <Match m={m} />
              </Labeled>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 max-w-sm">
        <h3 className="mb-3 text-xl font-semibold">Losers game</h3>
        <Match m={data.losers} />
      </div>
    </section>
  );
}