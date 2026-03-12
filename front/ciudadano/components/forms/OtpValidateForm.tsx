"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { validarOtp, ApiError } from "@/lib/api";
import {
  OtpValidarFormSchema,
  type OtpValidarFormValues,
} from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOtpSession } from "@/store/useOtpSession";
import { ErrorMessage } from "@/components/ui/error-message";

type OtpValidateFormProps = {
  defaultValues?: Partial<OtpValidarFormValues>;
  onSuccess?: () => void;
};

export function OtpValidateForm({
  defaultValues,
  onSuccess,
}: OtpValidateFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const setValidated = useOtpSession((state) => state.setValidated);
  const form = useForm<OtpValidarFormValues>({
    resolver: zodResolver(OtpValidarFormSchema),
    defaultValues: {
      dni: defaultValues?.dni ?? "",
      email: defaultValues?.email ?? "",
      codigo: "",
    },
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
    mutationFn: validarOtp,
    onSuccess: () => {
      setValidated(true);
      setMessage("OTP validado. Ya podes continuar.");
      onSuccess?.();
    },
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
        <label className="text-xs font-semibold text-slate-500">DNI</label>
        <Input placeholder="30456789" {...form.register("dni")} />
        {form.formState.errors.dni ? (
          <p className="text-xs text-red-600">
            {form.formState.errors.dni.message}
          </p>
        ) : null}
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500">Email</label>
        <Input placeholder="email@ejemplo.com" {...form.register("email")} />
        {form.formState.errors.email ? (
          <p className="text-xs text-red-600">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500">Codigo OTP</label>
        <Input placeholder="123456" {...form.register("codigo")} />
        {form.formState.errors.codigo ? (
          <p className="text-xs text-red-600">
            {form.formState.errors.codigo.message}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={mutation.isPending}>
        Validar OTP
      </Button>
      {message ? (
        <p className="text-xs text-emerald-700">{message}</p>
      ) : null}
      <ErrorMessage error={error} />
    </form>
  );
}
