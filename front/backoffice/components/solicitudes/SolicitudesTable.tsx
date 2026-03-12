import type { SolicitudListItem } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type SolicitudesTableProps = {
  solicitudes: SolicitudListItem[];
  selectable?: boolean;
  onAssign?: (item: SolicitudListItem) => void;
  onChangeState?: (item: SolicitudListItem) => void;
};

const statusLabel: Record<SolicitudListItem["estado"], string> = {
  PENDIENTE_PAGO: "Pendiente pago",
  PAGADA: "Pagada",
  RECHAZADA: "Rechazada",
  EMITIDA: "Emitida",
  VENCIDO: "Vencida",
  PUBLICADO_VENCIDO: "Publicado vencido",
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-AR");
};

export function SolicitudesTable({
  solicitudes,
  selectable = true,
  onAssign,
  onChangeState,
}: SolicitudesTableProps) {
  const showActions = Boolean(onAssign || onChangeState);

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            {selectable ? (
              <th className="px-4 py-3">
                <input type="checkbox" />
              </th>
            ) : null}
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Ciudadano</th>
            <th className="px-4 py-3">Circunscripcion</th>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Operario</th>
            {showActions ? <th className="px-4 py-3">Acciones</th> : null}
          </tr>
        </thead>
        <tbody>
          {solicitudes.map((item) => (
            <tr
              key={item.id}
              className="border-b border-slate-100 last:border-b-0"
            >
              {selectable ? (
                <td className="px-4 py-3">
                  <input type="checkbox" />
                </td>
              ) : null}
              <td className="px-4 py-3 font-medium text-slate-800">
                <Link className="text-primary hover:underline" href={`/solicitudes/${item.id}`}>
                  {item.codigo}
                </Link>
              </td>
              <td className="px-4 py-3">{item.nombreCompleto}</td>
              <td className="px-4 py-3">{item.circunscripcion}</td>
              <td className="px-4 py-3">{formatDate(item.createdAt)}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  {statusLabel[item.estado]}
                </span>
              </td>
              <td className="px-4 py-3">
                {item.operarioAsignado?.nombreCompleto ?? "Sin asignar"}
              </td>
              {showActions ? (
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {onAssign ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onAssign(item)}
                      >
                        Asignar
                      </Button>
                    ) : null}
                    {onChangeState ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onChangeState(item)}
                      >
                        Cambiar estado
                      </Button>
                    ) : null}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
