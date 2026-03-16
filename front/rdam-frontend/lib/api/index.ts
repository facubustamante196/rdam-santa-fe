// ─── API Client for RDAM ──────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.rdam.jussantafe.gov.ar";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;

  const headers: HeadersInit = {
    ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, `HTTP ${res.status}`, body);
  }

  return res.json() as Promise<T>;
}

// ─── Response Types ────────────────────────────────────────────────────────────

export interface OtpSolicitarResponse {
  message: string;
  expires_in: number;
  _dev_otp?: string;
}

export interface OtpValidarResponse {
  access_token: string;
  expires_in: number;
}

export interface SolicitudResponse {
  id: string;
  codigo: string;
  estado: EstadoSolicitud;
  url_pago: string;
}

export interface ConsultaResponse {
  estado: EstadoSolicitud;
  downloadUrl?: string;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  estado: string;
  fecha: string;
  observacion?: string;
}

export type EstadoSolicitud =
  | "PENDIENTE_PAGO"
  | "PENDIENTE"
  | "EN_PROCESO"
  | "EMITIDA"
  | "RECHAZADA"
  | "VENCIDA";

export interface AdminSolicitud {
  id: string;
  codigo: string;
  nombre: string;
  cuil: string;
  circunscripcion: string;
  estado: EstadoSolicitud;
  creado_en: string;
  operario_asignado?: string;
}

export interface DashboardMetrics {
  total: number;
  pendientes: number;
  emitidas: number;
  rechazadas: number;
  vencidas: number;
  tiempo_promedio_hs: number;
  por_circunscripcion: { circunscripcion: string; total: number }[];
}

export interface Usuario {
  id: string;
  username: string;
  nombre: string;
  rol: "OPERARIO" | "SUPERVISOR";
  circunscripcion?: string;
  activo: boolean;
  creado_en: string;
}

export interface AuditoriaLog {
  id: string;
  usuario: string;
  accion: string;
  solicitud_id?: string;
  detalle: string;
  fecha: string;
}

export interface AlertaSLA {
  id: string;
  codigo: string;
  nombre: string;
  circunscripcion: string;
  nivel: "BAJO" | "MEDIO" | "ALTO" | "CRITICO";
  horas_demora: number;
}

// ─── Citizen API ───────────────────────────────────────────────────────────────

export const api = {
  auth: {
    solicitarOtp: (body: { dni: string; email: string; captchaToken?: string }) =>
      request<OtpSolicitarResponse>("/auth/otp/solicitar", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    validarOtp: (body: { dni: string; email: string; codigo: string }) =>
      request<OtpValidarResponse>("/auth/otp/validar", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    reenviarOtp: (body: { dni: string; email: string; captchaToken?: string }) =>
      request<OtpSolicitarResponse>("/auth/otp/reenviar", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },

  solicitudes: {
    crear: (
      body: {
        cuil: string;
        nombre_completo: string;
        fecha_nacimiento: string;
        email: string;
        circunscripcion: string;
      },
      token: string
    ) =>
      request<SolicitudResponse>("/solicitudes", {
        method: "POST",
        body: JSON.stringify(body),
        token,
      }),

    consultar: (params: { codigo?: string; dni?: string; email?: string }) => {
      const query = new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).filter(([, v]) => !!v) as [string, string][]
        )
      );
      return request<ConsultaResponse>(`/solicitudes/consulta?${query}`);
    },

    historial: (token: string) =>
      request<AdminSolicitud[]>("/solicitudes/historial", { token }),

    descargar: (codigo: string, dni: string, token: string) =>
      `${BASE_URL}/solicitudes/${codigo}/download?dni=${dni}&token=${token}`,
  },

  pagos: {
    iniciar: (codigo_solicitud: string, token: string) =>
      request<{
        transaccion_id: string;
        url_pago: string;
        checkout_fields: Record<string, string>;
      }>("/pagos/iniciar", {
        method: "POST",
        body: JSON.stringify({ codigo_solicitud }),
        token,
      }),
  },

  // ─── Admin API ───────────────────────────────────────────────────────────────

  admin: {
    login: (body: { username: string; password: string }) =>
      request<{ access_token: string; usuario: Usuario }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    refresh: (refresh_token: string) =>
      request<{ access_token: string }>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token }),
      }),

    solicitudes: {
      listar: (
        params: {
          estado?: string;
          circunscripcion?: string;
          desde?: string;
          hasta?: string;
          search?: string;
          dni_hash?: string;
          page?: number;
          limit?: number;
        },
        token: string
      ) => {
        const query = new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)])
          )
        );
        return request<{ data: AdminSolicitud[]; total: number }>(
          `/admin/solicitudes?${query}`,
          { token }
        );
      },

      detalle: (id: string, token: string) =>
        request<AdminSolicitud>(`/admin/solicitudes/${id}`, { token }),

      cargarPdf: (id: string, formData: FormData, token: string) =>
        request<{ estado: string }>(`/admin/solicitudes/${id}/pdf`, {
          method: "POST",
          body: formData,
          headers: { Authorization: `Bearer ${token}` },
        }),

      cambiarEstado: (
        id: string,
        body: { estado: string; observaciones: string },
        token: string
      ) =>
        request<{ estado: string }>(`/admin/solicitudes/${id}/estado`, {
          method: "PATCH",
          body: JSON.stringify(body),
          token,
        }),

      asignar: (id: string, operario_id: string, token: string) =>
        request<{ operario_asignado: string }>(
          `/admin/solicitudes/${id}/asignar`,
          {
            method: "PATCH",
            body: JSON.stringify({ operario_id }),
            token,
          }
        ),

      alertas: (
        params: { nivel?: string; circunscripcion?: string },
        token: string
      ) => {
        const query = new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).filter(([, v]) => !!v) as [string, string][]
          )
        );
        return request<AlertaSLA[]>(`/admin/solicitudes/alertas?${query}`, {
          token,
        });
      },

      vencidas: (
        params: { estado?: string; circunscripcion?: string },
        token: string
      ) => {
        const query = new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).filter(([, v]) => !!v) as [string, string][]
          )
        );
        return request<{ data: AdminSolicitud[]; total: number }>(
          `/admin/solicitudes/vencidas?${query}`,
          { token }
        );
      },
    },

    dashboard: (periodo: string, token: string) =>
      request<DashboardMetrics>(`/admin/dashboard?periodo=${periodo}`, {
        token,
      }),

    auditoria: (
      params: {
        solicitud_id?: string;
        usuario_id?: string;
        accion?: string;
        desde?: string;
        hasta?: string;
      },
      token: string
    ) => {
      const query = new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).filter(([, v]) => !!v) as [string, string][]
        )
      );
      return request<{ logs: AuditoriaLog[]; total: number }>(
        `/admin/auditoria?${query}`,
        { token }
      );
    },

    usuarios: {
      listar: (token: string) =>
        request<Usuario[]>("/admin/usuarios", { token }),

      crear: (
        body: { username: string; password: string; nombreCompleto: string; circunscripcion: string },
        token: string
      ) =>
        request<Usuario>("/admin/usuarios", {
          method: "POST",
          body: JSON.stringify(body),
          token,
        }),

      actualizar: (
        id: string,
        body: { activo?: boolean; circunscripcion?: string; nombreCompleto?: string; username?: string; rol?: string },
        token: string
      ) =>
        request<Usuario>(`/admin/usuarios/${id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
          token,
        }),
    },
  },
};
