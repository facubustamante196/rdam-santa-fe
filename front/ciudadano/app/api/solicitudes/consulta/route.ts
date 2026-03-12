import { NextResponse } from "next/server";
import { buildBackendUrl } from "@/lib/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const response = await fetch(
    buildBackendUrl("/solicitudes/consulta", {
      codigo: searchParams.get("codigo") ?? undefined,
      dni: searchParams.get("dni") ?? undefined,
      email: searchParams.get("email") ?? undefined,
    }),
    { method: "GET" },
  );

  const text = await response.text();
  return new NextResponse(text, { status: response.status });
}
