"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, ChevronLeft, ChevronRight, Eye, Upload } from "lucide-react";
import { toast } from "sonner";

import { api, type AdminSolicitud } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import { formatDateTime } from "@/lib/utils";
import { CIRC_ID_TO_ENUM, CIRC_ENUM_TO_ID, CIRCUNSCRIPCIONES } from "@/lib/schemas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EstadoBadge } from "@/components/shared/estado-badge";
import { Card } from "@/components/ui/card";

const ESTADOS = [
  { value: "", label: "Todos los estados" },
  { value: "PENDIENTE_PAGO", label: "Pendiente de pago" },
  { value: "PAGADA", label: "Pagada" },
  { value: "EMITIDA", label: "Emitida" },
  { value: "PUBLICADO_VENCIDO", label: "Vencida (90 días)" },
];

const MOCK_SOLICITUDES: AdminSolicitud[] = [];

export default function SolicitudesAdminPage() {
  const router = useRouter();
  const { adminToken, adminRole, adminUser } = useAuthStore();
  const [solicitudes, setSolicitudes] = useState<AdminSolicitud[]>(MOCK_SOLICITUDES);
  const [total, setTotal] = useState(MOCK_SOLICITUDES.length);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  
  // Set initial circumscription based on user role and assigned city
  const [circ, setCirc] = useState(() => {
    if (adminRole === "OPERARIO" && adminUser?.circunscripcion) {
      return CIRC_ENUM_TO_ID[adminUser.circunscripcion] || "";
    }
    return "";
  });
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchData = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      // [x] Research and Identify relevant files for Supervisor Admin Panel and filtering logic
      // [x] Investigate the filter implementation (Frontend & Backend)
      // [x] Reproduce the issue or identify the bug in code
      // [x] Implement fix for "circunscripcion" filter
      // [x] Verify the fix
      // [/] Update filter labels to use city names
      const res = await api.admin.solicitudes.listar(
        { 
          estado: estado || undefined, 
          circunscripcion: CIRC_ID_TO_ENUM[circ] || undefined, 
          search: search || undefined,
          desde: desde || undefined,
          hasta: hasta || undefined,
          page, 
          limit 
        },
        adminToken
      );
      setSolicitudes(res.data);
      setTotal(res.total);
    } catch {
      setSolicitudes([]);
    } finally {
      setLoading(false);
    }
  }, [adminToken, estado, circ, page, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [estado, circ, search, desde, hasta]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, CUIL o código..."
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={estado}
          onChange={(e) => { setEstado(e.target.value); setPage(1); }}
          className="rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {ESTADOS.map((e) => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <Input 
            type="date" 
            value={desde} 
            onChange={e => setDesde(e.target.value)}
            className="w-36 bg-white"
            title="Desde (Fecha)"
          />
          <span className="text-muted-foreground text-sm">-</span>
          <Input 
            type="date" 
            value={hasta} 
            onChange={e => setHasta(e.target.value)}
            className="w-36 bg-white"
            title="Hasta (Fecha)"
          />
        </div>

        <select
          value={circ}
          onChange={(e) => { setCirc(e.target.value); setPage(1); }}
          disabled={adminRole === "OPERARIO"}
          className="rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {adminRole === "SUPERVISOR" && (
            <option value="">Todas las ciudades</option>
          )}
          {CIRCUNSCRIPCIONES.map((c) => (
            <option key={c.id} value={c.id}>{c.ciudad.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                {["Código", "Nombre", "CUIL", "Circ.", "Estado", "Fecha", "Acciones"].map((h) => (
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
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-secondary animate-pulse" style={{ width: `${60 + j * 10}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : solicitudes
                    .map((sol) => (
                      <tr key={sol.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold text-navy">{sol.codigo}</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{sol.nombre}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{sol.cuil}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-navy">{CIRC_ENUM_TO_ID[sol.circunscripcion] || sol.circunscripcion}ª</span>
                        </td>
                        <td className="px-4 py-3">
                          <EstadoBadge estado={sol.estado} />
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(sol.creado_en)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => router.push(`/admin/solicitudes/${sol.id}`)}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Ver
                            </Button>
                            {sol.estado === "EN_PROCESO" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-emerald-700 hover:text-emerald-800"
                                onClick={() => toast.info(`Cargar PDF para ${sol.codigo}`)}
                              >
                                <Upload className="h-3.5 w-3.5 mr-1" />
                                PDF
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/20">
          <span className="text-xs text-muted-foreground">
            Mostrando {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} de {total}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-medium px-2">{page} / {totalPages || 1}</span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
