"use client";

import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type SolicitudFiltersProps = {
  filters: {
    estado: string;
    q: string;
  };
  onChange: (filters: SolicitudFiltersProps["filters"]) => void;
  onApply?: () => void;
};

export function SolicitudFilters({
  filters,
  onChange,
  onApply,
}: SolicitudFiltersProps) {
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
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
      <input
        type="text"
        placeholder="Buscar"
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        value={filters.q}
        onChange={(event) => onChange({ ...filters, q: event.target.value })}
      />
      <Button variant="outline" onClick={onApply}>
        Aplicar filtros
      </Button>
    </div>
  );
}
