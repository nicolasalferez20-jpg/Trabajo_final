import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getSecret() {
  const secret = process.env.AUTH_SECRET || "colsof_secret";
  return new TextEncoder().encode(secret);
}

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("colsof_session")?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    const res = NextResponse.redirect(url);
    res.cookies.set("colsof_session", "", { path: "/", maxAge: 0 });
    return res;
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
