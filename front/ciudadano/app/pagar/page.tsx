"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { iniciarPago, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";

export default function Page() {
  const params = useSearchParams();
  const codigo = params.get("codigo") ?? "";
  const [error, setError] = useState<unknown>(null);

  const mutation = useMutation({
    mutationFn: (codigoSolicitud: string) => iniciarPago(codigoSolicitud),
    onSuccess: (data) => {
      const form = document.createElement("form");
      form.method = data.metodo || "POST";
      form.action = data.url_pago;
      Object.entries(data.checkout_fields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          void fetch("/api/session", { method: "DELETE" }).finally(() => {
            window.location.href = "/solicitar";
          });
          return;
        }
        if (err.status === 404) {
          setError(new Error("No encontrado"));
          return;
        }
        if (err.status === 429) {
          setError(new Error("Demasiados intentos, espera unos minutos"));
          return;
        }
        if (err.status === 500) {
          setError(new Error("Error del servidor, intente mas tarde"));
          return;
        }
      }
      setError(err);
    },
  });

  const isReady = useMemo(() => codigo.length > 0, [codigo]);

  useEffect(() => {
    if (!isReady) return;
    setError(null);
    mutation.mutate(codigo);
  }, [isReady, codigo, mutation]);

  if (!isReady) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Pago</h2>
        <p className="mt-2 text-sm text-slate-500">No encontrado</p>
      </div>
    );
  }

  if (mutation.isPending) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Pago</h2>
        <p className="mt-2 text-sm text-slate-500">
          Redirigiendo a la pasarela...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Pago</h2>
        <ErrorMessage error={error} />
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => {
            setError(null);
            mutation.mutate(codigo);
          }}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return null;
}
