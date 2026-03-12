"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { solicitarOtp } from "@/lib/api";
import {
  OtpSolicitarFormSchema,
  type OtpSolicitarFormValues,
} from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type OtpRequestFormProps = {
  onSuccess: (payload: OtpSolicitarFormValues) => void;
};

export function OtpRequestForm({ onSuccess }: OtpRequestFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<OtpSolicitarFormValues>({
    resolver: zodResolver(OtpSolicitarFormSchema),
    defaultValues: { dni: "", email: "", captchaToken: "" },
  });

  const mutation = useMutation({
    mutationFn: solicitarOtp,
    onSuccess: (_, values) => {
      setMessage("OTP enviado. Revisa tu email.");
      onSuccess(values);
    },
  });

  return (
    <form
      className="grid gap-3"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
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
        <label className="text-xs font-semibold text-slate-500">Captcha</label>
        <Input placeholder="Token captcha" {...form.register("captchaToken")} />
        {form.formState.errors.captchaToken ? (
          <p className="text-xs text-red-600">
            {form.formState.errors.captchaToken.message}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={mutation.isPending}>
        Solicitar OTP
      </Button>
      {message ? (
        <p className="text-xs text-emerald-700">{message}</p>
      ) : null}
      {mutation.error ? (
        <p className="text-xs text-red-600">No se pudo enviar OTP.</p>
      ) : null}
    </form>
  );
}
