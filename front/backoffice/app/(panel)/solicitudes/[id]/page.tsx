"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSolicitudById } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { SolicitudDetail } from "@/components/solicitudes/SolicitudDetail";
import { UploadPdfButton } from "@/components/solicitudes/UploadPdfButton";
import { useSession } from "next-auth/react";

export default function Page() {
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const {
    data: solicitud,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["solicitud", params.id],
    queryFn: () => fetchSolicitudById(token ?? "", params.id),
    enabled: !!token,
    retry: false,
  });

  if (isLoading) {
    return <div className="text-sm text-slate-500">Cargando solicitud...</div>;
  }

  if (error) {
    const isNotFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        {isNotFound
          ? "No encontramos la solicitud solicitada."
          : "No se pudo cargar la solicitud."}
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        No se pudo cargar la solicitud.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SolicitudDetail solicitud={solicitud} />

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Acciones</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          <UploadPdfButton
            solicitudId={solicitud.id}
            estadoSolicitud={solicitud.estado}
            onSuccess={() =>
              queryClient.invalidateQueries({ queryKey: ["solicitud", params.id] })
            }
          />
        </div>
      </div>
    </div>
  );
}
