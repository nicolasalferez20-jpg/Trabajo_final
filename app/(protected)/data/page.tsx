export default function DataPage() {
  return (
    <div>
      {/* Database Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            label: "Tablas",
            id: "tables-count",
            value: "24",
            accent: "text-[#3b6de8]",
            bar: "bg-[#3b6de8]",
          },
          {
            label: "Registros",
            id: "records-count",
            value: "156,789",
            accent: "text-[#2eac76]",
            bar: "bg-[#2eac76]",
          },
          {
            label: "Tamaño Total",
            id: "db-size",
            value: "2.4 GB",
            accent: "text-[#7c5cbf]",
            bar: "bg-[#7c5cbf]",
          },
          {
            label: "Último Backup",
            id: "last-backup",
            value: "2026-01-19 08:00",
            accent: "text-[#d47c1a]",
            bar: "bg-[#d47c1a]",
          },
          {
            label: "Uptime",
            id: "uptime",
            value: "45d 12h",
            accent: "text-[#0e9ab5]",
            bar: "bg-[#0e9ab5]",
          },
        ].map(({ label, id, value, accent, bar }) => (
          <div
            key={id}
            className="bg-[#eef0f3] border border-[#e2e5ea] rounded-xl px-4 py-3.5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-1.5"
          >
            <span className="text-[10.5px] font-semibold uppercase tracking-widest text-[#8e95a3]">
              {label}
            </span>
            <span
              id={id}
              className={`text-xl font-semibold tracking-tight leading-none ${accent}`}
            >
              {value}
            </span>
            <div
              className={`h-0.5 w-8 rounded-full ${bar} opacity-40 mt-0.5`}
            />
          </div>
        ))}
      </div>

      {/* Tabs Container */}
      <div className="bg-[#eef0f3] border border-[#e2e5ea] rounded-xl shadow-sm overflow-hidden">
        {/* Tabs Navigation */}
        <div className="flex border-b border-[#e2e5ea] bg-[#e8eaed] px-1 pt-1 gap-0.5">
          {[
            { key: "consultas", icon: "search", label: "Consultas SQL" },
            { key: "backup", icon: "save", label: "Backup & Restore" },
            { key: "mantenimiento", icon: "settings", label: "Mantenimiento" },
            { key: "importar", icon: "upload", label: "Importar/Exportar" },
          ].map(({ key, label }) => (
            <button
              key={key}
              data-tab={key}
              className="tab-button flex items-center gap-2 px-4 py-2.5 text-[12.5px] font-medium rounded-t-lg border border-transparent
                   text-[#5a6070] hover:text-[#1a1d23] hover:bg-[#eef0f3] transition-all
                   data-[active=true]:bg-[#eef0f3] data-[active=true]:border-[#e2e5ea] data-[active=true]:border-b-[#eef0f3] data-[active=true]:text-[#3b6de8]"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {/* ── Consultas SQL ── */}
          <div className="tab-pane" id="consultas-tab">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
              {/* Editor */}
              <div className="flex flex-col gap-3">
                <label className="text-[12px] font-semibold uppercase tracking-widest text-[#8e95a3]">
                  Editor de Consultas SQL
                </label>
                <textarea
                  id="query-editor"
                  rows={6}
                  placeholder="Escribe tu consulta SQL aquí..."
                  className="w-full resize-y rounded-lg border border-[#d8dce2] bg-[#f0f2f5] px-4 py-3
                       font-mono text-[12.5px] text-[#1a1d23] placeholder:text-[#8e95a3]
                       focus:outline-none focus:ring-2 focus:ring-[#3b6de8]/30 focus:border-[#3b6de8]
                       transition-colors"
                  defaultValue={`SELECT * FROM casos WHERE estado != "Resuelto" ORDER BY fecha_creacion DESC`}
                />
                <div className="flex items-center gap-2">
                  <button
                    id="execute-query"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3b6de8] text-[#eef0f3] text-[12.5px] font-medium hover:bg-[#2d5cd4] transition-colors"
                  >
                    Ejecutar Consulta
                  </button>
                  <button
                    id="clear-query"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#f0f2f5] border border-[#d8dce2] text-[#5a6070] text-[12.5px] font-medium hover:bg-[#e2e5ea] transition-colors"
                  >
                    Limpiar
                  </button>
                  <button
                    id="export-results"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#d4f0e5] border border-[#b8e4d0] text-[#1a7a52] text-[12.5px] font-medium hover:bg-[#c0e8d6] transition-colors"
                  >
                    Exportar
                  </button>
                </div>
                <div
                  id="query-results"
                  className="min-h-20 rounded-lg border border-[#e2e5ea] bg-[#f0f2f5] p-3 text-[12px] text-[#5a6070]"
                />
              </div>

              {/* Predefined Queries */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[12px] font-semibold uppercase tracking-widest text-[#8e95a3]">
                  Consultas Predefinidas
                </h3>
                <div className="flex flex-col gap-2">
                  {[
                    {
                      name: "Casos sin resolver",
                      desc: "Lista todos los casos activos pendientes de resolución",
                      preview: `SELECT * FROM casos WHERE estado != "Resuelto"...`,
                      query: `SELECT * FROM casos WHERE estado != 'Resuelto' ORDER BY fecha_creacion DESC`,
                    },
                    {
                      name: "Técnicos con mayor carga",
                      desc: "Muestra técnicos ordenados por cantidad de casos activos",
                      preview: `SELECT tecnico_id, COUNT(*) as total FROM casos...`,
                      query: `SELECT tecnico_id, COUNT(*) as total FROM casos WHERE estado = 'En Curso' GROUP BY tecnico_id ORDER BY total DESC`,
                    },
                    {
                      name: "Casos por prioridad",
                      desc: "Distribución de casos según nivel de prioridad",
                      preview: `SELECT prioridad, COUNT(*) as cantidad FROM casos...`,
                      query: `SELECT prioridad, COUNT(*) as cantidad FROM casos GROUP BY prioridad`,
                    },
                  ].map(({ name, desc, preview, query }) => (
                    <div
                      key={name}
                      data-query={query}
                      className="sample-query cursor-pointer rounded-lg border border-[#e2e5ea] bg-[#f0f2f5] p-3
                           hover:border-[#3b6de8]/40 hover:bg-[#e8edf8] transition-all group"
                    >
                      <div className="text-[13px] font-semibold text-[#1a1d23] group-hover:text-[#3b6de8] transition-colors">
                        {name}
                      </div>
                      <div className="text-[11.5px] text-[#8e95a3] mt-0.5 mb-2">
                        {desc}
                      </div>
                      <code className="block text-[10.5px] text-[#5a6070] font-mono bg-[#e8eaed] rounded px-2 py-1.5 truncate">
                        {preview}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Backup & Restore ── */}
          <div className="tab-pane hidden" id="backup-tab">
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
              {/* Backup Form */}
              <div className="flex flex-col gap-4">
                <h3 className="text-[12px] font-semibold uppercase tracking-widest text-[#8e95a3]">
                  Crear Backup
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-[#5a6070]">
                      Tipo de Backup
                    </label>
                    <select
                      id="backup-type"
                      className="rounded-lg border border-[#d8dce2] bg-[#f0f2f5] px-3 py-2 text-[13px] text-[#1a1d23]
                           focus:outline-none focus:ring-2 focus:ring-[#3b6de8]/30 focus:border-[#3b6de8] transition-colors"
                    >
                      <option>Completo (Base de datos completa)</option>
                      <option>Incremental (Solo cambios)</option>
                      <option>Diferencial (Desde último completo)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-[#5a6070]">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      id="backup-location"
                      defaultValue="/backups/csu_backup_"
                      className="rounded-lg border border-[#d8dce2] bg-[#f0f2f5] px-3 py-2 text-[13px] text-[#1a1d23]
                           focus:outline-none focus:ring-2 focus:ring-[#3b6de8]/30 focus:border-[#3b6de8] transition-colors"
                    />
                  </div>
                  <button
                    id="create-backup"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                         bg-[#3b6de8] text-[#eef0f3] text-[13px] font-medium hover:bg-[#2d5cd4] transition-colors"
                  >
                    Crear Backup Ahora
                  </button>
                </div>

                {/* Restore Warning */}
                <div className="mt-2">
                  <h3 className="text-[12px] font-semibold uppercase tracking-widest text-[#8e95a3] mb-3">
                    Restaurar desde Backup
                  </h3>
                  <div className="rounded-lg border border-[#f0d4a8] bg-[#fdf3e3] p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-2">
                      <span className="text-[#d47c1a] text-base leading-none mt-0.5">
                        ⚠
                      </span>
                      <div>
                        <div className="text-[12.5px] font-semibold text-[#a05e10]">
                          Advertencia
                        </div>
                        <div className="text-[11.5px] text-[#b87820] mt-0.5 leading-relaxed">
                          Restaurar un backup sobrescribirá todos los datos
                          actuales. Asegúrate de crear un backup antes de
                          proceder.
                        </div>
                      </div>
                    </div>
                    <button
                      id="select-backup-file"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                           bg-[#d47c1a] text-[#fdf3e3] text-[12.5px] font-medium hover:bg-[#b86a14] transition-colors"
                    >
                      Seleccionar Archivo de Backup
                    </button>
                  </div>
                </div>
              </div>

              {/* Backup History */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[12px] font-semibold uppercase tracking-widest text-[#8e95a3]">
                  Historial de Backups
                </h3>
                <div className="flex flex-col gap-2">
                  {[
                    {
                      date: "2026-01-19 08:00",
                      type: "Automático",
                      size: "2.4 GB",
                    },
                    {
                      date: "2026-01-18 08:00",
                      type: "Automático",
                      size: "2.3 GB",
                    },
                    {
                      date: "2026-01-17 14:30",
                      type: "Manual",
                      size: "2.3 GB",
                    },
                  ].map(({ date, type, size }) => (
                    <div
                      key={date}
                      className="flex items-center justify-between gap-4 rounded-lg border border-[#e2e5ea] bg-[#f0f2f5] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[#2eac76] text-base">✓</span>
                        <div>
                          <div className="text-[13px] font-medium text-[#1a1d23]">
                            {date}
                          </div>
                          <div className="text-[11px] text-[#8e95a3]">
                            {type}
                          </div>
                        </div>
                      </div>
                      <span className="text-[12px] font-mono text-[#5a6070]">
                        {size}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button className="px-3 py-1.5 rounded-md text-[11.5px] font-medium bg-[#d0daf8] text-[#3b6de8] hover:bg-[#bfcef5] transition-colors">
                          Restaurar
                        </button>
                        <button className="px-3 py-1.5 rounded-md text-[11.5px] font-medium bg-[#e8eaed] text-[#5a6070] hover:bg-[#d8dce2] transition-colors">
                          Descargar
                        </button>
                        <button
                          aria-label="Eliminar"
                          className="p-1.5 rounded-md text-[#8e95a3] hover:bg-[#fde8e8] hover:text-[#c0392b] transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Mantenimiento ── */}
          <div className="tab-pane hidden" id="mantenimiento-tab">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {
                  title: "Optimizar BD",
                  desc: "Reorganiza y optimiza tablas",
                  btn: "Ejecutar Optimización",
                  bg: "bg-[#e8edf8]",
                  border: "border-[#c8d6f5]",
                  accent: "text-[#3b6de8]",
                  btnCls: "bg-[#3b6de8] hover:bg-[#2d5cd4] text-[#eef0f3]",
                },
                {
                  title: "Limpiar Registros",
                  desc: "Elimina datos de más de 2 años",
                  btn: "Iniciar Limpieza",
                  bg: "bg-[#ede8f8]",
                  border: "border-[#d4c8f5]",
                  accent: "text-[#7c5cbf]",
                  btnCls: "bg-[#7c5cbf] hover:bg-[#6a4aad] text-[#ede8f8]",
                },
                {
                  title: "Verificar Integridad",
                  desc: "Revisa consistencia de datos",
                  btn: "Verificar Ahora",
                  bg: "bg-[#e3f5ee]",
                  border: "border-[#b8e4d0]",
                  accent: "text-[#2eac76]",
                  btnCls: "bg-[#2eac76] hover:bg-[#249962] text-[#e3f5ee]",
                },
                {
                  title: "Reconstruir Índices",
                  desc: "Mejora rendimiento de consultas",
                  btn: "Reconstruir",
                  bg: "bg-[#fdf0e0]",
                  border: "border-[#f0d4a8]",
                  accent: "text-[#d47c1a]",
                  btnCls: "bg-[#d47c1a] hover:bg-[#b86a14] text-[#fdf0e0]",
                },
              ].map(({ title, desc, btn, bg, border, accent, btnCls }) => (
                <div
                  key={title}
                  className={`flex flex-col gap-4 rounded-xl border ${border} ${bg} p-5`}
                >
                  <div>
                    <h3 className={`text-[13.5px] font-semibold ${accent}`}>
                      {title}
                    </h3>
                    <p className="text-[12px] text-[#8e95a3] mt-1">{desc}</p>
                  </div>
                  <button
                    className={`w-full py-2 rounded-lg text-[12.5px] font-medium transition-colors ${btnCls}`}
                  >
                    {btn}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Importar / Exportar ── */}
          <div className="tab-pane hidden" id="importar-tab">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
              <div className="flex flex-col items-center gap-4 rounded-xl border border-[#c8d6f5] bg-[#e8edf8] p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[#d0daf8] flex items-center justify-center text-[#3b6de8] text-xl">
                  ↑
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[#1a1d23]">
                    Importar Datos
                  </h3>
                  <p className="text-[12px] text-[#8e95a3] mt-1">
                    Soporta archivos CSV, JSON y XML
                  </p>
                </div>
                <button className="px-5 py-2 rounded-lg bg-[#3b6de8] text-[#eef0f3] text-[12.5px] font-medium hover:bg-[#2d5cd4] transition-colors">
                  Seleccionar Archivo
                </button>
              </div>

              <div className="flex flex-col items-center gap-4 rounded-xl border border-[#b8e4d0] bg-[#e3f5ee] p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-[#c0e8d6] flex items-center justify-center text-[#2eac76] text-xl">
                  ↓
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[#1a1d23]">
                    Exportar Datos
                  </h3>
                  <p className="text-[12px] text-[#8e95a3] mt-1">
                    Descarga en múltiples formatos
                  </p>
                </div>
                <div className="flex gap-2">
                  {[
                    {
                      label: "CSV",
                      cls: "bg-[#2eac76] hover:bg-[#249962] text-[#e3f5ee]",
                    },
                    {
                      label: "Excel",
                      cls: "bg-[#1a7a52] hover:bg-[#145f40] text-[#e3f5ee]",
                    },
                    {
                      label: "JSON",
                      cls: "bg-[#0e9ab5] hover:bg-[#0b809a] text-[#e3f5ee]",
                    },
                  ].map(({ label, cls }) => (
                    <button
                      key={label}
                      className={`px-4 py-2 rounded-lg text-[12.5px] font-medium transition-colors ${cls}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
