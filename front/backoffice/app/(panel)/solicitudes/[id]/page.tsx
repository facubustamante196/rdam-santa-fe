"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  fetchSolicitudById,
} from "@/lib/api";
import { ApiError } from "@/lib/api";
import {
  ForzarEstadoSchema,
  ForzarEstadoValues,
  RechazarSolicitudSchema,
  RechazarSolicitudValues,
} from "@/lib/schemas";
import { SolicitudDetail } from "@/components/solicitudes/SolicitudDetail";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePermissions } from "@/hooks/usePermissions";
import { useSession } from "next-auth/react";

export default function Page() {
  const params = useParams<{ id: string }>();
  const { can } = usePermissions();
  const { data: session } = useSession();
  const token = session?.accessToken;
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

  const rechazoForm = useForm<RechazarSolicitudValues>({
    resolver: zodResolver(RechazarSolicitudSchema),
    defaultValues: { observaciones: "" },
  });

  const forzarForm = useForm<ForzarEstadoValues>({
    resolver: zodResolver(ForzarEstadoSchema),
    defaultValues: { estado: "PENDIENTE_PAGO", motivo: "" },
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

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">
            Rechazar solicitud
          </h3>
          <form
            className="mt-3 space-y-3"
            onSubmit={rechazoForm.handleSubmit(() => {})}
          >
            <label className="text-xs font-medium text-slate-500">
              Observaciones
            </label>
            <Textarea
              placeholder="Detalle del rechazo"
              {...rechazoForm.register("observaciones")}
            />
            {rechazoForm.formState.errors.observaciones ? (
              <p className="text-xs text-red-600">
                {rechazoForm.formState.errors.observaciones.message}
              </p>
            ) : null}
            <Button type="submit" disabled={!can("reject:solicitud")}>
              Rechazar
            </Button>
          </form>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">
            Forzar estado
          </h3>
          <form
            className="mt-3 space-y-3"
            onSubmit={forzarForm.handleSubmit(() => {})}
          >
            <label className="text-xs font-medium text-slate-500">
              Estado destino
            </label>
            <Select {...forzarForm.register("estado")}>
              <option value="PENDIENTE_PAGO">Pendiente pago</option>
              <option value="PAGADA">Pagada</option>
              <option value="RECHAZADA">Rechazada</option>
              <option value="EMITIDA">Emitida</option>
              <option value="VENCIDO">Vencida</option>
              <option value="PUBLICADO_VENCIDO">Publicado vencido</option>
            </Select>
            <label className="text-xs font-medium text-slate-500">Motivo</label>
            <Input placeholder="Motivo" {...forzarForm.register("motivo")} />
            {forzarForm.formState.errors.motivo ? (
              <p className="text-xs text-red-600">
                {forzarForm.formState.errors.motivo.message}
              </p>
            ) : null}
            <Button type="submit" disabled={!can("force:estado")}>
              Forzar estado
            </Button>
          </form>
        </div>
      </div>

    </div>
  );
}
