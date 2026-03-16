"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";

import { api, type AuditoriaLog } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import { formatDateTime } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MOCK_LOGS: AuditoriaLog[] = [
  { id: "1", usuario: "ops.gonzalez", accion: "CAMBIO_ESTADO", solicitud_id: "sol-1", detalle: "PENDIENTE → EN_PROCESO", fecha: new Date(Date.now() - 3600000).toISOString() },
  { id: "2", usuario: "ops.martinez", accion: "CARGA_PDF", solicitud_id: "sol-2", detalle: "Certificado emitido", fecha: new Date(Date.now() - 7200000).toISOString() },
  { id: "3", usuario: "sup.rodriguez", accion: "CREAR_USUARIO", detalle: "ops.perez creado", fecha: new Date(Date.now() - 14400000).toISOString() },
  { id: "4", usuario: "ops.gonzalez", accion: "ASIGNAR", solicitud_id: "sol-3", detalle: "Asignado a ops.martinez", fecha: new Date(Date.now() - 86400000).toISOString() },
  { id: "5", usuario: "sup.rodriguez", accion: "CAMBIO_ESTADO", solicitud_id: "sol-4", detalle: "EN_PROCESO → RECHAZADA", fecha: new Date(Date.now() - 172800000).toISOString() },
];

const ACCION_VARIANT: Record<string, any> = {
  CAMBIO_ESTADO: "info",
  CARGA_PDF: "success",
  CREAR_USUARIO: "gold",
  ASIGNAR: "secondary",
  LOGIN: "outline",
};

export default function AuditoriaPage() {
  const { adminToken } = useAuthStore();
  const [logs, setLogs] = useState<AuditoriaLog[]>(MOCK_LOGS);
  const [total, setTotal] = useState(MOCK_LOGS.length);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!adminToken) return;
    setLoading(true);
    api.admin.auditoria({}, adminToken)
      .then((r) => { setLogs(r.logs); setTotal(r.total); })
      .catch(() => setLogs(MOCK_LOGS))
      .finally(() => setLoading(false));
  }, [adminToken]);

  const filtered = logs.filter(
    (l) =>
      !search ||
      l.usuario.includes(search) ||
      l.accion.includes(search.toUpperCase()) ||
      (l.solicitud_id ?? "").includes(search)
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-navy">Registro de auditoría</h2>
          <p className="text-sm text-muted-foreground">{total} acciones registradas</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuario o acción..."
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                {["Fecha", "Usuario", "Acción", "Solicitud", "Detalle"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-secondary animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(log.fecha)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-medium">{log.usuario}</td>
                      <td className="px-4 py-3">
                        <Badge variant={ACCION_VARIANT[log.accion] ?? "secondary"} className="text-[10px]">
                          {log.accion}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {log.solicitud_id ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{log.detalle}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
