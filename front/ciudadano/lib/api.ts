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

type RequestOptions<T> = {
  schema: { parse: (data: unknown) => T };
  path: string;
  method?: "GET" | "POST";
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
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
}: RequestOptions<T>): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const finalUrl = new URL(normalizedPath, "http://localhost");
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        finalUrl.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(finalUrl.toString().replace("http://localhost", ""), {
    method,
    headers: {
      "Content-Type": "application/json",
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
    path: "/api/otp/solicitar",
    method: "POST",
    body: data,
  });
}

export function reenviarOtp(
  data: OtpSolicitarFormValues,
): Promise<OtpSolicitarResponse> {
  return request({
    schema: OtpSolicitarResponseSchema,
    path: "/api/otp/reenviar",
    method: "POST",
    body: data,
  });
}

export function validarOtp(
  data: OtpValidarFormValues,
): Promise<OtpValidarResponse> {
  return request({
    schema: OtpValidarResponseSchema,
    path: "/api/otp/validar",
    method: "POST",
    body: data,
  });
}

export function crearSolicitud(
  data: SolicitudFormValues,
): Promise<SolicitudCrearResponse> {
  return request({
    schema: SolicitudCrearResponseSchema,
    path: "/api/solicitudes",
    method: "POST",
    body: {
      cuil: data.cuil,
      nombre_completo: data.nombreCompleto,
      fecha_nacimiento: data.fechaNacimiento,
      email: data.email,
      circunscripcion: data.circunscripcion,
    },
  });
}

export function consultarSolicitud(
  params: ConsultaFormValues,
): Promise<ConsultaResponse> {
  return request({
    schema: ConsultaResponseSchema,
    path: "/api/solicitudes/consulta",
    query: {
      codigo: params.codigo,
      dni: params.dni,
      email: params.email,
    },
  });
}

export function historialSolicitudes(): Promise<HistorialResponse> {
  return request({
    schema: HistorialResponseSchema,
    path: "/api/solicitudes/historial",
  });
}

export async function descargarSolicitud(codigo: string): Promise<string> {
  const response = await fetch(`/api/solicitudes/${codigo}/download`, {
    method: "GET",
  });

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

export async function checkOtpSession(): Promise<{ authenticated: boolean }> {
  const response = await fetch("/api/session", { method: "GET" });
  if (!response.ok) {
    return { authenticated: false };
  }
  return (await response.json()) as { authenticated: boolean };
}
