"use client";

import { useCallback, useEffect, useState } from "react";

export type Usuario = {
  id: number | string;
  nombre: string | null;
  email: string | null;
  rol: string | null;
  estado: string | null;
  activo: boolean;
};

type UseUsuariosResult = {
  usuarios: Usuario[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useUsuarios(limit = 200): UseUsuariosResult {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/usuarios?limit=${limit}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const json = (await res.json().catch(() => null)) as {
        data?: Usuario[];
        error?: string;
      } | null;

      if (!res.ok) {
        setError(json?.error || "Error al cargar usuarios");
        return;
      }

      if (!json?.data) {
        setError("Respuesta inválida del servidor");
        return;
      }

      setUsuarios(json.data);
    } catch (err) {
      console.error("/api/usuarios error", err);
      setError("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { usuarios, loading, error, refresh };
}
