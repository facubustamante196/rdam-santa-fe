import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildBackendUrl } from "@/lib/server";

const COOKIE_NAME = "rdam_otp_token";

export async function GET(
  _req: Request,
  { params }: { params: { codigo: string } },
) {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "NO_AUTH" }, { status: 401 });
  }

  const response = await fetch(
    buildBackendUrl(`/solicitudes/${params.codigo}/download`),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      redirect: "manual",
    },
  );

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location") ?? response.headers.get("Location");
    if (!location) {
      return NextResponse.json({ error: "NO_URL" }, { status: 500 });
    }
    return NextResponse.json({ url: location });
  }

  if (!response.ok) {
    const text = await response.text();
    return new NextResponse(text, { status: response.status });
  }

  const json = (await response.json()) as { url?: string };
  if (json.url) {
    return NextResponse.json({ url: json.url });
  }

  return NextResponse.json({ error: "INVALID_RESPONSE" }, { status: 500 });
}
