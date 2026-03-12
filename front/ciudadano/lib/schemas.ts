import { z } from "zod";

export const CircunscripcionSchema = z.enum([
  "SANTA_FE",
  "ROSARIO",
  "VENADO_TUERTO",
  "RAFAELA",
  "RECONQUISTA",
]);

export const EstadoSolicitudSchema = z.enum([
  "PENDIENTE_PAGO",
  "PAGADA",
  "RECHAZADA",
  "EMITIDA",
  "VENCIDO",
  "PUBLICADO_VENCIDO",
]);

export const OtpSolicitarFormSchema = z.object({
  dni: z.string().regex(/^\d{7,8}$/, "DNI invalido"),
  email: z.string().email("Email invalido"),
  captchaToken: z.string().min(1, "Captcha requerido"),
});

export const OtpValidarFormSchema = z.object({
  dni: z.string().regex(/^\d{7,8}$/, "DNI invalido"),
  email: z.string().email("Email invalido"),
  codigo: z.string().regex(/^\d{6}$/, "Codigo invalido"),
});

export const SolicitudFormSchema = z.object({
  cuil: z.string().regex(/^\d{11}$/, "CUIL invalido"),
  nombreCompleto: z.string().min(3, "Nombre obligatorio"),
  fechaNacimiento: z.string().min(1, "Fecha obligatoria"),
  email: z.string().email("Email invalido"),
  circunscripcion: CircunscripcionSchema,
});

export const ConsultaFormSchema = z
  .object({
    codigo: z.string().optional(),
    dni: z.string().optional(),
    email: z.string().optional(),
  })
  .refine(
    (data) =>
      Boolean(data.codigo) ||
      (Boolean(data.dni) && Boolean(data.email)),
    {
      message: "Ingresa codigo o DNI y email",
      path: ["codigo"],
    },
  );

export const OtpSolicitarResponseSchema = z.object({
  message: z.string(),
  expires_in: z.number().int().nonnegative(),
});

export const OtpValidarResponseSchema = z.object({
  access_token: z.string(),
  message: z.string(),
  expires_in: z.string(),
});

export const SolicitudCrearResponseSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  estado: EstadoSolicitudSchema,
  created_at: z.string(),
  url_pago: z.string().url(),
  monto: z.number(),
  mensaje: z.string(),
});

export const ConsultaTimelineSchema = z.object({
  estado: EstadoSolicitudSchema,
  fecha: z.string(),
  descripcion: z.string(),
});

export const ConsultaResponseSchema = z.object({
  codigo: z.string(),
  nombre_completo: z.string(),
  circunscripcion: CircunscripcionSchema,
  estado: EstadoSolicitudSchema,
  observaciones_rechazo: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  timeline: z.array(ConsultaTimelineSchema),
});

export const HistorialItemSchema = z.object({
  codigo: z.string(),
  estado: EstadoSolicitudSchema,
  circunscripcion: CircunscripcionSchema,
  created_at: z.string(),
  pdf_disponible: z.boolean(),
  fecha_vencimiento: z.string().nullable(),
  pdf_url: z.string().url().optional(),
});

export const HistorialResponseSchema = z.object({
  solicitudes: z.array(HistorialItemSchema),
});

export type OtpSolicitarFormValues = z.infer<typeof OtpSolicitarFormSchema>;
export type OtpValidarFormValues = z.infer<typeof OtpValidarFormSchema>;
export type SolicitudFormValues = z.infer<typeof SolicitudFormSchema>;
export type ConsultaFormValues = z.infer<typeof ConsultaFormSchema>;
export type OtpSolicitarResponse = z.infer<typeof OtpSolicitarResponseSchema>;
export type OtpValidarResponse = z.infer<typeof OtpValidarResponseSchema>;
export type SolicitudCrearResponse = z.infer<typeof SolicitudCrearResponseSchema>;
export type ConsultaResponse = z.infer<typeof ConsultaResponseSchema>;
export type HistorialResponse = z.infer<typeof HistorialResponseSchema>;
