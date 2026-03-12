"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { solicitarOtp, ApiError } from "@/lib/api";
import {
  OtpSolicitarFormSchema,
  type OtpSolicitarFormValues,
} from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/error-message";

type OtpRequestFormProps = {
  onSuccess: (payload: OtpSolicitarFormValues) => void;
};

export function OtpRequestForm({ onSuccess }: OtpRequestFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const form = useForm<OtpSolicitarFormValues>({
    resolver: zodResolver(OtpSolicitarFormSchema),
    defaultValues: {
      dni: "",
      email: "",
      captchaToken: "token-valido-de-recaptcha",
    },
  });

  useEffect(() => {
    form.setValue("captchaToken", "token-valido-de-recaptcha");
  }, [form]);

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
    mutationFn: solicitarOtp,
    onSuccess: (_, values) => {
      setMessage("OTP enviado. Revisa tu email.");
      onSuccess(values);
    },
    onError: handleApiError,
  });

  return (
    <form
      className="grid gap-3"
      onSubmit={form.handleSubmit((values) => {
        setError(null);
        mutation.mutate({
          ...values,
          captchaToken: "token-valido-de-recaptcha",
        });
      })}
    >
      <div>
        <label className="text-xs font-semibold text-slate-500">DNI</label>
        <Input
          placeholder="30456789"
          inputMode="numeric"
          maxLength={8}
          {...form.register("dni")}
        />
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
        <label className="text-xs font-semibold text-slate-500">
          Verificacion de seguridad
        </label>
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs text-slate-500">
          Verificacion de seguridad (proximamente)
        </div>
      </div>
      <input type="hidden" {...form.register("captchaToken")} />
      <Button type="submit" disabled={mutation.isPending}>
        Solicitar OTP
      </Button>
      {message ? (
        <p className="text-xs text-emerald-700">{message}</p>
      ) : null}
      <ErrorMessage error={error} />
    </form>
  );
}
