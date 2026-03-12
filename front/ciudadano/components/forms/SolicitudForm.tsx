"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { crearSolicitud } from "@/lib/api";
import {
  SolicitudFormSchema,
  type SolicitudFormValues,
} from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type SolicitudFormProps = {
  token: string;
};

export function SolicitudForm({ token }: SolicitudFormProps) {
  const [message, setMessage] = useState<string | null>(null);
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

  const mutation = useMutation({
    mutationFn: (values: SolicitudFormValues) => crearSolicitud(token, values),
    onSuccess: (data) => {
      setMessage(data.mensaje);
      if (typeof window !== "undefined") {
        window.location.href = data.url_pago;
      }
    },
  });

  return (
    <form
      className="grid gap-3"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
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
      {mutation.error ? (
        <p className="text-xs text-red-600">No se pudo crear la solicitud.</p>
      ) : null}
    </form>
  );
}
