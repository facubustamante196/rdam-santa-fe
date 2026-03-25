"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Search, Clock, FileText, CreditCard } from "lucide-react";

import { consultaSchema, type ConsultaInput } from "@/lib/schemas";
import { api, type ConsultaResponse } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { useSolicitudStore } from "@/lib/stores/solicitud.store";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { EstadoBadge } from "@/components/shared/estado-badge";

type SearchMode = "codigo" | "dniemail";

export default function ConsultaPage() {
  const [mode, setMode] = useState<SearchMode>("codigo");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ConsultaResponse[] | null>(null);
  const [payLoading, setPayLoading] = useState<string | null>(null);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<any>({
    mode: "onChange",
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setResults(null);
    try {
      const params = mode === "codigo"
        ? { codigo: data.codigo }
        : { dni: data.dni, email: data.email };
      const res = await api.solicitudes.consultar(params);
      setResults(res);
    } catch {
      toast.error("No se encontró ninguna solicitud con esos datos.");
    } finally {
      setLoading(false);
    }
  };

  const handlePagar = async (codigo: string) => {
    if (!codigo) return;
    
    setPayLoading(codigo);
    try {
      const res = await api.pagos.iniciar(codigo);
      
      const form = document.createElement("form");
      form.method = "POST";
      form.action = res.url_pago;
      form.target = "_blank";

      Object.entries(res.checkout_fields).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      
      toast.success("Redirigiendo a la pasarela de pagos...");
    } catch (error: any) {
      const msg = error.body?.message || "No se pudo iniciar el pago. Intentá nuevamente.";
      toast.error(msg);
    } finally {
      setPayLoading(null);
    }
  };

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-navy mb-1">
          Consultar estado
        </h1>
        <p className="text-sm text-muted-foreground">
          Ingresá tu código de solicitud o tu DNI y email para consultar el estado de tu trámite.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-secondary/50 p-1 mb-6">
        {(["codigo", "dniemail"] as SearchMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); reset(); setResults(null); }}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
              mode === m
                ? "bg-white shadow-sm text-navy"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "codigo" ? "Por código" : "Por DNI y email"}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {mode === "codigo" ? (
            <FormField label="Código de solicitud" error={errors.codigo?.message} required htmlFor="codigo">
              <Input
                id="codigo"
                placeholder="Ej: RDAM-001234"
                className="font-mono uppercase"
                {...register("codigo", { required: "El código es requerido" })}
              />
            </FormField>
          ) : (
            <>
              <FormField label="DNI" error={errors.dni?.message} required htmlFor="dni">
                <Input
                  id="dni"
                  inputMode="numeric"
                  placeholder="12345678"
                  {...register("dni", { required: "El DNI es requerido" })}
                />
              </FormField>
              <FormField label="Email" error={errors.email?.message} required htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  {...register("email", { required: "El email es requerido" })}
                />
              </FormField>
            </>
          )}

          <Button type="submit" variant="gold" size="lg" className="w-full" loading={loading}>
            <Search className="h-4 w-4" />
            Consultar
          </Button>
        </form>
      </div>

      {/* Results */}
      {results && results.length > 0 && (
        <div className="mt-8 space-y-6">
          <h2 className="font-display font-semibold text-navy text-xl text-center">
            {mode === "codigo" ? "Resultado de la solicitud" : "Historial de solicitudes"}
          </h2>
          {results.map((result) => (
            <div key={result.id} className="rounded-2xl border border-border bg-white shadow-sm p-6 animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gold" />
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                    Trámite
                  </p>
                  <p className="font-mono font-bold text-navy text-lg">
                    {result.codigo}
                  </p>
                </div>
                <EstadoBadge estado={result.estado} />
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Línea de tiempo
                </h3>
                {result.timeline.map((event, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-2.5 w-2.5 rounded-full mt-0.5 ${
                        i === 0 ? "bg-navy" : "bg-border"
                      }`} />
                      {i < result.timeline.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1 min-h-5" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-navy">{event.estado}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(event.fecha)}
                      </p>
                      {event.observacion && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{event.observacion}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {result.estado === "PENDIENTE_PAGO" && (
                <div className="mt-6 pt-6 border-t border-border">
                  <Button 
                    variant="gold" 
                    className="w-full"
                    loading={payLoading === result.codigo}
                    onClick={() => handlePagar(result.codigo)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Ir a pagar arancel
                  </Button>
                </div>
              )}

              {result.downloadUrl && (
                <div className="mt-6 pt-6 border-t border-border">
                  <Button 
                    variant="gold" 
                    className="w-full"
                    asChild
                  >
                    <a href={result.downloadUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-2 h-4 w-4" />
                      Descargar Certificado PDF
                    </a>
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground mt-3">
                    El enlace de descarga es temporal y expira en 15 minutos.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
