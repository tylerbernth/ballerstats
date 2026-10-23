export const Dot = ({ dark }: { dark: boolean }) => (
  <i aria-hidden className={`inline-block size-3 shrink-0 rounded-full border-2 border-slate-800 ${dark ? "bg-slate-800" : "bg-white"}`} />
);

// Explains the filled and outlined dots next to team names.
export default function JerseyKey({ className = "" }: { className?: string }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-600 ${className}`}>
      <span className="flex items-center gap-2"><Dot dark />Dark Jerseys</span>
      <span className="flex items-center gap-2"><Dot dark={false} />Light Jerseys</span>
    </p>
  );
}
