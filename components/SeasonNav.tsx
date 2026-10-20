"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Item = { id: string; name: string };

const SECTIONS = [
  { key: "teams", label: "Teams", segments: ["teams", "team"] },
  { key: "stats", label: "Stats", segments: ["stats"] },
  { key: "players", label: "Players", segments: ["players", "player"] },
];

export default function SeasonNav({ seasons }: { seasons: Item[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);
  const [segment, currentId] = pathname.split("/").filter(Boolean);

  useEffect(() => setOpen(null), [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <nav ref={ref} aria-label="Main" className="flex flex-1 gap-1">
      {SECTIONS.map((sec, i) => {
        const isCurrent = sec.segments.includes(segment);
        const isOpen = open === sec.key;
        return (
          <div
            key={sec.key}
            className="relative"
            onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(sec.key)}
            onPointerLeave={(e) => e.pointerType === "mouse" && setOpen((o) => (o === sec.key ? null : o))}
          >
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : sec.key)}
              className={`flex min-h-10 items-center gap-2 rounded px-3.5 font-semibold ${
                isCurrent ? "bg-red-600 text-white" : isOpen ? "bg-white/15 text-white" : "text-blue-100 hover:bg-white/15 hover:text-white"
              }`}
            >
              {sec.label}
              <span aria-hidden className="mb-1 size-1.5 rotate-45 border-b-2 border-r-2 border-current" />
            </button>
            {isOpen && (
              <div
                className={`absolute top-full z-20 max-h-[70vh] min-w-48 overflow-auto rounded-md border border-slate-300 bg-white p-1 ${
                  i === SECTIONS.length - 1 ? "right-0 sm:left-0 sm:right-auto" : "left-0"
                }`}
              >
                {seasons.map((s) => (
                  <Link
                    key={s.id}
                    href={`/${sec.key}/${s.id}`}
                    aria-current={segment === sec.key && currentId === s.id ? "page" : undefined}
                    className="block rounded px-3.5 py-2.5 font-semibold text-slate-900 hover:bg-blue-100 hover:text-blue-900 aria-[current=page]:bg-blue-900 aria-[current=page]:text-white"
                  >
                    {s.name}
                  </Link>
                ))}
                {seasons.length === 0 && <p className="px-3.5 py-2.5 text-slate-600">No seasons yet</p>}
              </div>
            )}
          </div>
        );
      })}
      <Link
        href="/schedule"
        className={`flex min-h-10 items-center rounded px-3.5 font-semibold ${
          pathname.startsWith("/schedule") ? "bg-red-600 text-white" : "text-blue-100 hover:bg-white/15 hover:text-white"
        }`}
      >
        Schedule
      </Link>
    </nav>
  );
}
