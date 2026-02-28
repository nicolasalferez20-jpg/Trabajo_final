import { Button } from "@/app/components/ui/button";

export default function StatsPage() {
  return (
    <div className="max-w-full flex flex-col gap-3.5">
      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#eef0f3] border border-[#e2e5ea] rounded-xl px-5 py-4 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#8e95a3]">
            Total Casos
          </span>
          <strong
            id="totalCases"
            className="text-3xl font-semibold tracking-tight text-[#3b6de8]"
          >
            0
          </strong>
          <small className="text-[11.5px] text-[#8e95a3]">
            Período seleccionado
          </small>
        </div>

        <div className="bg-[#eef0f3] border border-[#e2e5ea] rounded-xl px-5 py-4 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#8e95a3]">
            Casos Resueltos
          </span>
          <strong
            id="casosResueltos"
            className="text-3xl font-semibold tracking-tight text-[#2eac76]"
          >
            0
          </strong>
          <small className="text-[11.5px] text-[#8e95a3]">del total</small>
        </div>

        <div className="bg-[#eef0f3] border border-[#e2e5ea] rounded-xl px-5 py-4 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#8e95a3]">
            Tiempo Promedio
          </span>
          <strong
            id="tiempoPromedio"
            className="text-3xl font-semibold tracking-tight text-[#d47c1a]"
          >
            0
          </strong>
          <small className="text-[11.5px] text-[#8e95a3]">horas</small>
        </div>

        <div className="bg-[#eef0f3] border border-[#e2e5ea] rounded-xl px-5 py-4 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#8e95a3]">
            Satisfacción
          </span>
          <strong
            id="satisfaccion"
            className="text-3xl font-semibold tracking-tight text-[#7c5cbf]"
          >
            4.5
          </strong>
          <div className="text-[#f0b429] text-sm tracking-tight">★★★★★</div>
        </div>
      </section>

      {/* Filtros */}
      <section className="flex flex-wrap gap-2 bg-[#eef0f3] border border-[#e2e5ea] rounded-xl p-2">
        <Button
          variant="outline"
          className="bg-background border-border text-foreground hover:bg-[#e2e5ea] hover:text-foreground text-xs font-medium rounded-lg"
        >
          Última semana
        </Button>
        <Button
          variant="outline"
          className="bg-background border-border text-foreground hover:bg-[#e2e5ea] hover:text-foreground text-xs font-medium rounded-lg"
        >
          Último mes
        </Button>
        <Button
          variant="outline"
          className="bg-background border-border text-foreground hover:bg-[#e2e5ea] hover:text-foreground text-xs font-medium rounded-lg"
        >
          Trimestre
        </Button>
        <Button
          variant="outline"
          className="bg-background border-border text-foreground hover:bg-[#e2e5ea] hover:text-foreground text-xs font-medium rounded-lg"
        >
          Año
        </Button>
        <Button
          variant="outline"
          className="ml-auto bg-[#3b6de8] border-[#3b6de8] text-[#eef0f3] hover:bg-[#2d5cd4] hover:text-[#eef0f3] text-xs font-medium rounded-lg flex items-center gap-1.5"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Exportar Reporte
        </Button>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <div className="bg-[#eef0f3] border border-[#e2e5ea] rounded-xl p-5 shadow-sm">
          <h2 className="text-[13.5px] font-semibold text-[#1a1d23] mb-4">
            Tendencia de Casos
          </h2>
          <svg
            id="trendChart"
            viewBox="0 0 600 200"
            className="w-full h-auto"
          />
        </div>

        <div className="bg-[#eef0f3] border border-[#e2e5ea] rounded-xl p-5 shadow-sm">
          <h2 className="text-[13.5px] font-semibold text-[#1a1d23] mb-4">
            Distribución Tiempo de Resolución
          </h2>
          <div id="timeDistribution" className="w-full" />
        </div>
      </section>

      {/* Tabla categorías */}
      <section className="bg-[#eef0f3] border border-[#e2e5ea] rounded-xl p-5 shadow-sm">
        <h2 className="text-[13.5px] font-semibold text-[#1a1d23] mb-4">
          Estadísticas por Categoría
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#d8dce2]">
                {[
                  "Categoría",
                  "Total",
                  "Resueltos",
                  "%",
                  "Tiempo",
                  "Distribución",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[10.5px] font-semibold uppercase tracking-[0.07em] text-[#8e95a3] pb-3 px-2.5 first:pl-0 last:pr-0"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody
              id="categoryTable"
              className="[&>tr]:border-b [&>tr]:border-[#e2e5ea] [&>tr:last-child]:border-0 [&>tr>td]:py-3 [&>tr>td]:px-2.5 [&>tr>td:first-child]:pl-0 [&>tr>td:last-child]:pr-0 [&>tr>td]:text-[13px] [&>tr>td]:text-[#1a1d23] [&>tr:hover>td]:bg-[#f0f2f5] [&>tr]:transition-colors"
            />
          </table>
        </div>
      </section>

      {/* Técnicos */}
      <section className="bg-[#eef0f3] border border-[#e2e5ea] rounded-xl p-5 shadow-sm">
        <h2 className="text-[13.5px] font-semibold text-[#1a1d23] mb-4">
          Rendimiento de Técnicos
        </h2>
        <div
          id="technicians"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
        />
      </section>
    </div>
  );
}
