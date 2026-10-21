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

const LINKS = [
  { href: "/schedule", label: "Schedule" },
  { href: "/records", label: "Records" },
  { href: "/rules", label: "Rules" },
];

const Chevron = ({ open }: { open?: boolean }) => (
  <span aria-hidden className={`mb-1 size-1.5 border-b-2 border-r-2 border-current transition-transform ${open ? "-rotate-135 mt-1 mb-0" : "rotate-45"}`} />
);

export default function SeasonNav({ seasons }: { seasons: Item[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null); // desktop dropdown
  const [menu, setMenu] = useState(false); // mobile menu
  const [group, setGroup] = useState<string | null>(null); // mobile expanded section
  const ref = useRef<HTMLElement>(null);
  const [segment, currentId] = pathname.split("/").filter(Boolean);

  useEffect(() => {
    setOpen(null);
    setMenu(false);
    setGroup(null);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setMenu(false);
      }
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const linkClass = (active: boolean) =>
    `flex min-h-10 items-center rounded px-3.5 font-semibold ${active ? "bg-red-600 text-white" : "text-blue-100 hover:bg-white/15 hover:text-white"}`;

  return (
    <>
      {/* Desktop: dropdowns */}
      <nav ref={ref} aria-label="Main" className="hidden flex-1 gap-1 lg:flex">
        {SECTIONS.map((sec) => {
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
                <Chevron />
              </button>
              {isOpen && (
                <div className="absolute left-0 top-full z-20 max-h-[70vh] min-w-48 overflow-auto rounded-md border border-slate-300 bg-white p-1">
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
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={linkClass(pathname.startsWith(l.href))}>
            {l.label}
          </Link>
        ))}
      </nav>

      {/* Mobile and tablet: one Menu button that opens a full-width list */}
      <button
        type="button"
        aria-expanded={menu}
        aria-controls="mobile-nav"
        onClick={() => setMenu((m) => !m)}
        className="ml-auto flex min-h-10 items-center gap-2.5 rounded px-3.5 font-semibold text-white hover:bg-white/15 lg:hidden"
      >
        {menu ? "Close" : "Menu"}
        <span aria-hidden className="grid w-5 gap-1">
          {menu ? (
            <>
              <i className="block h-0.5 translate-y-[3px] rotate-45 bg-current" />
              <i className="block h-0.5 -translate-y-[3px] -rotate-45 bg-current" />
            </>
          ) : (
            <>
              <i className="block h-0.5 bg-current" />
              <i className="block h-0.5 bg-current" />
              <i className="block h-0.5 bg-current" />
            </>
          )}
        </span>
      </button>

      {menu && (
        <nav id="mobile-nav" aria-label="Main" className="basis-full border-t border-white/20 pb-2 pt-2 lg:hidden">
          <ul>
            {SECTIONS.map((sec) => {
              const isCurrent = sec.segments.includes(segment);
              const expanded = group === sec.key;
              return (
                <li key={sec.key}>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setGroup(expanded ? null : sec.key)}
                    className={`flex min-h-12 w-full items-center justify-between rounded px-3 text-lg font-semibold ${isCurrent ? "text-white" : "text-blue-100"}`}
                  >
                    <span className={isCurrent ? "border-b-2 border-red-500 pb-0.5" : ""}>{sec.label}</span>
                    <Chevron open={expanded} />
                  </button>
                  {expanded && (
                    <ul className="mb-2 ml-4 border-l border-white/25 pl-3">
                      {seasons.map((s) => (
                        <li key={s.id}>
                          <Link
                            href={`/${sec.key}/${s.id}`}
                            aria-current={segment === sec.key && currentId === s.id ? "page" : undefined}
                            className="block min-h-11 rounded px-3 py-2.5 text-blue-100 hover:bg-white/15 aria-[current=page]:bg-white aria-[current=page]:font-semibold aria-[current=page]:text-blue-900"
                          >
                            {s.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`flex min-h-12 items-center rounded px-3 text-lg font-semibold ${pathname.startsWith(l.href) ? "text-white" : "text-blue-100"}`}
                >
                  <span className={pathname.startsWith(l.href) ? "border-b-2 border-red-500 pb-0.5" : ""}>{l.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
