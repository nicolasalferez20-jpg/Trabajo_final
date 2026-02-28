import { NextResponse } from "next/server";

import { getSessionUser } from "@lib/session";
import { createSupabaseAdminClient } from "@lib/supabase";

function formatSupabaseError(err: unknown) {
  if (!err || typeof err !== "object") return err;
  const e = err as Record<string, unknown>;
  return {
    message: e.message,
    details: e.details,
    hint: e.hint,
    code: e.code,
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();

    const resueltosRes = await supabase
      .schema("base_de_datos_csu")
      .from("ticket")
      .select("estado", { count: "exact" })
      .eq("estado", "resuelto");
    resueltosRes.data = (resueltosRes.data || []).slice(0, 1);
    if (resueltosRes.error) {
      console.error("/api/dashboard/stats supabase error (resueltos)", {
        error: formatSupabaseError(resueltosRes.error),
      });
      return NextResponse.json(
        { error: "Error interno (resueltos)" },
        { status: 500 },
      );
    }

    const totalRes = await supabase
      .schema("base_de_datos_csu")
      .from("ticket")
      .select("estado", { count: "exact" });
    totalRes.data = (totalRes.data || []).slice(0, 1);
    if (totalRes.error) {
      console.error("/api/dashboard/stats supabase error (total)", {
        error: formatSupabaseError(totalRes.error),
      });
      return NextResponse.json(
        { error: "Error interno (total)" },
        { status: 500 },
      );
    }

    const pausadosRes = await supabase
      .schema("base_de_datos_csu")
      .from("ticket")
      .select("estado", { count: "exact" })
      .eq("estado", "escalado");
    pausadosRes.data = (pausadosRes.data || []).slice(0, 1);
    if (pausadosRes.error) {
      console.error("/api/dashboard/stats supabase error (pausados)", {
        error: formatSupabaseError(pausadosRes.error),
      });
      return NextResponse.json(
        { error: "Error interno (pausados)" },
        { status: 500 },
      );
    }

    const cerradosRes = await supabase
      .schema("base_de_datos_csu")
      .from("ticket")
      .select("estado", { count: "exact" })
      .eq("estado", "cerrado");
    cerradosRes.data = (cerradosRes.data || []).slice(0, 1);
    if (cerradosRes.error) {
      console.error("/api/dashboard/stats supabase error (cerrados)", {
        error: formatSupabaseError(cerradosRes.error),
      });
      return NextResponse.json(
        { error: "Error interno (cerrados)" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: {
        solucionados: resueltosRes.count ?? 0,
        creados: totalRes.count ?? 0,
        enPausa: pausadosRes.count ?? 0,
        cerrados: cerradosRes.count ?? 0,
      },
    });
  } catch (err) {
    console.error("/api/dashboard/stats error", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
