import { Badge } from "@/components/ui/badge";
import type { EstadoSolicitud } from "@/lib/api";

const ESTADO_CONFIG: Record<
  EstadoSolicitud,
  { label: string; variant: "default" | "success" | "warning" | "destructive" | "info" | "gold" | "secondary" | "outline" }
> = {
  PENDIENTE_PAGO: { label: "Pendiente de pago", variant: "warning" },
  PAGADA: { label: "Pagada", variant: "success" },
  PENDIENTE: { label: "Pendiente", variant: "secondary" },
  EN_PROCESO: { label: "En proceso", variant: "info" },
  EMITIDA: { label: "Emitida", variant: "success" },
  RECHAZADA: { label: "Rechazada", variant: "destructive" },
  VENCIDO: { label: "Vencido (60 días)", variant: "outline" },
  PUBLICADO_VENCIDO: { label: "Vencida", variant: "outline" },
} as any;

export function EstadoBadge({ estado }: { estado: EstadoSolicitud }) {
  const config = ESTADO_CONFIG[estado] ?? { label: estado, variant: "secondary" };
  return (
    <Badge variant={config.variant as any}>{config.label}</Badge>
  );
}
