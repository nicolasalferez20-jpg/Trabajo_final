import { NextResponse } from "next/server";

import { clearSession } from "@lib/session";

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ data: true });
  } catch (err) {
    console.error("/api/logout error", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
