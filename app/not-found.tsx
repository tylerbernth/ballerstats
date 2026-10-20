import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-10">
      <h1 className="mb-2 font-display text-4xl font-bold text-blue-900">Page not found</h1>
      <p className="text-slate-600">
        That season, team or player does not exist. <Link className="font-semibold underline" href="/">Go to the latest season</Link>.
      </p>
    </div>
  );
}
