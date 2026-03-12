import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildBackendUrl } from "@/lib/server";

const COOKIE_NAME = "rdam_otp_token";

export async function POST(req: Request) {
  const body = await req.json();
  const response = await fetch(buildBackendUrl("/auth/otp/validar"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    return new NextResponse(text, { status: response.status });
  }

  const data = JSON.parse(text) as {
    access_token: string;
    message: string;
    expires_in: string;
  };

  const maxAge = 60 * 30;
  cookies().set({
    name: COOKIE_NAME,
    value: data.access_token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return NextResponse.json({
    message: data.message,
    expires_in: data.expires_in,
  });
}
