"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { crearSolicitud, ApiError } from "@/lib/api";
import {
  SolicitudFormSchema,
  type SolicitudFormValues,
} from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ErrorMessage } from "@/components/ui/error-message";

export function SolicitudForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const form = useForm<SolicitudFormValues>({
    resolver: zodResolver(SolicitudFormSchema),
    defaultValues: {
      cuil: "",
      nombreCompleto: "",
      fechaNacimiento: "",
      email: "",
      circunscripcion: "SANTA_FE",
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
    mutationFn: (values: SolicitudFormValues) => crearSolicitud(values),
    onSuccess: (data) => {
      setMessage(data.mensaje);
      if (typeof window !== "undefined") {
        window.location.href = `/pagar?codigo=${encodeURIComponent(
          data.codigo,
        )}`;
      }
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
        <label className="text-xs font-semibold text-slate-500">CUIL</label>
        <Input placeholder="20304567894" {...form.register("cuil")} />
        {form.formState.errors.cuil ? (
          <p className="text-xs text-red-600">
            {form.formState.errors.cuil.message}
          </p>
        ) : null}
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500">Nombre completo</label>
        <Input placeholder="Apellido, Nombre" {...form.register("nombreCompleto")} />
        {form.formState.errors.nombreCompleto ? (
          <p className="text-xs text-red-600">
            {form.formState.errors.nombreCompleto.message}
          </p>
        ) : null}
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500">Fecha de nacimiento</label>
        <Input type="date" {...form.register("fechaNacimiento")} />
        {form.formState.errors.fechaNacimiento ? (
          <p className="text-xs text-red-600">
            {form.formState.errors.fechaNacimiento.message}
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
        <label className="text-xs font-semibold text-slate-500">Circunscripcion</label>
        <Select {...form.register("circunscripcion")}> 
          <option value="SANTA_FE">SANTA_FE</option>
          <option value="ROSARIO">ROSARIO</option>
          <option value="VENADO_TUERTO">VENADO_TUERTO</option>
          <option value="RAFAELA">RAFAELA</option>
          <option value="RECONQUISTA">RECONQUISTA</option>
        </Select>
      </div>
      <Button type="submit" disabled={mutation.isPending}>
        Crear solicitud
      </Button>
      {message ? (
        <p className="text-xs text-emerald-700">{message}</p>
      ) : null}
      <ErrorMessage error={error} />
    </form>
  );
}
