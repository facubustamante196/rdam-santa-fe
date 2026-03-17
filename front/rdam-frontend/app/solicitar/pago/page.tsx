"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard, CheckCircle2, ExternalLink, Download, Copy } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { useSolicitudStore } from "@/lib/stores/solicitud.store";
import { Button } from "@/components/ui/button";
import { SolicitudProgress } from "@/components/citizen/solicitud-progress";

export default function PagoPage() {
  const { solicitudCodigo, solicitudId, urlPago, goToStep, step } = useSolicitudStore();
  const [loading, setLoading] = useState(false);

  const handlePagar = async () => {
    if (!solicitudCodigo) return;
    setLoading(true);
    try {
      const res = await api.pagos.iniciar(solicitudCodigo);
      
      // Redirect to payment gateway via POST
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

      goToStep("done");
    } catch (error: any) {
      const msg = error.body?.message || "No se pudo iniciar el pago. Intentá nuevamente.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyCodigo = () => {
    if (solicitudCodigo) {
      navigator.clipboard.writeText(solicitudCodigo);
      toast.success("Código copiado.");
    }
  };

  if (step === "done") {
    return <DonePageContent />;
  }

  return (
    <div className="animate-fade-in">
      <SolicitudProgress current="payment" />

      <div className="rounded-2xl border border-border bg-white shadow-sm p-8 mt-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
          <CreditCard className="h-7 w-7 text-gold-dark" />
        </div>

        <h1 className="font-display text-2xl font-semibold text-navy mb-2">
          Aboná el arancel
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Tu solicitud fue creada correctamente. Para completar el trámite,
          debés abonar el arancel correspondiente.
        </p>

        {/* Código */}
        <div className="rounded-xl border border-border bg-secondary/50 p-4 mb-6">
          <p className="text-xs text-muted-foreground mb-1">Código de solicitud</p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-xl font-bold text-navy tracking-widest">
              {solicitudCodigo ?? "—"}
            </span>
            <button
              type="button"
              onClick={copyCodigo}
              className="rounded-md p-1 hover:bg-secondary transition-colors"
            >
              <Copy className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Guardá este código para consultar el estado de tu trámite
          </p>
        </div>

        <Button
          variant="gold"
          size="lg"
          className="w-full mb-3"
          loading={loading}
          onClick={handlePagar}
        >
          <ExternalLink className="h-4 w-4" />
          Ir al portal de pagos
        </Button>

        <p className="text-xs text-muted-foreground">
          Serás redirigido a la plataforma de pago oficial de la provincia.
        </p>
      </div>
    </div>
  );
}

function DonePageContent() {
  const { solicitudCodigo, reset } = useSolicitudStore();

  return (
    <div className="animate-fade-in">
      <SolicitudProgress current="done" />

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm p-8 mt-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>

        <h1 className="font-display text-2xl font-semibold text-navy mb-2">
          ¡Trámite iniciado!
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Una vez confirmado el pago, procesaremos tu solicitud. El certificado
          se emite dentro de las 48 hs hábiles y lo recibirás por email.
        </p>

        <div className="flex flex-col gap-3">
          <Link href={`/solicitar/consulta?codigo=${solicitudCodigo}`}>
            <Button variant="outline" size="lg" className="w-full">
              Consultar estado
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="lg"
            className="w-full text-muted-foreground"
            onClick={() => { reset(); window.location.href = "/"; }}
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
