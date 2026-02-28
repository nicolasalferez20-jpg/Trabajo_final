const SERIES = [
  { key: "Creados",   label: "Casos creados",   color: "var(--primary)" },
  { key: "Resueltos", label: "Casos resueltos",  color: "var(--success)" },
];

export function CustomLegend() {
  return (
    <div className="flex items-center gap-6 mb-3 px-1">
      {SERIES.map((s) => (
        <div key={s.key} className="flex items-center gap-1.5 text-sm text-slate-600">
          <span
            className="inline-block size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: s.color }}
          />
          <span className="text-slate-600 text-sm">{s.label}</span>
        </div>
      ))}
    </div>
  );
}