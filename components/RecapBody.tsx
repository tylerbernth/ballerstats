import Link from "next/link";
import { Fragment } from "react";
import { displayName } from "@/lib/format";
import { parseRecap } from "@/lib/recap";
import type { Player } from "@/lib/types";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const linkClass = "underline decoration-slate-300 underline-offset-4 hover:text-red-700 hover:decoration-red-600";

export default function RecapBody({ content, players }: { content: string; players: Player[] }) {
  const sections = parseRecap(content);

  // Player names in the text become links to their pages; web addresses become links too.
  const ids = new Map(players.map((p) => [displayName(p), p.id] as const).filter(([name]) => name.length > 3));
  const names = [...ids.keys()].sort((a, b) => b.length - a.length).map(esc);
  const parts = [names.length ? `(?<!\\w)(?:${names.join("|")})(?!\\w)` : "", "(?:https?:\\/\\/|www\\.)[^\\s]+"].filter(Boolean);
  const re = new RegExp(`(${parts.join("|")})`, "g");

  const inline = (text: string) =>
    text.split(re).map((chunk, i) => {
      if (i % 2 === 0) return chunk;
      const id = ids.get(chunk);
      if (id !== undefined) {
        return (
          <Link key={i} href={`/player/${id}`} className={linkClass}>
            {chunk}
          </Link>
        );
      }
      const trail = chunk.match(/[).,;:!?]+$/)?.[0] ?? "";
      const url = trail ? chunk.slice(0, -trail.length) : chunk;
      return (
        <Fragment key={i}>
          <a href={url.startsWith("http") ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {url}
          </a>
          {trail}
        </Fragment>
      );
    });

  return (
    <div>
      {sections.map((s, i) => {
        const blocks = s.blocks.map((b, j) => (
          <p
            key={j}
            className={b.kind === "game" ? "pt-2 font-semibold" : b.kind === "stats" ? "-mt-2 text-[.9375rem] text-slate-600" : undefined}
          >
            {inline(b.text)}
          </p>
        ));
        if (!s.heading) {
          return (
            <div key={i} className={`max-w-prose space-y-4 py-6 ${s.signature ? "border-t border-slate-300 text-[.9375rem] text-slate-600" : ""}`}>
              {blocks}
            </div>
          );
        }
        return (
          <section key={i} className="grid gap-x-12 gap-y-3 border-t border-slate-300 py-8 md:grid-cols-[13rem_1fr]">
            <h2 className="font-display text-3xl font-bold text-blue-900">{s.heading}</h2>
            <div className="max-w-prose space-y-4">{blocks}</div>
          </section>
        );
      })}
    </div>
  );
}
