"use client";

import { useCallback, useEffect, useState } from "react";

export type Caso = {
  id: number | string | null;
  estado: string | null;
  fecha_creacion: string | null;
  fecha_actualizacion: string | null;
};

type UseCasosResult = {
  casos: Caso[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useCasos(limit = 2000): UseCasosResult {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/casos?limit=${limit}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const json = (await res.json().catch(() => null)) as {
        data?: Caso[];
        error?: string;
      } | null;

      if (!res.ok) {
        setError(json?.error || "Error al cargar casos");
        return;
      }

      if (!json?.data) {
        setError("Respuesta inválida del servidor");
        return;
      }

      setCasos(json.data);
    } catch (err) {
      console.error("/api/casos error", err);
      setError("Error al cargar casos");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { casos, loading, error, refresh };
}
