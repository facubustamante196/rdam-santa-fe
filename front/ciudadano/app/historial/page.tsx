"use client";

import { useEffect, useState } from "react";
import { OtpRequestForm } from "@/components/forms/OtpRequestForm";
import { OtpValidateForm } from "@/components/forms/OtpValidateForm";
import { HistorialList } from "@/components/forms/HistorialList";
import { useOtpSession } from "@/store/useOtpSession";
import type { OtpSolicitarFormValues } from "@/lib/schemas";
import { checkOtpSession } from "@/lib/api";

export default function Page() {
  const validated = useOtpSession((state) => state.validated);
  const setValidated = useOtpSession((state) => state.setValidated);
  const [otpData, setOtpData] = useState<OtpSolicitarFormValues | null>(null);

  useEffect(() => {
    checkOtpSession()
      .then((data) => {
        if (data.authenticated) {
          setValidated(true);
        }
      })
      .catch(() => {});
  }, [setValidated]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          Acceso con OTP
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          Solicita y valida tu OTP para ver el historial.
        </p>
        <div className="mt-4 space-y-6">
          <OtpRequestForm onSuccess={setOtpData} />
          <OtpValidateForm
            defaultValues={{
              dni: otpData?.dni,
              email: otpData?.email,
            }}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          Historial de solicitudes
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          Descarga certificados vigentes desde esta lista.
        </p>
        <div className="mt-4">
          {validated ? (
            <HistorialList />
          ) : (
            <p className="text-sm text-slate-500">
              Valida el OTP para habilitar el historial.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
