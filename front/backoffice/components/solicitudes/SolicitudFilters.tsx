"use client";

import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";

type SolicitudFiltersProps = {
  filters: {
    estado: string;
    circunscripcion: string;
    fechaDesde: string;
    fechaHasta: string;
    dni: string;
  };
  fixedCircunscripcion?: string;
  onChange: (filters: SolicitudFiltersProps["filters"]) => void;
  onApply?: () => void;
};

export function SolicitudFilters({
  filters,
  fixedCircunscripcion,
  onChange,
  onApply,
}: SolicitudFiltersProps) {
  const { can } = usePermissions();
  const canFilterCircunscripcion = can("view:all_solicitudes");

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-6">
      <Select
        value={filters.estado}
        onChange={(event) => onChange({ ...filters, estado: event.target.value })}
      >
        <option value="">Estado</option>
        <option value="PENDIENTE_PAGO">Pendiente pago</option>
        <option value="PAGADA">Pagada</option>
        <option value="RECHAZADA">Rechazada</option>
        <option value="EMITIDA">Emitida</option>
        <option value="VENCIDO">Vencida</option>
        <option value="PUBLICADO_VENCIDO">Publicado vencido</option>
      </Select>
      {canFilterCircunscripcion ? (
        <Select
          value={filters.circunscripcion}
          onChange={(event) =>
            onChange({ ...filters, circunscripcion: event.target.value })
          }
        >
          <option value="">Circunscripcion</option>
          <option value="SANTA_FE">SANTA_FE</option>
          <option value="ROSARIO">ROSARIO</option>
          <option value="VENADO_TUERTO">VENADO_TUERTO</option>
          <option value="RAFAELA">RAFAELA</option>
          <option value="RECONQUISTA">RECONQUISTA</option>
        </Select>
      ) : (
        <input
          type="text"
          readOnly
          value={fixedCircunscripcion ?? ""}
          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
        />
      )}
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
        placeholder="DNI"
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        value={filters.dni}
        onChange={(event) => onChange({ ...filters, dni: event.target.value })}
      />
      <div className="hidden md:block" />
      <Button variant="outline" onClick={onApply}>
        Aplicar filtros
      </Button>
    </div>
  );
}
