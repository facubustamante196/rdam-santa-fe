"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSolicitudes } from "@/lib/api";
import { SolicitudFilters } from "@/components/solicitudes/SolicitudFilters";
import { SolicitudesTable } from "@/components/solicitudes/SolicitudesTable";
import { usePermissions } from "@/hooks/usePermissions";
import { useSession } from "next-auth/react";
import type { EstadoSolicitud } from "@/types";

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
  const { can } = usePermissions();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const userCircunscripcion = session?.user?.circunscripcion ?? "";
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FiltersState>(EMPTY_FILTERS);

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
      <SolicitudesTable solicitudes={solicitudes.data} />
    </div>
  );
}
