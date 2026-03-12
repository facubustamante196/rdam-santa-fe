"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSolicitudes, getOperarios } from "@/lib/api";
import { SolicitudFilters } from "@/components/solicitudes/SolicitudFilters";
import { SolicitudFiltersSupervisor } from "@/components/solicitudes/SolicitudFiltersSupervisor";
import { SolicitudesTable } from "@/components/solicitudes/SolicitudesTable";
import { usePermissions } from "@/hooks/usePermissions";
import { useSession } from "next-auth/react";
import type { EstadoSolicitud } from "@/types";
import type { Circunscripcion } from "@/types";

type FiltersState = {
  estado: EstadoSolicitud | "";
  q: string;
};

type FiltersSupervisorState = {
  circunscripcion: Circunscripcion | "";
  operarioId: string;
  estado: EstadoSolicitud | "";
  fechaDesde: string;
  fechaHasta: string;
  q: string;
};

const EMPTY_FILTERS: FiltersState = {
  estado: "",
  q: "",
};

const EMPTY_FILTERS_SUPERVISOR: FiltersSupervisorState = {
  circunscripcion: "",
  operarioId: "",
  estado: "",
  fechaDesde: "",
  fechaHasta: "",
  q: "",
};

export default function Page() {
  const { can, role } = usePermissions();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const userCircunscripcion = session?.user?.circunscripcion ?? "";
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FiltersState>(EMPTY_FILTERS);
  const [filtersSupervisor, setFiltersSupervisor] = useState<FiltersSupervisorState>(
    EMPTY_FILTERS_SUPERVISOR,
  );
  const [appliedFiltersSupervisor, setAppliedFiltersSupervisor] =
    useState<FiltersSupervisorState>(EMPTY_FILTERS_SUPERVISOR);
  const queryClient = useQueryClient();

  const canFilterCircunscripcion = can("view:all_solicitudes");

  const {
    data: operariosData,
    isLoading: isLoadingOperarios,
  } = useQuery({
    queryKey: ["operarios"],
    queryFn: () => getOperarios(token ?? ""),
    enabled: !!token && canFilterCircunscripcion,
  });

  const queryFilters = {
    estado: canFilterCircunscripcion
      ? appliedFiltersSupervisor.estado || undefined
      : appliedFilters.estado || undefined,
    circunscripcion:
      canFilterCircunscripcion && appliedFiltersSupervisor.circunscripcion
        ? appliedFiltersSupervisor.circunscripcion
        : undefined,
    operarioId:
      canFilterCircunscripcion && appliedFiltersSupervisor.operarioId
        ? appliedFiltersSupervisor.operarioId
        : undefined,
    fechaDesde:
      canFilterCircunscripcion && appliedFiltersSupervisor.fechaDesde
        ? appliedFiltersSupervisor.fechaDesde
        : undefined,
    fechaHasta:
      canFilterCircunscripcion && appliedFiltersSupervisor.fechaHasta
        ? appliedFiltersSupervisor.fechaHasta
        : undefined,
    q: canFilterCircunscripcion
      ? appliedFiltersSupervisor.q || undefined
      : appliedFilters.q || undefined,
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
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">
          {role === "OPERARIO"
            ? `Solicitudes — ${userCircunscripcion}`
            : "Solicitudes"}
        </h1>
      </div>
      {canFilterCircunscripcion ? (
        <SolicitudFiltersSupervisor
          filters={filtersSupervisor}
          operarios={(operariosData?.operarios ?? []).filter(
            (operario) => operario.activo,
          )}
          isLoadingOperarios={isLoadingOperarios}
          onChange={setFiltersSupervisor}
          onApply={() => setAppliedFiltersSupervisor(filtersSupervisor)}
          onClear={() => {
            setFiltersSupervisor(EMPTY_FILTERS_SUPERVISOR);
            setAppliedFiltersSupervisor(EMPTY_FILTERS_SUPERVISOR);
          }}
        />
      ) : (
        <SolicitudFilters
          filters={filters}
          onChange={setFilters}
          onApply={() => setAppliedFilters(filters)}
        />
      )}
      <SolicitudesTable
        solicitudes={solicitudes.data}
        onUploadSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ["solicitudes"] })
        }
      />
    </div>
  );
}
