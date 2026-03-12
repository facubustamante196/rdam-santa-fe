export type Role = "OPERARIO" | "SUPERVISOR";

export type Action =
  | "view:dashboard"
  | "view:equipo"
  | "view:all_solicitudes"
  | "manage:operarios"
  | "upload:pdf"
  | "emit:certificado";

export type EstadoSolicitud =
  | "PENDIENTE_PAGO"
  | "PAGADA"
  | "RECHAZADA"
  | "EMITIDA"
  | "VENCIDO"
  | "PUBLICADO_VENCIDO";

export type Circunscripcion =
  | "SANTA_FE"
  | "ROSARIO"
  | "VENADO_TUERTO"
  | "RAFAELA"
  | "RECONQUISTA";

export interface Operario {
  id: string;
  username: string;
  nombreCompleto: string;
  rol: "OPERARIO";
  circunscripcion: Circunscripcion;
  activo: boolean;
}

export interface AdminUsuariosResponse {
  operarios: Operario[];
}
