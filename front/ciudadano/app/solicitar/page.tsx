"use client";

import { useEffect, useState } from "react";
import { OtpRequestForm } from "@/components/forms/OtpRequestForm";
import { OtpValidateForm } from "@/components/forms/OtpValidateForm";
import { SolicitudForm } from "@/components/forms/SolicitudForm";
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
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          1. Solicitar OTP
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          Recibiras un codigo en tu email.
        </p>
        <div className="mt-4">
          <OtpRequestForm onSuccess={setOtpData} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          2. Validar OTP
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          Ingresa el codigo recibido para habilitar la solicitud.
        </p>
        <div className="mt-4">
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
          3. Crear solicitud
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          Completa los datos y seras redirigido al pago.
        </p>
        <div className="mt-4">
          {validated ? (
            <SolicitudForm />
          ) : (
            <p className="text-sm text-slate-500">
              Valida el OTP para habilitar el formulario.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
