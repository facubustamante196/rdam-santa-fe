"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function Page() {
  const params = useSearchParams();
  const estado = params.get("estado");
  const codigo = params.get("codigo");
  const success = estado === "success";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">
        Resultado del pago
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">
        {success ? "Pago exitoso" : "Pago rechazado"}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {success
          ? "Tu pago fue procesado correctamente."
          : "No pudimos procesar tu pago. Intenta nuevamente."}
      </p>
      <div className="mt-6 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
        <p>
          <span className="font-semibold text-slate-700">Codigo:</span>{" "}
          {codigo ?? "-"}
        </p>
        <p>
          <span className="font-semibold text-slate-700">Estado:</span>{" "}
          {estado ?? "-"}
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/consultar"
          className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Consultar estado
        </Link>
        <Link
          href="/historial"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          Ver historial
        </Link>
      </div>
    </div>
  );
}
