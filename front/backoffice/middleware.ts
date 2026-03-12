import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req: NextRequest) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  const session = req.auth;

  if (!session?.user) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  const role = session.user.role;

  if (pathname.startsWith("/dashboard") && role !== "SUPERVISOR") {
    const url = new URL("/solicitudes", req.url);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/equipo") && role !== "SUPERVISOR") {
    return new NextResponse(null, { status: 403 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/login", "/dashboard/:path*", "/solicitudes/:path*", "/equipo/:path*"],
};
