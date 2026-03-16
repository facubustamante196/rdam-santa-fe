"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, ArrowRight, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ResultadoPagoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const codigo = searchParams.get("codigo");
  const estado = searchParams.get("estado");

  const isSuccess = estado === "success";

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
        {isSuccess ? (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-navy mb-2">
              ¡Pago confirmado!
            </h1>
            <p className="text-muted-foreground mb-6">
              Tu solicitud <span className="font-mono font-medium text-navy">{codigo}</span> ha sido pagada correctamente.
            </p>
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 mb-8 text-left text-sm text-emerald-800">
              <p className="font-medium mb-1">¿Qué sigue?</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Un operario revisará tu solicitud.</li>
                <li>Te enviaremos un email cuando el certificado esté listo.</li>
                <li>Podrás descargarlo con tu DNI.</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/5">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-navy mb-2">
              Pago rechazado
            </h1>
            <p className="text-muted-foreground mb-8">
              No pudimos procesar el pago de la solicitud <span className="font-mono font-medium text-navy">{codigo}</span>. 
              Por favor, intentá de nuevo con otro medio de pago.
            </p>
          </>
        )}

        <div className="space-y-3">
          {isSuccess ? (
            <Button variant="default" className="w-full" asChild>
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Volver al inicio
              </Link>
            </Button>
          ) : (
            <Button variant="gold" className="w-full" onClick={() => router.back()}>
              Reintentar pago
            </Button>
          )}
          
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/solicitar/consulta">
              Consultar estado del trámite
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
      
      <p className="mt-8 text-center text-xs text-muted-foreground max-w-xs">
        Si tuviste algún problema técnico, por favor contactanos a soporte@rdam.justiciasantafe.gov.ar
      </p>
    </div>
  );
}
