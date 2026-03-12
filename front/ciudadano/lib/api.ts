import {
  ConsultaResponseSchema,
  HistorialResponseSchema,
  OtpSolicitarResponseSchema,
  OtpValidarResponseSchema,
  SolicitudCrearResponseSchema,
} from "@/lib/schemas";
import type {
  ConsultaFormValues,
  ConsultaResponse,
  HistorialResponse,
  OtpSolicitarFormValues,
  OtpSolicitarResponse,
  OtpValidarFormValues,
  OtpValidarResponse,
  SolicitudCrearResponse,
  SolicitudFormValues,
} from "@/lib/schemas";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type RequestOptions<T> = {
  schema: { parse: (data: unknown) => T };
  path: string;
  method?: "GET" | "POST";
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  token?: string | null;
};

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>({
  schema,
  path,
  method = "GET",
  body,
  query,
  token,
}: RequestOptions<T>): Promise<T> {
  const base = new URL(API_BASE_URL);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const finalUrl = new URL(normalizedPath, base.toString());
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        finalUrl.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(finalUrl.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response.status, text || "API error");
  }

  const json = (await response.json()) as unknown;
  try {
    return schema.parse(json);
  } catch (error) {
    throw new ApiError(500, "Respuesta invalida", error);
  }
}

export function solicitarOtp(
  data: OtpSolicitarFormValues,
): Promise<OtpSolicitarResponse> {
  return request({
    schema: OtpSolicitarResponseSchema,
    path: "/auth/otp/solicitar",
    method: "POST",
    body: data,
  });
}

export function reenviarOtp(
  data: OtpSolicitarFormValues,
): Promise<OtpSolicitarResponse> {
  return request({
    schema: OtpSolicitarResponseSchema,
    path: "/auth/otp/reenviar",
    method: "POST",
    body: data,
  });
}

export function validarOtp(
  data: OtpValidarFormValues,
): Promise<OtpValidarResponse> {
  return request({
    schema: OtpValidarResponseSchema,
    path: "/auth/otp/validar",
    method: "POST",
    body: data,
  });
}

export function crearSolicitud(
  token: string,
  data: SolicitudFormValues,
): Promise<SolicitudCrearResponse> {
  return request({
    schema: SolicitudCrearResponseSchema,
    path: "/solicitudes",
    method: "POST",
    body: {
      cuil: data.cuil,
      nombre_completo: data.nombreCompleto,
      fecha_nacimiento: data.fechaNacimiento,
      email: data.email,
      circunscripcion: data.circunscripcion,
    },
    token,
  });
}

export function consultarSolicitud(
  params: ConsultaFormValues,
): Promise<ConsultaResponse> {
  return request({
    schema: ConsultaResponseSchema,
    path: "/solicitudes/consulta",
    query: {
      codigo: params.codigo,
      dni: params.dni,
      email: params.email,
    },
  });
}

export function historialSolicitudes(
  token: string,
): Promise<HistorialResponse> {
  return request({
    schema: HistorialResponseSchema,
    path: "/solicitudes/historial",
    token,
  });
}

export async function descargarSolicitud(
  token: string,
  codigo: string,
): Promise<string> {
  const base = new URL(API_BASE_URL);
  const finalUrl = new URL(`/solicitudes/${codigo}/download`, base.toString());

  const response = await fetch(finalUrl.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    redirect: "manual",
  });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("Location") || response.headers.get("location");
    if (!location) {
      throw new ApiError(500, "Respuesta sin URL de descarga");
    }
    return location;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response.status, text || "API error");
  }

  const json = (await response.json()) as { url?: string };
  if (json.url) {
    return json.url;
  }

  throw new ApiError(500, "Respuesta invalida");
}
