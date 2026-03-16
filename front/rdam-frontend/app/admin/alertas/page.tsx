"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

import { api, type AlertaSLA } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MOCK_ALERTAS: AlertaSLA[] = [
  { id: "1", codigo: "RDAM-000892", nombre: "Torres, Alejandro", circunscripcion: "2", nivel: "CRITICO", horas_demora: 76 },
  { id: "2", codigo: "RDAM-000944", nombre: "Vega, Patricia", circunscripcion: "1", nivel: "ALTO", horas_demora: 52 },
  { id: "3", codigo: "RDAM-001012", nombre: "Blanco, Miguel", circunscripcion: "3", nivel: "ALTO", horas_demora: 48 },
  { id: "4", codigo: "RDAM-001067", nombre: "Ríos, Carolina", circunscripcion: "2", nivel: "MEDIO", horas_demora: 30 },
  { id: "5", codigo: "RDAM-001102", nombre: "Ibarra, Lucas", circunscripcion: "4", nivel: "BAJO", horas_demora: 16 },
];

const NIVEL_VARIANT: Record<string, any> = {
  CRITICO: "destructive",
  ALTO: "warning",
  MEDIO: "info",
  BAJO: "secondary",
};

const NIVEL_COLORS: Record<string, string> = {
  CRITICO: "border-l-rose-500 bg-rose-50/50",
  ALTO: "border-l-amber-500 bg-amber-50/50",
  MEDIO: "border-l-blue-400 bg-blue-50/50",
  BAJO: "border-l-slate-300",
};

export default function AlertasPage() {
  const { adminToken } = useAuthStore();
  const [alertas, setAlertas] = useState<AlertaSLA[]>(MOCK_ALERTAS);
  const [filtroNivel, setFiltroNivel] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!adminToken) return;
    setLoading(true);
    api.admin.solicitudes.alertas({}, adminToken)
      .then(setAlertas)
      .catch(() => setAlertas(MOCK_ALERTAS))
      .finally(() => setLoading(false));
  }, [adminToken]);

  const filtered = alertas.filter((a) => !filtroNivel || a.nivel === filtroNivel);

  const counts = {
    CRITICO: alertas.filter((a) => a.nivel === "CRITICO").length,
    ALTO: alertas.filter((a) => a.nivel === "ALTO").length,
    MEDIO: alertas.filter((a) => a.nivel === "MEDIO").length,
    BAJO: alertas.filter((a) => a.nivel === "BAJO").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-navy">Alertas SLA</h2>
        <p className="text-sm text-muted-foreground">
          Solicitudes con demoras fuera del tiempo esperado de resolución.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(["CRITICO", "ALTO", "MEDIO", "BAJO"] as const).map((nivel) => (
          <button
            key={nivel}
            type="button"
            onClick={() => setFiltroNivel(filtroNivel === nivel ? "" : nivel)}
            className={cn(
              "rounded-xl border-2 p-4 text-left transition-all hover:shadow-sm",
              filtroNivel === nivel ? "border-navy bg-navy/5" : "border-border bg-white"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <Badge variant={NIVEL_VARIANT[nivel]} className="text-[10px]">{nivel}</Badge>
              <AlertTriangle className={cn("h-4 w-4", {
                "text-rose-500": nivel === "CRITICO",
                "text-amber-500": nivel === "ALTO",
                "text-blue-400": nivel === "MEDIO",
                "text-slate-400": nivel === "BAJO",
              })} />
            </div>
            <p className="font-display text-2xl font-bold text-navy">{counts[nivel]}</p>
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {filtroNivel ? `Alertas nivel ${filtroNivel}` : "Todas las alertas"}
            <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-secondary animate-pulse" />
              ))
            : filtered.map((alerta) => (
                <div
                  key={alerta.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border-l-4 border border-border px-4 py-3",
                    NIVEL_COLORS[alerta.nivel]
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs font-semibold text-navy">{alerta.codigo}</span>
                      <Badge variant={NIVEL_VARIANT[alerta.nivel]} className="text-[9px] py-0">{alerta.nivel}</Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground">{alerta.nombre}</p>
                    <p className="text-xs text-muted-foreground">Circunscripción {alerta.circunscripcion}ª</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className="flex items-center gap-1 justify-end text-sm font-semibold text-rose-600">
                      <Clock className="h-3.5 w-3.5" />
                      {alerta.horas_demora}hs
                    </div>
                    <p className="text-xs text-muted-foreground">de demora</p>
                  </div>
                </div>
              ))}
          {!loading && filtered.length === 0 && (
            <p className="text-center py-8 text-muted-foreground text-sm">
              No hay alertas para el nivel seleccionado.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
