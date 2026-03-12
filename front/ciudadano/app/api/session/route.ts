import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "rdam_otp_token";

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value;
  return NextResponse.json({ authenticated: Boolean(token) });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { token?: string; access_token?: string };
  const token = body.token ?? body.access_token;

  if (!token) {
    return NextResponse.json({ error: "TOKEN_REQUIRED" }, { status: 400 });
  }

  const maxAge = 60 * 30;
  cookies().set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  cookies().set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}
