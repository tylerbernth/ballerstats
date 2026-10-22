"use client";

import { useEffect, useState } from "react";

export default function Countdown({ target }: { target: number }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Reserve the space so the page does not jump when the countdown appears.
  if (now === null) return <div className="mb-5 h-14" aria-hidden />;

  const ms = target - now;
  if (ms <= 0) return <p className="mb-5 flex h-14 items-center text-xl font-semibold text-red-700">Games are underway</p>;

  const parts = [
    [Math.floor(ms / 864e5), "day"],
    [Math.floor((ms % 864e5) / 36e5), "hour"],
    [Math.floor((ms % 36e5) / 6e4), "minute"],
  ] as const;
  const shown = parts.filter(([n], i) => n > 0 || i === 2 || parts.slice(0, i).some(([x]) => x > 0));

  return (
    <p className="mb-5 flex h-14 flex-wrap items-baseline gap-x-5" aria-label={`Next games in ${shown.map(([n, u]) => `${n} ${u}${n === 1 ? "" : "s"}`).join(", ")}`}>
      {shown.map(([n, u]) => (
        <span key={u} className="flex items-baseline gap-1.5">
          <span className="font-display text-5xl font-bold leading-none tabular-nums text-blue-900">{n}</span>
          <span className="text-slate-600">{u}{n === 1 ? "" : "s"}</span>
        </span>
      ))}
    </p>
  );
}
