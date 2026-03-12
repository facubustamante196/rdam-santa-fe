import type { Solicitud } from "@/lib/schemas";

type SolicitudDetailProps = {
  solicitud: Solicitud;
};

const formatDateTime = (value: string | null) => {
  if (!value) return "Sin dato";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-AR");
};

export function SolicitudDetail({ solicitud }: SolicitudDetailProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">
          Datos del ciudadano
        </h3>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <p>Nombre: {solicitud.nombreCompleto}</p>
          <p>DNI: {solicitud.dniEnmascarado}</p>
          <p>CUIL: {solicitud.cuilEnmascarado}</p>
          <p>Fecha nacimiento: {solicitud.fechaNacimiento}</p>
          <p>Contacto: {solicitud.email}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Estado</h3>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <p>Estado actual: {solicitud.estado}</p>
          <p>Circunscripcion: {solicitud.circunscripcion}</p>
          <p>
            Operario asignado:{" "}
            {solicitud.operarioAsignado?.nombreCompleto ?? "Sin asignar"}
          </p>
          <p>Emision: {formatDateTime(solicitud.issuedAt)}</p>
          <p>Vencimiento: {formatDateTime(solicitud.fechaVencimiento)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">
          Log de auditoria
        </h3>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          {solicitud.registrosAuditoria.map((item) => (
            <div
              key={item.id}
              className="rounded-md bg-slate-50 px-3 py-2"
            >
              {formatDateTime(item.timestamp)} - {item.actorTipo}: {item.accion}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
