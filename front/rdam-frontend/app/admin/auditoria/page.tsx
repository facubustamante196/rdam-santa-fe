"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search } from "lucide-react";

import { api, type AuditoriaLog } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import { formatDateTime } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  const router = useRouter();
  const { adminToken, adminRole } = useAuthStore();
  const [logs, setLogs] = useState<AuditoriaLog[]>(MOCK_LOGS);
  const [total, setTotal] = useState(MOCK_LOGS.length);
  const [search, setSearch] = useState("");
  const [filtroAccion, setFiltroAccion] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (adminRole && adminRole !== "SUPERVISOR") {
      toast.error("Acceso denegado: Se requieren permisos de supervisor.");
      router.replace("/admin/dashboard");
      return;
    }

    if (!adminToken) return;
    setLoading(true);
    api.admin.auditoria({}, adminToken)
      .then((r) => { setLogs(r.logs); setTotal(r.total); })
      .catch(() => setLogs(MOCK_LOGS))
      .finally(() => setLoading(false));
  }, [adminToken, adminRole, router]);

  if (adminRole !== "SUPERVISOR") {
    return null;
  }

  const filtered = logs.filter(
    (l) => {
      const matchSearch = !search ||
        l.usuario.includes(search) ||
        l.accion.includes(search.toUpperCase()) ||
        (l.solicitud_id ?? "").includes(search);
      const matchAccion = !filtroAccion || l.accion === filtroAccion;
      return matchSearch && matchAccion;
    }
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedLogs = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filtroAccion]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-navy">Registro de auditoría</h2>
          <p className="text-sm text-muted-foreground">{total} acciones registradas</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filtroAccion}
            onChange={(e) => setFiltroAccion(e.target.value)}
            className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm text-navy placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Todas las acciones</option>
            <option value="ASIGNAR_OPERARIO">Asignar Operario</option>
            <option value="CAMBIO_ESTADO">Cambio de Estado</option>
            <option value="CREAR_USUARIO">Crear Usuario</option>
          </select>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuario o trámite..."
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
                : paginatedLogs.map((log) => (
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
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-[250px]" title={log.detalle}>
                        {log.detalle}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/20">
              <span className="text-xs text-muted-foreground">
                Mostrando {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="h-8 text-xs"
                >
                  Anterior
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="h-8 text-xs"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
          
          {!loading && filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No se encontraron registros de auditoría para estos filtros.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
