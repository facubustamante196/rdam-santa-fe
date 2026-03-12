export type Role = "OPERARIO" | "SUPERVISOR";

export type Action =
  | "view:dashboard"
  | "view:equipo"
  | "view:all_solicitudes"
  | "assign:solicitud"
  | "force:estado"
  | "manage:operarios"
  | "upload:pdf"
  | "emit:certificado"
  | "reject:solicitud";

export type EstadoSolicitud =
  | "PENDIENTE_PAGO"
  | "PAGADA"
  | "RECHAZADA"
  | "EMITIDA"
  | "VENCIDO"
  | "PUBLICADO_VENCIDO";
