import { NextResponse } from "next/server";

import { setSession } from "@lib/session";
import { createSupabaseAdminClient } from "@lib/supabase";
import { loginSchema } from "@schemas/auth";

function decodeBase64(value: string) {
  return Buffer.from(value, "base64").toString("utf8");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return NextResponse.json(
        {
          error: message,
          issues: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .schema("base_de_datos_csu")
      .from("usuario")
      .select(
        "id_usuario, administrador_id_administrador, nombre_usuario, correo, contrasena, rol, estado",
      )
      .eq("correo", email)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("/api/login supabase error", error);
      return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 },
      );
    }

    const user = data as {
      id_usuario: number;
      administrador_id_administrador: number;
      nombre_usuario: string;
      correo: string;
      contrasena: string;
      rol: string;
      estado: string | null;
    };

    const estado = String(user.estado || "").toLowerCase();
    if (estado === "inactivo") {
      return NextResponse.json({ error: "Usuario inactivo" }, { status: 403 });
    }

    if (estado === "suspendido") {
      return NextResponse.json(
        { error: "Usuario suspendido" },
        { status: 403 },
      );
    }

    if (estado && estado !== "activo") {
      return NextResponse.json(
        { error: "Usuario no habilitado" },
        { status: 403 },
      );
    }

    const storedPassword = String(user.contrasena || "").trim();
    let decodedPassword = "";
    try {
      decodedPassword = decodeBase64(storedPassword);
    } catch {
      decodedPassword = "";
    }

    const ok = decodedPassword === password || storedPassword === password;
    if (!ok) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 },
      );
    }

    await setSession({
      id: String(user.id_usuario),
      nombre: user.nombre_usuario,
      apellido: "",
      email: user.correo,
      rol: user.rol,
    });

    return NextResponse.json({
      data: {
        id: String(user.id_usuario),
        nombre: user.nombre_usuario,
        apellido: "",
        email: user.correo,
        rol: user.rol,
      },
    });
  } catch (err) {
    console.error("/api/login error", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
