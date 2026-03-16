import { z } from "zod";

// ─── Auth Schemas ──────────────────────────────────────────────────────────────

export const otpSolicitarSchema = z.object({
  dni: z
    .string()
    .min(7, "El DNI debe tener al menos 7 dígitos")
    .max(8, "El DNI no puede superar 8 dígitos")
    .regex(/^\d+$/, "El DNI solo debe contener números"),
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Ingresá un email válido"),
});

export const otpValidarSchema = z.object({
  codigo: z
    .string()
    .length(6, "El código debe tener exactamente 6 dígitos")
    .regex(/^\d+$/, "El código solo debe contener números"),
});

export const adminLoginSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

// ─── Solicitud Schema ──────────────────────────────────────────────────────────

export const CIRCUNSCRIPCIONES = [
  { id: "1", label: "1ª Circunscripción", ciudad: "Santa Fe", color: "#1e40af", enum: "SANTA_FE" },
  { id: "2", label: "2ª Circunscripción", ciudad: "Rosario", color: "#7c3aed", enum: "ROSARIO" },
  { id: "3", label: "3ª Circunscripción", ciudad: "Venado Tuerto", color: "#065f46", enum: "VENADO_TUERTO" },
  { id: "4", label: "4ª Circunscripción", ciudad: "Reconquista", color: "#92400e", enum: "RECONQUISTA" },
  { id: "5", label: "5ª Circunscripción", ciudad: "Rafaela", color: "#9f1239", enum: "RAFAELA" },
] as const;

export const CIRC_ID_TO_ENUM: Record<string, string> = {
  "1": "SANTA_FE",
  "2": "ROSARIO",
  "3": "VENADO_TUERTO",
  "4": "RECONQUISTA",
  "5": "RAFAELA",
};

export const CIRC_ENUM_TO_ID: Record<string, string> = {
  "SANTA_FE": "1",
  "ROSARIO": "2",
  "VENADO_TUERTO": "3",
  "RECONQUISTA": "4",
  "RAFAELA": "5",
};

export type CircunscripcionId = (typeof CIRCUNSCRIPCIONES)[number]["id"];

export const solicitudSchema = z.object({
  cuil: z
    .string()
    .min(1, "El CUIL es requerido")
    .regex(/^\d{2}-\d{8}-\d{1}$/, "Formato de CUIL inválido (ej: 20-12345678-9)"),
  nombre: z
    .string()
    .min(2, "El nombre completo es requerido")
    .max(120, "El nombre es demasiado largo"),
  fecha_nacimiento: z
    .string()
    .min(1, "La fecha de nacimiento es requerida")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Ingresá un email válido"),
  circunscripcion: z
    .string()
    .min(1, "Seleccioná una circunscripción"),
});

export const consultaSchema = z.union([
  z.object({
    tipo: z.literal("codigo"),
    codigo: z.string().min(1, "El código es requerido"),
    dni: z.string().optional(),
    email: z.string().optional(),
  }),
  z.object({
    tipo: z.literal("dniemail"),
    codigo: z.string().optional(),
    dni: z
      .string()
      .min(7, "El DNI debe tener al menos 7 dígitos")
      .max(8, "El DNI no puede superar 8 dígitos")
      .regex(/^\d+$/, "Solo números"),
    email: z.string().email("Email inválido"),
  }),
]);

// ─── Admin Schemas ─────────────────────────────────────────────────────────────

export const crearOperarioSchema = z.object({
  username: z.string().min(3, "Mínimo 3 caracteres"),
  nombreCompleto: z.string().min(2, "El nombre es requerido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  circunscripcion: z.string().min(1, "Seleccioná una circunscripción"),
});

export const actualizarUsuarioSchema = z.object({
  nombreCompleto: z.string().min(2, "El nombre es requerido"),
  username: z.string().min(3, "Mínimo 3 caracteres"),
  rol: z.enum(["OPERARIO", "SUPERVISOR"]),
  circunscripcion: z.string().min(1, "Seleccioná una circunscripción"),
  activo: z.boolean(),
});

export const cambioEstadoSchema = z.object({
  estado: z.string().min(1, "Seleccioná un estado"),
  observaciones: z.string().min(5, "Ingresá observaciones"),
});

// ─── Types ─────────────────────────────────────────────────────────────────────

export type OtpSolicitarInput = z.infer<typeof otpSolicitarSchema>;
export type OtpValidarInput = z.infer<typeof otpValidarSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type SolicitudInput = z.infer<typeof solicitudSchema>;
export type ConsultaInput = z.infer<typeof consultaSchema>;
export type CrearOperarioInput = z.infer<typeof crearOperarioSchema>;
export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>;
export type CambioEstadoInput = z.infer<typeof cambioEstadoSchema>;
