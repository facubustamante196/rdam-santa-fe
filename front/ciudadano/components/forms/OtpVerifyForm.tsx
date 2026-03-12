"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { reenviarOtp, validarOtp, ApiError } from "@/lib/api";
import {
  OtpValidarFormSchema,
  type OtpValidarFormValues,
} from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { OtpInput } from "@/components/ui/OtpInput";
import { useOtpSession } from "@/store/useOtpSession";

type OtpVerifyFormProps = {
  onSuccess?: () => void;
};

const RESEND_SECONDS = 60;

export function OtpVerifyForm({ onSuccess }: OtpVerifyFormProps) {
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const { dni, email, setValidated } = useOtpSession();

  const form = useForm<OtpValidarFormValues>({
    resolver: zodResolver(OtpValidarFormSchema),
    defaultValues: {
      dni: dni ?? "",
      email: email ?? "",
      codigo: "",
      captchaToken: "token-valido-de-recaptcha",
    },
  });

  useEffect(() => {
    if (dni && email) {
      form.setValue("dni", dni);
      form.setValue("email", email);
    }
    form.setValue("captchaToken", "token-valido-de-recaptcha");
  }, [dni, email, form]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const codigo = form.watch("codigo");

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

  const validarMutation = useMutation({
    mutationFn: validarOtp,
    onSuccess: async (data) => {
      try {
        await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: data.access_token }),
        });
        setValidated(true);
        setMessage("Codigo validado. Ya podes continuar.");
        onSuccess?.();
      } catch (err) {
        setError(err);
      }
    },
    onError: (err) => {
      form.setValue("codigo", "");
      handleApiError(err);
    },
  });

  const reenviarMutation = useMutation({
    mutationFn: reenviarOtp,
    onSuccess: () => {
      setMessage("Codigo reenviado. Revisa tu email.");
      setSecondsLeft(RESEND_SECONDS);
    },
    onError: handleApiError,
  });

  const canResend = useMemo(
    () => secondsLeft === 0 && Boolean(dni && email),
    [secondsLeft, dni, email],
  );

  const handleResend = () => {
    setError(null);
    if (!dni || !email) return;
    reenviarMutation.mutate({
      dni,
      email,
      captchaToken: "token-valido-de-recaptcha",
    });
  };

  const handleSubmit = () => {
    setError(null);
    form.handleSubmit((values) => {
      validarMutation.mutate({
        ...values,
        captchaToken: "token-valido-de-recaptcha",
      });
    })();
  };

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm text-slate-700">
          Ingresa el codigo de 6 digitos que enviamos a{" "}
          <span className="font-semibold">{email}</span>
        </p>
      </div>
      <OtpInput
        value={codigo}
        onChange={(value) => form.setValue("codigo", value, { shouldValidate: true })}
      />
      <input type="hidden" {...form.register("dni")} />
      <input type="hidden" {...form.register("email")} />
      <input type="hidden" {...form.register("captchaToken")} />
      {form.formState.errors.codigo ? (
        <p className="text-xs text-red-600">
          {form.formState.errors.codigo.message}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={validarMutation.isPending || !dni || !email}
        >
          Verificar codigo
        </Button>
        <button
          type="button"
          onClick={handleResend}
          disabled={!canResend || reenviarMutation.isPending}
          className="text-xs font-medium text-primary hover:underline disabled:text-slate-400"
        >
          {canResend ? "Reenviar codigo" : `Reenviar en ${secondsLeft}s`}
        </button>
      </div>
      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      <ErrorMessage error={error} />
    </div>
  );
}
