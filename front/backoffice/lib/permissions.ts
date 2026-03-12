import type { Action, Role } from "@/types";
export type { Action } from "@/types";

export const PERMISSIONS: Record<Role, Action[]> = {
  OPERARIO: [
    "upload:pdf",
    "emit:certificado",
    "reject:solicitud",
  ],
  SUPERVISOR: [
    "view:dashboard",
    "view:equipo",
    "view:all_solicitudes",
    "force:estado",
    "manage:operarios",
    "upload:pdf",
    "emit:certificado",
    "reject:solicitud",
  ],
};

export function canDo(role: Role, action: Action): boolean {
  return PERMISSIONS[role]?.includes(action) ?? false;
}
