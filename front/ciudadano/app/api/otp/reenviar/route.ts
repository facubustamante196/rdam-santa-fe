import { NextResponse } from "next/server";
import { buildBackendUrl } from "@/lib/server";

export async function POST(req: Request) {
  const body = await req.json();
  const response = await fetch(buildBackendUrl("/auth/otp/reenviar"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  return new NextResponse(text, { status: response.status });
}
