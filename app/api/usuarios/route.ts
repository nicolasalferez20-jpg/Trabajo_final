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
      ? Math.min(Math.max(Math.trunc(parsedLimit), 1), 500)
      : 200;

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .schema("base_de_datos_csu")
      .from("usuario")
      .select("id_usuario, nombre_usuario, correo, rol, estado")
      .order("nombre_usuario", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("/api/usuarios supabase error", error);
      return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }

    const usuarios = (data || []).map((u) => {
      const estado = u.estado ? String(u.estado) : null;
      return {
        id: u.id_usuario,
        nombre: u.nombre_usuario ?? null,
        email: u.correo ?? null,
        rol: u.rol ?? null,
        estado,
        activo: estado ? estado.toLowerCase() === "activo" : false,
      };
    });

    return NextResponse.json({ data: usuarios });
  } catch (err) {
    console.error("/api/usuarios error", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
