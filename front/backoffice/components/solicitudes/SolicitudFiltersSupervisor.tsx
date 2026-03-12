"use client";

import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Circunscripcion, EstadoSolicitud, Operario } from "@/types";

interface SolicitudFiltersSupervisorProps {
  filters: {
    circunscripcion: Circunscripcion | "";
    operarioId: string;
    estado: EstadoSolicitud | "";
    fechaDesde: string;
    fechaHasta: string;
    q: string;
  };
  operarios: Operario[];
  isLoadingOperarios: boolean;
  onChange: (filters: SolicitudFiltersSupervisorProps["filters"]) => void;
  onApply: () => void;
  onClear: () => void;
}

export const SolicitudFiltersSupervisor = ({
  filters,
  operarios,
  isLoadingOperarios,
  onChange,
  onApply,
  onClear,
}: SolicitudFiltersSupervisorProps) => {
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-7">
      <Select
        value={filters.circunscripcion}
        onChange={(event) =>
          onChange({ ...filters, circunscripcion: event.target.value as Circunscripcion })
        }
      >
        <option value="">Circunscripcion</option>
        <option value="SANTA_FE">SANTA_FE</option>
        <option value="ROSARIO">ROSARIO</option>
        <option value="VENADO_TUERTO">VENADO_TUERTO</option>
        <option value="RAFAELA">RAFAELA</option>
        <option value="RECONQUISTA">RECONQUISTA</option>
      </Select>
      <Select
        value={filters.operarioId}
        onChange={(event) =>
          onChange({ ...filters, operarioId: event.target.value })
        }
        disabled={isLoadingOperarios}
      >
        <option value="">Operario</option>
        {isLoadingOperarios ? (
          <option value="" disabled>
            Cargando...
          </option>
        ) : null}
        {operarios.map((operario) => (
          <option key={operario.id} value={operario.id}>
            {operario.nombreCompleto} - {operario.circunscripcion}
          </option>
        ))}
      </Select>
      <Select
        value={filters.estado}
        onChange={(event) =>
          onChange({ ...filters, estado: event.target.value as EstadoSolicitud })
        }
      >
        <option value="">Estado</option>
        <option value="PENDIENTE_PAGO">Pendiente pago</option>
        <option value="PAGADA">Pagada</option>
        <option value="RECHAZADA">Rechazada</option>
        <option value="EMITIDA">Emitida</option>
        <option value="VENCIDO">Vencida</option>
        <option value="PUBLICADO_VENCIDO">Publicado vencido</option>
      </Select>
      <input
        type="date"
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        value={filters.fechaDesde}
        onChange={(event) =>
          onChange({ ...filters, fechaDesde: event.target.value })
        }
      />
      <input
        type="date"
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        value={filters.fechaHasta}
        onChange={(event) =>
          onChange({ ...filters, fechaHasta: event.target.value })
        }
      />
      <input
        type="text"
        placeholder="Buscar"
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        value={filters.q}
        onChange={(event) => onChange({ ...filters, q: event.target.value })}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={onApply}>
          Aplicar
        </Button>
        <Button variant="outline" onClick={onClear}>
          Limpiar
        </Button>
        {isLoadingOperarios ? <Spinner size="sm" /> : null}
      </div>
    </div>
  );
};
