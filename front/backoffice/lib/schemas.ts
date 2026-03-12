import { z } from "zod";

export const RoleSchema = z.enum(["OPERARIO", "SUPERVISOR"]);

export const EstadoSolicitudSchema = z.enum([
  "PENDIENTE_PAGO",
  "PAGADA",
  "RECHAZADA",
  "EMITIDA",
  "VENCIDO",
  "PUBLICADO_VENCIDO",
]);

export const CircunscripcionSchema = z.enum([
  "SANTA_FE",
  "ROSARIO",
  "VENADO_TUERTO",
  "RAFAELA",
  "RECONQUISTA",
]);

export const OperarioAsignadoSchema = z.object({
  id: z.string(),
  nombreCompleto: z.string(),
});

export const SolicitudListItemSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  nombreCompleto: z.string(),
  email: z.string().email(),
  circunscripcion: CircunscripcionSchema,
  estado: EstadoSolicitudSchema,
  operarioAsignado: OperarioAsignadoSchema.nullable(),
  issuedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SolicitudListResponseSchema = z.object({
  data: z.array(SolicitudListItemSchema),
  meta: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().positive(),
  }),
});

export const AuditoriaSchema = z.object({
  id: z.string(),
  accion: z.string(),
  actorTipo: z.string(),
  estadoAnterior: z.string().nullable().optional(),
  estadoNuevo: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
  timestamp: z.string(),
  usuario: z
    .object({
      id: z.string(),
      nombreCompleto: z.string(),
    })
    .nullable()
    .optional(),
});

export const SolicitudSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  dniEnmascarado: z.string(),
  cuilEnmascarado: z.string(),
  nombreCompleto: z.string(),
  fechaNacimiento: z.string(),
  email: z.string().email(),
  circunscripcion: CircunscripcionSchema,
  estado: EstadoSolicitudSchema,
  puede_cargar_pdf: z.boolean(),
  operarioAsignado: OperarioAsignadoSchema.nullable(),
  pdfUrl: z.string().nullable(),
  issuedAt: z.string().nullable(),
  fechaVencimiento: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  registrosAuditoria: z.array(AuditoriaSchema),
  transaccionesPago: z.array(z.unknown()).optional(),
});

export const OperarioSchema = z.object({
  id: z.string(),
  username: z.string(),
  nombreCompleto: z.string(),
  rol: RoleSchema,
  circunscripcion: CircunscripcionSchema,
  activo: z.boolean(),
});

export const LoginFormSchema = z.object({
  username: z.string().min(1, "El usuario es obligatorio"),
  password: z.string().min(1, "La contrasena es obligatoria"),
});

export const NuevoOperarioSchema = z.object({
  nombre: z.string().min(2, "Nombre obligatorio"),
  usuario: z.string().min(3, "Usuario obligatorio"),
  rol: RoleSchema,
  circunscripcion: CircunscripcionSchema,
});

export const RechazarSolicitudSchema = z.object({
  observaciones: z
    .string()
    .min(10, "Las observaciones deben tener al menos 10 caracteres"),
});

export const ForzarEstadoSchema = z.object({
  estado: EstadoSolicitudSchema,
  motivo: z.string().min(1, "El motivo es obligatorio"),
});

export const OperarioListSchema = z.object({
  operarios: z.array(OperarioSchema),
});

export const AlertaSlaSchema = z.object({
  codigo: z.string(),
  nombre: z.string(),
  circunscripcion: CircunscripcionSchema,
  estado: EstadoSolicitudSchema,
  horas_demora: z.number(),
  nivel: z.enum(["CRITICO", "ALTA", "MEDIA"]),
});

export const AlertasSlaResponseSchema = z.object({
  alertas: z.array(AlertaSlaSchema),
  total: z.number().int().nonnegative(),
});

export const DashboardSchema = z.object({
  solicitudes_por_estado: z.record(z.string(), z.number()),
  total_solicitudes: z.number().int().nonnegative(),
  solicitudes_hoy: z.number().int().nonnegative(),
  solicitudes_por_circunscripcion: z.record(z.string(), z.number()),
  tiempos_promedio: z.object({
    pago_dias: z.number().nullable(),
    emision_dias: z.number().nullable(),
  }),
  sla: z.object({
    dentro_plazo: z.number().int().nonnegative(),
    fuera_plazo: z.number().int().nonnegative(),
    porcentaje_cumplimiento: z.number().int().nonnegative(),
  }),
});

export const LoginResponseSchema = z.object({
  access_token: z.string(),
  usuario: z.object({
    id: z.string(),
    username: z.string(),
    nombreCompleto: z.string(),
    rol: RoleSchema,
    circunscripcion: CircunscripcionSchema,
  }),
});

export type Solicitud = z.infer<typeof SolicitudSchema>;
export type SolicitudListItem = z.infer<typeof SolicitudListItemSchema>;
export type SolicitudListResponse = z.infer<typeof SolicitudListResponseSchema>;
export type Operario = z.infer<typeof OperarioSchema>;
export type OperariosResponse = z.infer<typeof OperarioListSchema>;
export type LoginFormValues = z.infer<typeof LoginFormSchema>;
export type NuevoOperarioValues = z.infer<typeof NuevoOperarioSchema>;
export type RechazarSolicitudValues = z.infer<typeof RechazarSolicitudSchema>;
export type ForzarEstadoValues = z.infer<typeof ForzarEstadoSchema>;
export type Dashboard = z.infer<typeof DashboardSchema>;
export type AlertasSlaResponse = z.infer<typeof AlertasSlaResponseSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
