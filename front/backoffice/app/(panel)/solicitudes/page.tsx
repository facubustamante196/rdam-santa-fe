"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSolicitudes } from "@/lib/api";
import { SolicitudFilters } from "@/components/solicitudes/SolicitudFilters";
import { SolicitudesTable } from "@/components/solicitudes/SolicitudesTable";
import { AsignarOperarioModal } from "@/components/solicitudes/AsignarOperarioModal";
import { CambiarEstadoModal } from "@/components/solicitudes/CambiarEstadoModal";
import { usePermissions } from "@/hooks/usePermissions";
import { useSession } from "next-auth/react";
import type { EstadoSolicitud } from "@/types";
import type { SolicitudListItem } from "@/lib/schemas";

type FiltersState = {
  estado: EstadoSolicitud | "";
  circunscripcion: string;
  fechaDesde: string;
  fechaHasta: string;
  dni: string;
};

const EMPTY_FILTERS: FiltersState = {
  estado: "",
  circunscripcion: "",
  fechaDesde: "",
  fechaHasta: "",
  dni: "",
};

export default function Page() {
  const { can, canAsignarOperario, canCambiarEstado } = usePermissions();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const userCircunscripcion = session?.user?.circunscripcion ?? "";
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FiltersState>(EMPTY_FILTERS);
  const [selectedSolicitud, setSelectedSolicitud] =
    useState<SolicitudListItem | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const queryClient = useQueryClient();

  const canFilterCircunscripcion = can("view:all_solicitudes");

  const queryFilters = {
    estado: appliedFilters.estado || undefined,
    fechaDesde: appliedFilters.fechaDesde || undefined,
    fechaHasta: appliedFilters.fechaHasta || undefined,
    dni: appliedFilters.dni || undefined,
    circunscripcion:
      canFilterCircunscripcion && appliedFilters.circunscripcion
        ? appliedFilters.circunscripcion
        : undefined,
  };

  const {
    data: solicitudes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["solicitudes", queryFilters],
    queryFn: () => fetchSolicitudes({ token: token ?? "", ...queryFilters }),
    enabled: !!token,
  });

  if (isLoading) {
    return <div className="text-sm text-slate-500">Cargando datos...</div>;
  }

  if (error || !solicitudes) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        No se pudo cargar la lista de solicitudes.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SolicitudFilters
        filters={filters}
        onChange={setFilters}
        onApply={() => setAppliedFilters(filters)}
        fixedCircunscripcion={canFilterCircunscripcion ? "" : userCircunscripcion}
      />
      <SolicitudesTable
        solicitudes={solicitudes.data}
        onAssign={
          canAsignarOperario
            ? (item) => {
                setSelectedSolicitud(item);
                setAssignOpen(true);
              }
            : undefined
        }
        onChangeState={
          canCambiarEstado
            ? (item) => {
                setSelectedSolicitud(item);
                setStateOpen(true);
              }
            : undefined
        }
      />
      {selectedSolicitud ? (
        <>
          <AsignarOperarioModal
            isOpen={assignOpen}
            onClose={() => setAssignOpen(false)}
            solicitudId={selectedSolicitud.id}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ["solicitudes"] })}
          />
          <CambiarEstadoModal
            isOpen={stateOpen}
            onClose={() => setStateOpen(false)}
            solicitudId={selectedSolicitud.id}
            estadoActual={selectedSolicitud.estado}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ["solicitudes"] })}
          />
        </>
      ) : null}
    </div>
  );
}
