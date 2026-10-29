"use client";

import { useEffect, useState } from "react";

// Shows a link to the channel's live stream while a game day is on: from shortly before the first game
// until the day counts as over. The address always opens whatever the channel is streaming right now.
export default function LiveLink({ opensAt, endsAt }: { opensAt: number; endsAt: number }) {
  const [live, setLive] = useState(false);

  useEffect(() => {
    const check = () => {
      const now = Date.now();
      setLive(now >= opensAt && now <= endsAt);
    };
    check();
    const id = setInterval(check, 15_000);
    return () => clearInterval(id);
  }, [opensAt, endsAt]);

  if (!live) return null;
  return (
    <a
      href="https://www.youtube.com/@JDISportsorg/live"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2.5 rounded bg-red-600 px-5 py-3 text-lg font-semibold text-white no-underline hover:bg-red-700"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current">
        <path d="M8 5v14l11-7z" />
      </svg>
      Watch live on YouTube
    </a>
  );
}
