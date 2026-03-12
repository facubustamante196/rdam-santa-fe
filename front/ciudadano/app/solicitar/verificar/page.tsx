"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OtpVerifyForm } from "@/components/forms/OtpVerifyForm";
import { useOtpSession } from "@/store/useOtpSession";

export default function Page() {
  const router = useRouter();
  const { dni, email } = useOtpSession();

  useEffect(() => {
    if (!dni || !email) {
      router.replace("/solicitar");
    }
  }, [dni, email, router]);

  if (!dni || !email) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">
        Verificar codigo
      </h2>
      <p className="mt-2 text-xs text-slate-500">
        Ingresa el codigo que enviamos a tu email.
      </p>
      <div className="mt-4">
        <OtpVerifyForm onSuccess={() => router.push("/solicitar/formulario")} />
      </div>
    </section>
  );
}
