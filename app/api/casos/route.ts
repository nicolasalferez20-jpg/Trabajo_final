import { NextResponse } from "next/server";

import { getSessionUser } from "@lib/session";
import { createSupabaseAdminClient } from "@lib/supabase";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");

    const parsedLimit = limitParam ? Number(limitParam) : NaN;
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(Math.trunc(parsedLimit), 1), 2000)
      : 500;

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .schema("base_de_datos_csu")
      .from("ticket")
      .select("*")
      .order("fecha_creacion", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("/api/casos supabase error", error);
      return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }

    const casos = (data || []).map((t) => {
      const row = t as Record<string, unknown>;
      const id = (row.id_ticket ?? row.id ?? null) as number | string | null;
      return {
        id,
        estado: (row.estado ?? null) as string | null,
        fecha_creacion: (row.fecha_creacion ?? null) as string | null,
        fecha_actualizacion: (row.fecha_actualizacion ?? null) as string | null,
      };
    });

    return NextResponse.json({ data: casos });
  } catch (err) {
    console.error("/api/casos error", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
