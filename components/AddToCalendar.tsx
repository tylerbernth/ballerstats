"use client";

import { useEffect, useState } from "react";

type Team = { id: string; name: string };

const button =
  "inline-flex min-h-10 items-center rounded bg-blue-900 px-4 py-2 font-semibold text-white hover:bg-blue-800 aria-disabled:pointer-events-none aria-disabled:opacity-40";

export default function AddToCalendar({ teams }: { teams: Team[] }) {
  const single = teams.length === 1;
  const [id, setId] = useState(single ? teams[0].id : "");
  const [host, setHost] = useState("");
  useEffect(() => setHost(window.location.host), []);

  const ready = !!id && !!host;
  const feed = `${host}/calendar/${id}.ics`;
  const href = (kind: "apple" | "google" | "file") =>
    !ready ? undefined : kind === "apple" ? `webcal://${feed}` : kind === "google" ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(`webcal://${feed}`)}` : `/calendar/${id}.ics?download=1`;

  return (
    <div className="max-w-2xl">
      <p className="mb-2 font-semibold">{single ? "Add this team's games to your calendar" : "Add a team's games to your calendar"}</p>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        {!single && (
          <label className="flex flex-col gap-1 text-[.9375rem] text-slate-600">
            Team
            <select
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="min-h-10 min-w-56 rounded border border-slate-300 bg-white px-3 text-base text-slate-900"
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
        <div className="flex flex-wrap gap-2">
          <a href={href("apple")} aria-disabled={!ready} className={button}>Apple or Outlook</a>
          <a href={href("google")} target="_blank" rel="noopener noreferrer" aria-disabled={!ready} className={button}>Google Calendar</a>
          <a href={href("file")} aria-disabled={!ready} className={button}>Download file</a>
        </div>
      </div>
      <p className="mt-2 text-[.9375rem] text-slate-600">
        Apple, Outlook and Google keep the calendar updated when the schedule changes. Google can take a few hours to catch up.
      </p>
    </div>
  );
}
