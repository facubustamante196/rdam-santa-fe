"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { otpValidarSchema, type OtpValidarInput } from "@/lib/schemas";
import { api } from "@/lib/api";
import { useSolicitudStore } from "@/lib/stores/solicitud.store";
import { useAuthStore } from "@/lib/stores/auth.store";

import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/shared/otp-input";
import { SolicitudProgress } from "@/components/citizen/solicitud-progress";

const RESEND_COOLDOWN = 60;

export default function OtpPage() {
  const router = useRouter();
  const { dni, email, goToStep, setOtpToken } = useSolicitudStore();
  const { setCitizenSession } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState(false);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSubmit = async () => {
    if (otpValue.length !== 6) {
      setOtpError(true);
      return;
    }
    setOtpError(false);
    setLoading(true);
    try {
      const res = await api.auth.validarOtp({ dni, email, codigo: otpValue });
      setCitizenSession(res.access_token);
      setOtpToken(res.access_token);
      toast.success("Identidad verificada. Completá tu solicitud.");
      router.push("/solicitar/formulario");
    } catch (error: any) {
      setOtpError(true);
      const msg = error.body?.message || "Código incorrecto o expirado. Revisá e intentá de nuevo.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await api.auth.reenviarOtp({ dni, email });
      setCooldown(RESEND_COOLDOWN);
      toast.success("Código reenviado.");
    } catch {
      toast.error("No se pudo reenviar el código.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <SolicitudProgress current="otp" />

      <div className="rounded-2xl border border-border bg-white shadow-sm p-8 mt-6">
        <button
          type="button"
          onClick={() => router.push("/solicitar")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </button>

        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy/5">
            <svg className="h-7 w-7 text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 10h20M6 14h.01M10 14h.01M14 14h.01" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-semibold text-navy mb-2">
            Verificá tu identidad
          </h1>
          <p className="text-sm text-muted-foreground">
            Ingresá el código de 6 dígitos enviado a
          </p>
          <p className="text-sm font-medium text-navy mt-1">{email || "tu email"}</p>
        </div>

        <div className="space-y-6">
          <OtpInput
            value={otpValue}
            onChange={(v) => { setOtpValue(v); setOtpError(false); }}
            disabled={loading}
            error={otpError}
          />

          {otpError && (
            <p className="text-center text-xs text-destructive animate-fade-in">
              Código inválido. Verificá los dígitos o solicitá uno nuevo.
            </p>
          )}

          <Button
            type="button"
            variant="gold"
            size="lg"
            className="w-full"
            loading={loading}
            disabled={otpValue.length !== 6}
            onClick={handleSubmit}
          >
            Verificar código
          </Button>

          <div className="text-center">
            {cooldown > 0 ? (
              <p className="text-xs text-muted-foreground">
                Podés reenviar el código en{" "}
                <span className="font-medium text-navy tabular-nums">{cooldown}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="inline-flex items-center gap-1.5 text-xs text-navy hover:underline disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${resendLoading ? "animate-spin" : ""}`} />
                Reenviar código
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
