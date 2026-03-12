import type { Action, Role } from "@/types";
export type { Action } from "@/types";

export const PERMISSIONS: Record<Role, Action[]> = {
  OPERARIO: [
    "upload:pdf",
  ],
  SUPERVISOR: [
    "view:dashboard",
    "view:equipo",
    "view:all_solicitudes",
    "manage:operarios",
    "upload:pdf",
  ],
};

export function canDo(role: Role, action: Action): boolean {
  return PERMISSIONS[role]?.includes(action) ?? false;
}
