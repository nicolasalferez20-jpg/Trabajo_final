"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { Button } from "@ui/button";
import { CustomLegend } from "@ui/legend-bar";
import { UseIcon } from "@hooks/use-icons";
import { useCasos } from "@hooks/use-casos";

type TimeRange = "12m" | "6m" | "30d" | "7d";

type ChartData = {
  labels: string[];
  created: number[];
  resolved: number[];
  totalCreated: number;
  totalResolved: number;
  subtitle: string;
};

type TooltipState = {
  visible: boolean;
  x: number;
  y: number;
  label: string;
  created: number;
  resolved: number;
  side: "left" | "right";
};

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "12m", label: "12 Meses" },
  { value: "6m", label: "6 Meses" },
  { value: "30d", label: "30 Días" },
  { value: "7d", label: "7 Días" },
];

const SERIES = [
  {
    key: "created",
    label: "Creados",
    color: "var(--primary)",
    colorRaw: "oklch(0.55 0.15 254.79)",
  },
  {
    key: "resolved",
    label: "Resueltos",
    color: "var(--success)",
    colorRaw: "oklch(0.72 0.18 163.22)",
  },
] as const;

function toKey(dateStr: string, mode: "day" | "month") {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  if (mode === "day") return d.toISOString().slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildSmoothPath(points: [number, number][]): string {
  if (points.length < 2)
    return points
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`)
      .join(" ");
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const cpx = (x0 + x1) / 2;
    d += ` C${cpx},${y0} ${cpx},${y1} ${x1},${y1}`;
  }
  return d;
}

function ChartTooltip({ state }: { state: TooltipState }) {
  if (!state.visible) return null;

  const TOOLTIP_W = 110;
  const offsetX = state.side === "right" ? -(TOOLTIP_W + 12) : 12;

  return (
    <g
      transform={`translate(${state.x + offsetX}, ${Math.max(4, state.y - 60)})`}
      style={{ pointerEvents: "none" }}
    >
      {/* Shadow */}
      <rect
        x="1"
        y="1"
        width={TOOLTIP_W}
        height={72}
        rx="7"
        fill="black"
        fillOpacity="0.06"
      />
      {/* Background */}
      <rect
        width={TOOLTIP_W}
        height={72}
        rx="7"
        fill="#eef0f3"
        stroke="oklch(0.9 0 0)"
        strokeWidth="1"
      />
      {/* Header */}
      <text
        x="10"
        y="18"
        fontSize="11"
        fontWeight="600"
        fill="oklch(0.2 0 0)"
        fontFamily="inherit"
      >
        {state.label}
      </text>
      <line
        x1="10"
        x2={TOOLTIP_W - 10}
        y1="26"
        y2="26"
        stroke="oklch(0.9 0 0)"
        strokeWidth="1"
      />
      {/* Creados row */}
      <circle cx="18" cy="40" r="4" fill={SERIES[0].colorRaw} />
      <text
        x="28"
        y="44"
        fontSize="11"
        fill="oklch(0.5 0 0)"
        fontFamily="inherit"
      >
        Creados
      </text>
      <text
        x={TOOLTIP_W - 10}
        y="44"
        fontSize="11"
        fontWeight="600"
        fill="oklch(0.2 0 0)"
        textAnchor="end"
        fontFamily="inherit"
      >
        {state.created.toLocaleString("es-CO")}
      </text>
      {/* Resueltos row */}
      <circle cx="18" cy="58" r="4" fill={SERIES[1].colorRaw} />
      <text
        x="28"
        y="62"
        fontSize="11"
        fill="oklch(0.5 0 0)"
        fontFamily="inherit"
      >
        Resueltos
      </text>
      <text
        x={TOOLTIP_W - 10}
        y="62"
        fontSize="11"
        fontWeight="600"
        fill="oklch(0.2 0 0)"
        textAnchor="end"
        fontFamily="inherit"
      >
        {state.resolved.toLocaleString("es-CO")}
      </text>
    </g>
  );
}

function AreaChartSvg({ chartData }: { chartData: ChartData }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    label: "",
    created: 0,
    resolved: 0,
    side: "left",
  });

  const W = 900;
  const H = 220;
  const pad = { top: 20, right: 16, bottom: 36, left: 40 };
  const gW = W - pad.left - pad.right;
  const gH = H - pad.top - pad.bottom;
  const n = chartData.created.length;
  const maxVal = Math.max(1, ...chartData.created, ...chartData.resolved);
  const baseline = pad.top + gH;

  const xOf = (i: number) => pad.left + (n > 1 ? (i / (n - 1)) * gW : gW / 2);
  const yOf = (v: number) => pad.top + gH - (v / maxVal) * gH;

  const pointsCreated: [number, number][] = chartData.created.map((v, i) => [
    xOf(i),
    yOf(v),
  ]);
  const pointsResolved: [number, number][] = chartData.resolved.map((v, i) => [
    xOf(i),
    yOf(v),
  ]);

  const lineCreated = buildSmoothPath(pointsCreated);
  const lineResolved = buildSmoothPath(pointsResolved);

  const areaCreated = `${lineCreated}  L${xOf(n - 1)},${baseline} L${xOf(0)},${baseline} Z`;
  const areaResolved = `${lineResolved} L${xOf(n - 1)},${baseline} L${xOf(0)},${baseline} Z`;

  const yTicks = [0, 1, 2, 3, 4].map((i) => ({
    y: pad.top + gH - (i / 4) * gH,
    label: Math.round((maxVal * i) / 4).toString(),
  }));

  const maxLabels = n <= 7 ? n : n <= 12 ? 6 : 8;
  const step = Math.max(1, Math.ceil(n / maxLabels));

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    if (svg.getBoundingClientRect().width < 480) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;

    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < n; i++) {
      const dist = Math.abs(xOf(i) - svgX);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }

    const px = xOf(closest);
    const py = Math.min(
      yOf(chartData.created[closest]),
      yOf(chartData.resolved[closest]),
    );

    setTooltip({
      visible: true,
      x: px,
      y: py,
      label: chartData.labels[closest],
      created: chartData.created[closest],
      resolved: chartData.resolved[closest],
      side: px > W * 0.6 ? "right" : "left",
    });
  };

  const handleMouseLeave = () => setTooltip((t) => ({ ...t, visible: false }));

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full h-full overflow-visible"
      role="img"
      aria-label={`Gráfico de casos: ${chartData.subtitle}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: "crosshair" }}
    >
      <defs>
        <linearGradient id="gradCreated" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={SERIES[0].colorRaw} stopOpacity="0.22" />
          <stop
            offset="85%"
            stopColor={SERIES[0].colorRaw}
            stopOpacity="0.03"
          />
        </linearGradient>
        <linearGradient id="gradResolved" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={SERIES[1].colorRaw} stopOpacity="0.18" />
          <stop
            offset="85%"
            stopColor={SERIES[1].colorRaw}
            stopOpacity="0.03"
          />
        </linearGradient>
        <clipPath id="chartClip">
          <rect x={pad.left} y={pad.top} width={gW} height={gH} />
        </clipPath>
      </defs>

      {yTicks.map(({ y, label }, i) => (
        <g key={i}>
          <line
            x1={pad.left}
            x2={pad.left + gW}
            y1={y}
            y2={y}
            stroke="oklch(0.9 0 0)"
            strokeWidth={i === 0 ? 1.5 : 1}
            strokeDasharray={i === 0 ? undefined : "3 3"}
          />
          <text
            x={pad.left - 8}
            y={y + 4}
            textAnchor="end"
            fontSize={10}
            fill="oklch(0.6 0 0)"
            fontFamily="inherit"
          >
            {label}
          </text>
        </g>
      ))}

      <g clipPath="url(#chartClip)">
        <path d={areaCreated} fill="url(#gradCreated)" />
        <path d={areaResolved} fill="url(#gradResolved)" />
      </g>

      <g clipPath="url(#chartClip)">
        <path
          d={lineCreated}
          fill="none"
          stroke={SERIES[0].colorRaw}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={lineResolved}
          fill="none"
          stroke={SERIES[1].colorRaw}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>

      {tooltip.visible && (
        <line
          x1={tooltip.x}
          x2={tooltip.x}
          y1={pad.top}
          y2={baseline}
          stroke="oklch(0.7 0 0)"
          strokeWidth="1"
          strokeDasharray="4 3"
          style={{ pointerEvents: "none" }}
        />
      )}

      {tooltip.visible && (
        <>
          <circle
            cx={tooltip.x}
            cy={yOf(chartData.created[chartData.labels.indexOf(tooltip.label)])}
            r="4"
            fill={SERIES[0].colorRaw}
            stroke="white"
            strokeWidth="2"
            style={{ pointerEvents: "none" }}
          />
          <circle
            cx={tooltip.x}
            cy={yOf(
              chartData.resolved[chartData.labels.indexOf(tooltip.label)],
            )}
            r="4"
            fill={SERIES[1].colorRaw}
            stroke="white"
            strokeWidth="2"
            style={{ pointerEvents: "none" }}
          />
        </>
      )}

      {chartData.labels.map((lbl, i) => {
        if (i % step !== 0 && i !== n - 1) return null;
        return (
          <text
            key={i}
            x={xOf(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize={10}
            fill="oklch(0.6 0 0)"
            fontFamily="inherit"
          >
            {lbl}
          </text>
        );
      })}

      <ChartTooltip state={tooltip} />
    </svg>
  );
}

export default function CasesReport() {
  const { casos, loading: casosLoading, error: casosError } = useCasos(2000);
  const [timeRange, setTimeRange] = useState<TimeRange>("12m");

  const onExportCsv = useCallback(() => {
    try {
      const headers = ["ID", "Estado", "Fecha Creación", "Fecha Actualización"];
      const rows = [
        headers,
        ...casos.map((c) => [
          String(c.id ?? ""),
          String(c.estado ?? ""),
          String(c.fecha_creacion ?? ""),
          String(c.fecha_actualizacion ?? ""),
        ]),
      ];
      const csv = rows
        .map((r) => r.map((cell) => `"${cell}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte_casos_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("export csv error", err);
    }
  }, [casos]);

  const chartData: ChartData = useMemo(() => {
    const isDays = timeRange === "7d" || timeRange === "30d";
    const steps =
      timeRange === "7d"
        ? 7
        : timeRange === "30d"
          ? 30
          : timeRange === "6m"
            ? 6
            : 12;
    const mode: "day" | "month" = isDays ? "day" : "month";

    const keys: string[] = [];
    const labels: string[] = [];
    const now = new Date();

    if (mode === "day") {
      for (let i = steps - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        keys.push(d.toISOString().slice(0, 10));
        labels.push(String(d.getDate()).padStart(2, "0"));
      }
    } else {
      const monthNames = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
      ];
      for (let i = steps - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        keys.push(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        );
        labels.push(monthNames[d.getMonth()]);
      }
    }

    const createdMap = new Map<string, number>(keys.map((k) => [k, 0]));
    const resolvedMap = new Map<string, number>(keys.map((k) => [k, 0]));

    for (const c of casos) {
      if (c.fecha_creacion) {
        const k = toKey(c.fecha_creacion, mode);
        if (k && createdMap.has(k))
          createdMap.set(k, (createdMap.get(k) || 0) + 1);
      }
      if ((c.estado || "").toLowerCase() === "resuelto") {
        const date = c.fecha_actualizacion || c.fecha_creacion;
        if (date) {
          const k = toKey(date, mode);
          if (k && resolvedMap.has(k))
            resolvedMap.set(k, (resolvedMap.get(k) || 0) + 1);
        }
      }
    }

    const created = keys.map((k) => createdMap.get(k) || 0);
    const resolved = keys.map((k) => resolvedMap.get(k) || 0);

    return {
      labels,
      created,
      resolved,
      totalCreated: created.reduce((a, b) => a + b, 0),
      totalResolved: resolved.reduce((a, b) => a + b, 0),
      subtitle: isDays
        ? timeRange === "7d"
          ? "Últimos 7 días"
          : "Últimos 30 días"
        : timeRange === "6m"
          ? "Últimos 6 meses"
          : "Últimos 12 meses",
    };
  }, [casos, timeRange]);

  return (
    <section aria-labelledby="cases-report-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-5">
        <div className="space-y-0.5 min-w-0">
          <h2
            id="cases-report-title"
            className="text-lg font-semibold tracking-tight text-foreground truncate"
          >
            Reporte de casos
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {casosError
              ? casosError
              : casosLoading
                ? "Cargando datos…"
                : `${chartData.subtitle} · Creados: ${chartData.totalCreated.toLocaleString("es-CO")} · Resueltos: ${chartData.totalResolved.toLocaleString("es-CO")}`}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {TIME_RANGES.map(({ value, label }) => (
            <Button
              key={value}
              variant="outline"
              size="sm"
              className={
                timeRange === value
                  ? "bg-background border-border text-foreground hover:bg-[#e2e5ea] hover:text-foreground font-medium rounded-lg text-xs px-2.5"
                  : "bg-[#e2e5ea] border-[#e2e5ea] text-foreground hover:bg-[#e2e5ea] hover:text-foreground font-medium rounded-lg text-xs px-2.5"
              }
              onClick={() => setTimeRange(value)}
              disabled={casosLoading}
              aria-pressed={timeRange === value}
            >
              {label}
            </Button>
          ))}

          <Button
            size="sm"
            className="ml-auto bg-[#3b6de8] border-[#3b6de8] text-background hover:bg-[#2d5cd4] hover:text-background text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer"
            onClick={onExportCsv}
            disabled={casosLoading || !!casosError || casos.length === 0}
            aria-label="Exportar datos como CSV"
          >
            <UseIcon name="download" className="size-5 shrink-0 text-white" />
            <span>Exportar CSV</span>
          </Button>
        </div>
      </div>

      <div className="w-full rounded-lg border border-border bg-card shadow-sm p-3 sm:p-4">
        <CustomLegend />

        <div className="w-full h-48 sm:h-64 lg:h-72">
          {casosLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="w-full max-w-xs h-2 rounded-full bg-muted animate-pulse" />
                <div className="w-full max-w-sm h-2 rounded-full bg-muted animate-pulse opacity-60" />
                <span className="text-xs mt-1">Cargando gráfico…</span>
              </div>
            </div>
          ) : casosError ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-destructive text-center px-4">
                {casosError}
              </p>
            </div>
          ) : (
            <AreaChartSvg chartData={chartData} />
          )}
        </div>
      </div>
    </section>
  );
}
