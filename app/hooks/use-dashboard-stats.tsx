"use client";

import { useCallback, useEffect, useState } from "react";

import type { DashboardStats } from "@type/types";

type UseDashboardStatsResult = {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useDashboardStats(): UseDashboardStatsResult {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard/stats", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const json = (await res.json().catch(() => null)) as {
        data?: DashboardStats;
        error?: string;
      } | null;

      if (!res.ok) {
        setError(json?.error || "Error al cargar estadísticas");
        return;
      }

      if (!json?.data) {
        setError("Respuesta inválida del servidor");
        return;
      }

      setStats(json.data);
    } catch (err) {
      console.error("/api/dashboard/stats error", err);
      setError("Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { stats, loading, error, refresh };
}
