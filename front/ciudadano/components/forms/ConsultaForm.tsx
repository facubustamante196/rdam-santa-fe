"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { consultarSolicitud, ApiError } from "@/lib/api";
import {
  ConsultaFormSchema,
  type ConsultaFormValues,
  type ConsultaResponse,
} from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/error-message";

interface ConsultaFormProps {
  onSuccess: (data: ConsultaResponse) => void;
}

export function ConsultaForm({ onSuccess }: ConsultaFormProps) {
  const [error, setError] = useState<unknown>(null);
  const form = useForm<ConsultaFormValues>({
    resolver: zodResolver(ConsultaFormSchema),
    defaultValues: { codigo: "", dni: "", email: "" },
  });

  const handleApiError = (err: unknown) => {
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
  };

  const mutation = useMutation({
    mutationFn: consultarSolicitud,
    onSuccess,
    onError: handleApiError,
  });

  return (
    <form
      className="grid gap-3"
      onSubmit={form.handleSubmit((values) => {
        setError(null);
        mutation.mutate(values);
      })}
    >
      <div>
        <label className="text-xs font-semibold text-slate-500">Codigo</label>
        <Input placeholder="RDAM-2026-00247" {...form.register("codigo")} />
      </div>
      <p className="text-xs text-slate-400">O consulta por DNI y email</p>
      <div>
        <label className="text-xs font-semibold text-slate-500">DNI</label>
        <Input placeholder="30456789" {...form.register("dni")} />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500">Email</label>
        <Input placeholder="email@ejemplo.com" {...form.register("email")} />
      </div>
      {form.formState.errors.codigo ? (
        <p className="text-xs text-red-600">
          {form.formState.errors.codigo.message}
        </p>
      ) : null}
      <Button type="submit" disabled={mutation.isPending}>
        Consultar
      </Button>
      <ErrorMessage error={error} />
    </form>
  );
}
