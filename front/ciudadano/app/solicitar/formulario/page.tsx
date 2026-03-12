"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NuevaSolicitudForm } from "@/components/forms/NuevaSolicitudForm";
import { checkOtpSession } from "@/lib/api";

export default function Page() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    checkOtpSession()
      .then((data) => {
        if (!data.authenticated) {
          router.replace("/solicitar");
        } else {
          setReady(true);
        }
      })
      .catch(() => {
        router.replace("/solicitar");
      });
  }, [router]);

  if (!ready) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">
        Crear solicitud
      </h2>
      <p className="mt-2 text-xs text-slate-500">
        Completa tus datos para generar el certificado.
      </p>
      <div className="mt-4">
        <NuevaSolicitudForm />
      </div>
    </section>
  );
}
