import { Badge } from "@/components/ui/badge";
import type { EstadoSolicitud } from "@/lib/api";

const ESTADO_CONFIG: Record<
  EstadoSolicitud,
  { label: string; variant: "default" | "success" | "warning" | "destructive" | "info" | "gold" | "secondary" | "outline" }
> = {
  PENDIENTE_PAGO: { label: "Pendiente de pago", variant: "warning" },
  PENDIENTE: { label: "Pendiente", variant: "secondary" },
  EN_PROCESO: { label: "En proceso", variant: "info" },
  EMITIDA: { label: "Emitida", variant: "success" },
  RECHAZADA: { label: "Rechazada", variant: "destructive" },
  VENCIDA: { label: "Vencida", variant: "outline" },
};

export function EstadoBadge({ estado }: { estado: EstadoSolicitud }) {
  const config = ESTADO_CONFIG[estado] ?? { label: estado, variant: "secondary" };
  return (
    <Badge variant={config.variant as any}>{config.label}</Badge>
  );
}
