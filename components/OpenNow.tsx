import Link from "next/link";
import type { Announcement } from "@/lib/directus";

const LA = "America/Los_Angeles";
const day = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: LA });

const linkClass =
  "font-semibold text-blue-900 underline decoration-slate-300 underline-offset-4 hover:text-red-700 hover:decoration-red-600";

// A few short-lived links (voting, signups) for the home page. Each one carries its end date.
export default function OpenNow({ items }: { items: Announcement[] }) {
  if (!items.length) return null;
  const today = day(new Date());

  return (
    <section aria-labelledby="open-now" className="mt-8">
      <h2 id="open-now" className="font-display text-2xl font-bold text-blue-900">
        Open now
      </h2>
      <ul className="mt-2 max-w-2xl divide-y divide-slate-200 border-y border-slate-200">
        {items.map((a) => {
          const ends = day(new Date(a.ends_at));
          return (
            <li key={String(a.id)} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
              <span>
                {/^https?:/i.test(a.url) ? (
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    {a.label}
                  </a>
                ) : (
                  <Link href={a.url} className={linkClass}>
                    {a.label}
                  </Link>
                )}
                {a.note && <span className="ml-2 text-slate-600">{a.note}</span>}
              </span>
              <span className="text-sm tabular-nums text-slate-600">{ends === today ? "Ends today" : `Ends ${ends}`}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
