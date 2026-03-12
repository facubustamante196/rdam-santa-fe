"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchAlertasSla, fetchDashboard } from "@/lib/api";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { WorkloadTable } from "@/components/dashboard/WorkloadTable";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/hooks/usePermissions";
import { Select } from "@/components/ui/select";

export default function Page() {
  const { can } = usePermissions();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [circunscripcion, setCircunscripcion] = useState("");
  const { data } = useQuery({
    queryKey: ["dashboard", circunscripcion],
    queryFn: () => fetchDashboard(token ?? "", circunscripcion || undefined),
    enabled: !!token,
  });

  const { data: alertas } = useQuery({
    queryKey: ["alertas-sla"],
    queryFn: () => fetchAlertasSla(token ?? ""),
    enabled: !!token,
  });

  if (!data) {
    return <div className="text-sm text-slate-500">Cargando dashboard...</div>;
  }

  const kpis = [
    { label: "Total", value: data.total_solicitudes },
    {
      label: "Pendientes pago",
      value: data.solicitudes_por_estado.PENDIENTE_PAGO ?? 0,
    },
    { label: "Pagadas", value: data.solicitudes_por_estado.PAGADA ?? 0 },
    { label: "Emitidas", value: data.solicitudes_por_estado.EMITIDA ?? 0 },
  ];

  const circEntries = Object.entries(data.solicitudes_por_circunscripcion);

  return (
    <div className="space-y-6">
      {can("view:dashboard") ? (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Circunscripcion
            </p>
            <p className="text-sm text-slate-600">
              {circunscripcion || "Todas"}
            </p>
          </div>
          <Select
            className="w-full max-w-[220px]"
            value={circunscripcion}
            onChange={(event) => setCircunscripcion(event.target.value)}
          >
            <option value="">Todas</option>
            <option value="SANTA_FE">SANTA_FE</option>
            <option value="ROSARIO">ROSARIO</option>
            <option value="VENADO_TUERTO">VENADO_TUERTO</option>
            <option value="RAFAELA">RAFAELA</option>
            <option value="RECONQUISTA">RECONQUISTA</option>
          </Select>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900">
            Solicitudes por circunscripcion
          </h3>
          <div className="mt-4 grid grid-cols-2 items-end gap-3 text-xs text-slate-500 md:grid-cols-3 xl:grid-cols-5">
            {circEntries.map(([circ, value]) => (
              <div key={circ} className="flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-md bg-primary-light"
                  style={{ height: `${Math.max(32, value / 3)}px` }}
                />
                <span>{circ}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <WorkloadTable
            items={Object.entries(data.solicitudes_por_circunscripcion).map(
              ([label, total]) => ({
                label,
                total,
              }),
            )}
          />
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Alertas SLA</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {(alertas?.alertas ?? []).map((alert) => (
                <li
                  key={alert.codigo}
                  className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2"
                >
                  <span>{alert.nombre}</span>
                  <span className="text-xs text-slate-500">
                    {alert.horas_demora}h - {alert.nivel}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
