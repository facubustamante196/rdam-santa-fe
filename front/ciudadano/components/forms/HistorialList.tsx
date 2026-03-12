"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { descargarSolicitud, historialSolicitudes } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function HistorialList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["historial"],
    queryFn: () => historialSolicitudes(),
  });

  const downloadMutation = useMutation({
    mutationFn: (codigo: string) => descargarSolicitud(codigo),
    onSuccess: (url) => {
      if (typeof window !== "undefined") {
        window.location.href = url;
      }
    },
  });

  if (isLoading) {
    return <p className="text-sm text-slate-500">Cargando historial...</p>;
  }

  if (error || !data) {
    return (
      <p className="text-sm text-slate-500">
        No se pudo cargar el historial.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Codigo</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Circunscripcion</th>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.solicitudes.map((item) => (
            <tr key={item.codigo} className="border-b border-slate-100">
              <td className="px-4 py-3 font-medium text-slate-800">
                {item.codigo}
              </td>
              <td className="px-4 py-3">{item.estado}</td>
              <td className="px-4 py-3">{item.circunscripcion}</td>
              <td className="px-4 py-3">{item.created_at}</td>
              <td className="px-4 py-3">
                {item.pdf_disponible ? (
                  <Button
                    variant="outline"
                    onClick={() => downloadMutation.mutate(item.codigo)}
                  >
                    Descargar PDF
                  </Button>
                ) : (
                  <span className="text-xs text-slate-400">No disponible</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
