export type Series = { name: string; color: string; values: (number | null)[] };

const niceStep = (v: number) => {
  const exp = 10 ** Math.floor(Math.log10(v));
  const f = v / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * exp;
};

function Marker({ i, x, y, color, tip }: { i: number; x: number; y: number; color: string; tip: string }) {
  const t = <title>{tip}</title>;
  if (i % 3 === 1) return <rect x={x - 4} y={y - 4} width={8} height={8} fill={color}>{t}</rect>;
  if (i % 3 === 2) return <polygon points={`${x},${y - 5} ${x + 5},${y} ${x},${y + 5} ${x - 5},${y}`} fill={color}>{t}</polygon>;
  return <circle cx={x} cy={y} r={4.5} fill={color}>{t}</circle>;
}

export default function LineChart({
  heading, labels, series, title, fixedMax, fixedStep, suffix = "",
}: {
  heading: string; labels: string[]; series: Series[]; title: string;
  fixedMax?: number; fixedStep?: number; suffix?: string;
}) {
  const W = 720, H = 280, L = 48, R = 20, T = 16, B = 40;
  const values = series.flatMap((s) => s.values).filter((v): v is number => v != null);
  const top = Math.max(...values, 1);
  const step = fixedStep ?? niceStep(top / 4);
  const max = fixedMax ?? Math.ceil(top / step) * step;
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
  const x = (i: number) => (labels.length < 2 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (labels.length - 1));
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const every = Math.ceil(labels.length / 8);

  return (
    <figure className="rounded-md border border-slate-300 bg-white p-4">
      <h3 className="mb-2 font-semibold">{heading}</h3>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className="h-auto w-full text-slate-600">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e2e8f0" />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="12" fill="currentColor">{t}{suffix}</text>
          </g>
        ))}
        {labels.map((l, i) =>
          i % every === 0 ? <text key={l + i} x={x(i)} y={H - 14} textAnchor="middle" fontSize="12" fill="currentColor">{l}</text> : null,
        )}
        {series.map((s) => {
          const d = s.values
            .map((v, i) => (v == null ? null : `${i === 0 || s.values[i - 1] == null ? "M" : "L"}${x(i)},${y(v)}`))
            .filter(Boolean)
            .join(" ");
          return <path key={s.name} d={d} fill="none" stroke={s.color} strokeWidth={3} strokeLinejoin="round" />;
        })}
        {series.map((s, si) =>
          s.values.map((v, i) =>
            v == null ? null : (
              <Marker key={`${s.name}${i}`} i={si} x={x(i)} y={y(v)} color={s.color} tip={`${labels[i]}, ${s.name}: ${Number.isInteger(v) ? v : v.toFixed(1)}${suffix}`} />
            ),
          ),
        )}
      </svg>
      <figcaption className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-1 text-[.9375rem]">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-2">
            <span aria-hidden className="inline-block h-1 w-5 rounded-full" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
