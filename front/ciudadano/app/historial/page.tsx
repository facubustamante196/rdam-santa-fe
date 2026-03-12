"use client";

import { useEffect } from "react";
import { OtpRequestForm } from "@/components/forms/OtpRequestForm";
import { OtpVerifyForm } from "@/components/forms/OtpVerifyForm";
import { HistorialList } from "@/components/forms/HistorialList";
import { useOtpSession } from "@/store/useOtpSession";
import { checkOtpSession } from "@/lib/api";

export default function Page() {
  const validated = useOtpSession((state) => state.validated);
  const setValidated = useOtpSession((state) => state.setValidated);
  const setOtpData = useOtpSession((state) => state.setOtpData);

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
          <OtpRequestForm
            onSuccess={(values) =>
              setOtpData({ dni: values.dni, email: values.email })
            }
          />
          <OtpVerifyForm />
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
