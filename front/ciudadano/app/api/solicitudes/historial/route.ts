import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildBackendUrl } from "@/lib/server";

const COOKIE_NAME = "rdam_otp_token";

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "NO_AUTH" }, { status: 401 });
  }

  const response = await fetch(buildBackendUrl("/solicitudes/historial"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text();
  return new NextResponse(text, { status: response.status });
}
