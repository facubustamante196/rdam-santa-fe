import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildBackendUrl } from "@/lib/server";

const COOKIE_NAME = "rdam_otp_token";

export async function POST(req: Request) {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "NO_AUTH" }, { status: 401 });
  }

  const body = await req.json();
  const response = await fetch(buildBackendUrl("/pagos/iniciar"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  return new NextResponse(text, { status: response.status });
}
