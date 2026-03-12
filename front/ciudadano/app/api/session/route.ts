import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "rdam_otp_token";

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value;
  return NextResponse.json({ authenticated: Boolean(token) });
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
