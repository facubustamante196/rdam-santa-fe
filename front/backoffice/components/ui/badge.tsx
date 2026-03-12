import type { EstadoSolicitud } from "@/types";

interface BadgeProps {
  estado: EstadoSolicitud;
}

const baseClasses = "rounded-full px-2 py-1 text-xs font-medium";

const classMap: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  EN_PROCESO: "bg-blue-100 text-blue-800",
  PAGADA: "bg-green-100 text-green-800",
  APROBADA: "bg-emerald-100 text-emerald-800",
  RECHAZADA: "bg-red-100 text-red-800",
};

export const Badge = ({ estado }: BadgeProps) => {
  const stateKey = String(estado);
  const colorClasses = classMap[stateKey] ?? "bg-slate-100 text-slate-700";

  return <span className={`${baseClasses} ${colorClasses}`}>{stateKey}</span>;
};
