"use client";

import { useRouter } from "next/navigation";
import { OtpRequestForm } from "@/components/forms/OtpRequestForm";
import { useOtpSession } from "@/store/useOtpSession";
import type { OtpSolicitarFormValues } from "@/lib/schemas";

export default function Page() {
  const router = useRouter();
  const setOtpData = useOtpSession((state) => state.setOtpData);
  const clear = useOtpSession((state) => state.clear);

  const handleSuccess = (values: OtpSolicitarFormValues) => {
    clear();
    setOtpData({ dni: values.dni, email: values.email });
    router.push("/solicitar/verificar");
  };

  return (
    <section className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">
        Solicitar codigo
      </h2>
      <p className="mt-2 text-xs text-slate-500">
        Ingresa tu DNI y email para recibir el codigo de verificacion.
      </p>
      <div className="mt-4">
        <OtpRequestForm onSuccess={handleSuccess} />
      </div>
    </section>
  );
}
