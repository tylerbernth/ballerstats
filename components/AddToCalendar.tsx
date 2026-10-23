"use client";

import { useEffect, useRef, useState } from "react";

type Team = { id: string; name: string };

const action =
  "flex min-h-10 items-center justify-center rounded bg-blue-900 px-4 py-2 text-[.9375rem] font-semibold text-white hover:bg-blue-800 aria-disabled:pointer-events-none aria-disabled:opacity-40";

// A small button; the team picker and calendar options only open when it is clicked.
export default function AddToCalendar({ teams }: { teams: Team[] }) {
  const single = teams.length === 1;
  const [open, setOpen] = useState(false);
  const [id, setId] = useState(single ? teams[0].id : "");
  const [host, setHost] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setHost(window.location.host), []);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const ready = !!id && !!host;
  const feed = `${host}/calendar/${id}.ics`;
  const href = (kind: "apple" | "google" | "file") =>
    !ready
      ? undefined
      : kind === "apple"
        ? `webcal://${feed}`
        : kind === "google"
          ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(`webcal://${feed}`)}`
          : `/calendar/${id}.ics?download=1`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="calendar-options"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-10 items-center gap-2 rounded border border-blue-900 bg-white px-4 font-semibold text-blue-900 hover:bg-blue-50"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
        Add to calendar
      </button>

      {open && (
        <div
          id="calendar-options"
          className="absolute right-0 top-full z-10 mt-2 grid w-[min(22rem,calc(100vw-2rem))] gap-3 rounded-md border border-slate-300 bg-white p-4"
        >
          {single ? (
            <p className="font-semibold">{teams[0].name} games</p>
          ) : (
            <label className="grid gap-1 font-semibold">
              Team
              <select
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="min-h-10 rounded border border-slate-300 bg-white px-3 text-base font-normal text-slate-900"
              >
                <option value="">Choose a team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <a href={href("apple")} aria-disabled={!ready} className={action}>Apple or Outlook</a>
          <a href={href("google")} target="_blank" rel="noopener noreferrer" aria-disabled={!ready} className={action}>Google Calendar</a>
          <a href={href("file")} aria-disabled={!ready} className={action}>Download file</a>
          <p className="text-sm text-slate-600">Subscribed calendars update when the schedule changes. Google can take a few hours.</p>
        </div>
      )}
    </div>
  );
}
