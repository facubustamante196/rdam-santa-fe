"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getOperarios } from "@/lib/api";
import { usePermissions } from "@/hooks/usePermissions";
import { useSession } from "next-auth/react";
import type { Circunscripcion } from "@/types";

export default function Page() {
  const { role } = usePermissions();
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const router = useRouter();
  const { data: operarios, isLoading } = useQuery({
    queryKey: ["operarios"],
    queryFn: () => getOperarios(token ?? ""),
    enabled: status === "authenticated" && role === "SUPERVISOR" && !!token,
  });

  useEffect(() => {
    if (status === "authenticated" && role === "OPERARIO") {
      router.replace("/solicitudes");
    }
  }, [role, router, status]);

  const circColors: Record<Circunscripcion, string> = {
    SANTA_FE: "bg-blue-100 text-blue-800",
    ROSARIO: "bg-amber-100 text-amber-800",
    VENADO_TUERTO: "bg-emerald-100 text-emerald-800",
    RAFAELA: "bg-purple-100 text-purple-800",
    RECONQUISTA: "bg-rose-100 text-rose-800",
  };

  if (isLoading || !operarios) {
    return <div className="text-sm text-slate-500">Cargando operarios...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre completo</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Circunscripcion</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {operarios.operarios.map((operario) => (
              <tr
                key={operario.id}
                className="border-b border-slate-100 last:border-b-0"
              >
                <td className="px-4 py-3 font-medium text-slate-800">
                  {operario.nombreCompleto}
                </td>
                <td className="px-4 py-3">{operario.username}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      circColors[operario.circunscripcion]
                    }`}
                  >
                    {operario.circunscripcion}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      operario.activo
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {operario.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
