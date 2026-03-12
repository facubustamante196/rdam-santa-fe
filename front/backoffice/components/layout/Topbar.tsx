"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/solicitudes": "Solicitudes",
  "/equipo": "Equipo",
};

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const title =
    Object.keys(titles).find((key) => pathname.startsWith(key)) ?? "";
  const circunscripcion = session?.user?.circunscripcion;
  const role = session?.user?.role;
  const circunscripcionLabel =
    role === "SUPERVISOR" ? "Todas" : circunscripcion;

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900">
          {titles[title] ?? "Panel RDAM"}
        </h1>
        <p className="text-xs text-slate-500">
          Registro de Deudores Alimentarios Morosos
        </p>
      </div>
      <div className="flex items-center gap-2">
        {circunscripcionLabel ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
            {circunscripcionLabel}
          </span>
        ) : null}
        <input
          className="hidden w-64 rounded-md border border-slate-200 px-3 py-2 text-sm md:block"
          placeholder="Buscar solicitud o ciudadano"
        />
        <Button variant="outline">Exportar</Button>
      </div>
    </header>
  );
}
