"use client";

import { useState } from "react";
import { ConsultaForm } from "@/components/forms/ConsultaForm";
import type { ConsultaResponse } from "@/lib/schemas";

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-AR");
};

export default function Page() {
  const [result, setResult] = useState<ConsultaResponse | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          Consultar estado
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          Consulta por codigo o DNI y email.
        </p>
        <div className="mt-4">
          <ConsultaForm onSuccess={setResult} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {result ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">Codigo</p>
              <p className="text-lg font-semibold text-slate-900">
                {result.codigo}
              </p>
              <p className="text-sm text-slate-600">
                {result.nombre_completo} - {result.circunscripcion}
              </p>
            </div>
            <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
              Estado actual: <strong>{result.estado}</strong>
              {result.observaciones_rechazo ? (
                <p className="mt-2 text-xs text-red-600">
                  {result.observaciones_rechazo}
                </p>
              ) : null}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Timeline</p>
              <div className="mt-3 space-y-2">
                {result.timeline.map((item, index) => (
                  <div
                    key={`${item.estado}-${index}`}
                    className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600"
                  >
                    <p className="font-semibold text-slate-700">{item.estado}</p>
                    <p>{formatDate(item.fecha)}</p>
                    <p>{item.descripcion}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Ingresa un codigo o DNI para ver el detalle.
          </p>
        )}
      </section>
    </div>
  );
}
