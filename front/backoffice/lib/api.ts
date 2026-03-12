import {
  AlertasSlaResponseSchema,
  DashboardSchema,
  OperarioListSchema,
  SolicitudListResponseSchema,
  SolicitudSchema,
} from "@/lib/schemas";
import type {
  AlertasSlaResponse,
  Dashboard,
  OperariosResponse,
  Solicitud,
  SolicitudListResponse,
} from "@/lib/schemas";
import type { EstadoSolicitud } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

type RequestOptions<T> = {
  token: string;
  schema: { parse: (data: unknown) => T };
  path: string;
  method?: "GET" | "POST" | "PATCH";
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
  token,
  schema,
  path,
  method = "GET",
  body,
  query,
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
      Authorization: `Bearer ${token}`,
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

export async function fetchSolicitudes(params: {
  token: string;
  estado?: EstadoSolicitud;
  circunscripcion?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  dni?: string;
  page?: number;
  limit?: number;
}): Promise<SolicitudListResponse> {
  return request({
    token: params.token,
    schema: SolicitudListResponseSchema,
    path: "/admin/solicitudes",
    query: {
      estado: params.estado,
      circunscripcion: params.circunscripcion,
      fecha_desde: params.fechaDesde,
      fecha_hasta: params.fechaHasta,
      dni: params.dni,
      page: params.page,
      limit: params.limit,
    },
  });
}

export async function fetchSolicitudById(
  token: string,
  id: string,
): Promise<Solicitud> {
  return request({
    token,
    schema: SolicitudSchema,
    path: `/admin/solicitudes/${id}`,
  });
}

export async function fetchDashboard(
  token: string,
  circunscripcion?: string,
): Promise<Dashboard> {
  return request({
    token,
    schema: DashboardSchema,
    path: "/admin/dashboard",
    query: { circunscripcion },
  });
}

export async function fetchAlertasSla(
  token: string,
): Promise<AlertasSlaResponse> {
  return request({
    token,
    schema: AlertasSlaResponseSchema,
    path: "/admin/solicitudes/alertas",
  });
}

export async function fetchOperarios(token: string): Promise<OperariosResponse> {
  const raw = await request({
    token,
    schema: { parse: (value: unknown) => value },
    path: "/admin/usuarios",
  });

  const normalized =
    raw && typeof raw === "object" && "operarios" in (raw as Record<string, unknown>)
      ? {
          operarios: (raw as { operarios: Array<Record<string, unknown>> }).operarios.map(
            (item) => ({
              id: item.id,
              username: item.username ?? item.usuario,
              nombreCompleto: item.nombreCompleto ?? item.nombre_completo,
              rol: item.rol,
              circunscripcion: item.circunscripcion,
              activo: item.activo,
            }),
          ),
        }
      : raw;

  try {
    return OperarioListSchema.parse(normalized);
  } catch (error) {
    throw new ApiError(500, "Respuesta invalida", error);
  }
}
