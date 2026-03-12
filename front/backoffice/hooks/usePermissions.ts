"use client";

import { useSession } from "next-auth/react";
import { canDo } from "@/lib/permissions";
import { Action, Role } from "@/types";

export function usePermissions() {
  const { data } = useSession();
  const role = (data?.user?.role ?? "OPERARIO") as Role;

  const can = (action: Action) => canDo(role, action);

  return {
    role,
    can,
    canAsignarOperario: can("assign:solicitud"),
    canCambiarEstado: can("force:estado"),
  };
}
