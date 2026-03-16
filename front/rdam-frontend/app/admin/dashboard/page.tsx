"use client";

import { useEffect, useState } from "react";
import {
  FileText, CheckCircle2, XCircle, Clock, TrendingUp,
  AlertTriangle, RefreshCw,
} from "lucide-react";
import { api, type DashboardMetrics } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MOCK_METRICS: DashboardMetrics = {
  total: 1284,
  pendientes: 47,
  emitidas: 1102,
  rechazadas: 89,
  vencidas: 46,
  tiempo_promedio_hs: 18.4,
  por_circunscripcion: [
    { circunscripcion: "1ª - Santa Fe", total: 412 },
    { circunscripcion: "2ª - Rosario", total: 538 },
    { circunscripcion: "3ª - Venado Tuerto", total: 142 },
    { circunscripcion: "4ª - Reconquista", total: 98 },
    { circunscripcion: "5ª - Rafaela", total: 94 },
  ],
};

export default function DashboardPage() {
  const { adminToken } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics>(MOCK_METRICS);
  const [periodo, setPeriodo] = useState("mes");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!adminToken) return;
    setLoading(true);
    api.admin.dashboard(periodo, adminToken)
      .then(setMetrics)
      .catch(() => setMetrics(MOCK_METRICS))
      .finally(() => setLoading(false));
  }, [adminToken, periodo]);

  const kpis = [
    { label: "Total solicitudes", value: metrics?.total ?? 0, icon: FileText, color: "text-navy", bg: "bg-navy/5" },
    { label: "Pendientes", value: metrics?.pendientes ?? 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Emitidas", value: metrics?.emitidas ?? 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Rechazadas", value: metrics?.rechazadas ?? 0, icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "Vencidas", value: metrics?.vencidas ?? 0, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
    {
      label: "Tiempo promedio",
      value: `${metrics?.tiempo_promedio_hs?.toFixed(1) ?? "0.0"}hs`,
      icon: TrendingUp,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
  ];

  const porCircunscripcion = metrics?.por_circunscripcion ?? [];
  const maxCirc = porCircunscripcion.length > 0 
    ? Math.max(...porCircunscripcion.map((c) => c.total))
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-navy">Resumen operativo</h2>
          <p className="text-sm text-muted-foreground">Métricas generales del sistema RDAM</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-lg border border-border bg-white p-1 text-xs">
            {["hoy", "semana", "mes", "año"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`rounded-md px-3 py-1.5 capitalize transition-all ${
                  periodo === p ? "bg-navy text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setLoading(true)}
            className="rounded-lg border border-border bg-white p-2 hover:bg-secondary transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                  <p className="font-display text-2xl font-bold text-navy">{kpi.value}</p>
                </div>
                <div className={`rounded-xl p-2.5 ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Distribution by Circunscripción */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Distribución por circunscripción</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {porCircunscripcion.map((c) => (
              <div key={c.circunscripcion}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">{c.circunscripcion}</span>
                  <span className="text-sm font-semibold text-navy tabular-nums">{c.total}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-navy transition-all duration-700"
                    style={{ width: `${(c.total / maxCirc) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
