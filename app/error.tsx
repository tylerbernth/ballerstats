"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-10">
      <h1 className="mb-2 font-display text-4xl font-bold text-blue-900">Could not load stats</h1>
      <p className="mb-6 max-w-prose text-slate-600">
        Check that DIRECTUS_URL is correct and that the token or Public role can read the xroads_bball collections.
        {error.message ? ` (${error.message})` : ""}
      </p>
      <button onClick={reset} className="rounded bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700">
        Try again
      </button>
    </div>
  );
}
