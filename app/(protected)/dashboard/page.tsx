"use client";

import { useMemo } from "react";

import { useUsuarios } from "@hooks/use-usuarios";
import DashboardStatCards from "@dashboard/dashboard-stat-cards";
import CasesReport from "@dashboard/cases-report";
import Image from "next/image";

function getInitials(name: string | null) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);

  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || "?";
}

export default function Dashboard() {
  const {
    usuarios,
    loading: usuariosLoading,
    error: usuariosError,
  } = useUsuarios(200);

  const usuariosActivos = useMemo(
    () => usuarios.filter((u) => u.activo),
    [usuarios],
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <DashboardStatCards />

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm pb-6">
        <CasesReport />
        <section className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6 mt-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Lista de Usuarios</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Base de datos SQL
                </p>
              </div>
              <a
                href="#"
                className="text-sm text-primary font-medium hover:underline"
              >
                Ver todo →
              </a>
            </div>

            <div className="w-full">
              <div className="hidden sm:grid sm:grid-cols-[60px_1fr_140px_120px_40px] xl:grid-cols-[72px_1fr_160px_140px_48px] text-xs font-semibold text-muted-foreground uppercase border-b border-border pb-3 mb-1 px-1">
                <div>ID</div>
                <div>Usuario</div>
                <div>Estado</div>
                <div>Rol</div>
                <div></div>
              </div>

              {usuariosLoading ? (
                <div className="py-8 text-sm text-muted-foreground">
                  Cargando usuarios…
                </div>
              ) : usuariosError ? (
                <div className="py-8 text-sm text-destructive">
                  {usuariosError}
                </div>
              ) : usuarios.length === 0 ? (
                <div className="py-8 text-sm text-muted-foreground">
                  Sin usuarios.
                </div>
              ) : (
                usuarios.slice(0, 5).map((user) => (
                  <div
                    key={String(user.id)}
                    className="grid grid-cols-[60px_1fr_140px_120px_40px] xl:grid-cols-[72px_1fr_160px_140px_48px] items-center py-3.5 border-b border-border last:border-0 text-sm px-1 hover:bg-muted/40 rounded-lg transition-colors"
                  >
                    <div className="font-medium">{user.id}</div>

                    <div className="flex items-center gap-2.5 min-w-0 pr-0 sm:pr-4">
                      <div className="hidden sm:flex size-8 rounded-full bg-ring/80 items-center justify-center text-xs font-semibold text-primary shrink-0">
                        {getInitials(user.nombre)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {user.nombre || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user.email || "—"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          (user.estado || "").toLowerCase() === "suspendido"
                            ? "bg-amber-500/15 text-amber-600"
                            : user.activo
                              ? "bg-success/15 text-success"
                              : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        <span className="size-2 rounded-full bg-current"></span>
                        {user.estado || (user.activo ? "Activo" : "Inactivo")}
                      </span>
                    </div>

                    <div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-ring/30 text-blue-500">
                        {user.rol || "—"}
                      </span>
                    </div>

                    <div className="hidden sm:block text-right">
                      <button className="size-7 rounded-md hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground">
                        ⋯
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Usuarios Activos</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Conectados recientemente
                </p>
              </div>
              <a
                href="#"
                className="text-sm text-primary font-medium hover:underline"
              >
                Ver todo →
              </a>
            </div>

            <div className="space-y-4">
              {usuariosLoading ? (
                <div className="py-6 text-sm text-muted-foreground">
                  Cargando…
                </div>
              ) : usuariosError ? (
                <div className="py-6 text-sm text-destructive">
                  {usuariosError}
                </div>
              ) : usuariosActivos.length === 0 ? (
                <div className="py-6 text-sm text-muted-foreground">
                  Sin usuarios activos.
                </div>
              ) : (
                usuariosActivos.slice(0, 5).map((user) => (
                  <div
                    key={String(user.id)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Image
                        src={`/default-user.webp`}
                        alt={user.nombre || "Usuario"}
                        className="size-9 rounded-full object-cover"
                        width={36}
                        height={36}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {user.nombre || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user.email || "—"}
                        </div>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-ring/40 text-blue-500 shrink-0">
                      {user.rol || "—"}
                    </span>
                  </div>
                ))
              )}

              <div className="pt-4 text-center">
                <a
                  href="#"
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Ver más →
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
