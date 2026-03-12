import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("rdam_otp_token")?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/solicitar";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/solicitar/formulario"],
};
