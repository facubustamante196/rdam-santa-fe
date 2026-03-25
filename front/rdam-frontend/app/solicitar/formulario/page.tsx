"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { User, CreditCard, Mail, Calendar } from "lucide-react";

import { solicitudSchema, type SolicitudInput, CIRC_ID_TO_ENUM } from "@/lib/schemas";
import { api } from "@/lib/api";
import { useSolicitudStore } from "@/lib/stores/solicitud.store";
import { useAuthStore } from "@/lib/stores/auth.store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { CircunscripcionSelector } from "@/components/shared/circunscripcion-selector";
import { SolicitudProgress } from "@/components/citizen/solicitud-progress";

export default function FormularioPage() {
  const router = useRouter();
  const { email: storedEmail, otpToken, setSolicitudResult } = useSolicitudStore();
  const { citizenToken } = useAuthStore();
  const token = citizenToken ?? otpToken ?? "";
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace("/solicitar");
    }
  }, [token, router]);

  if (!token) {
    return null;
  }

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<SolicitudInput>({
    resolver: zodResolver(solicitudSchema),
    mode: "onChange",
    defaultValues: { email: storedEmail },
  });

  const circunscripcion = watch("circunscripcion");

  const onSubmit = async (data: SolicitudInput) => {
    setLoading(true);
    try {
      // Map frontend IDs to backend Enums
      const res = await api.solicitudes.crear(
        {
          cuil: data.cuil.replace(/-/g, ""),
          nombre_completo: data.nombre,
          fecha_nacimiento: data.fecha_nacimiento,
          email: data.email,
          circunscripcion: CIRC_ID_TO_ENUM[data.circunscripcion] || data.circunscripcion,
        },
        token
      );
      setSolicitudResult(res.id, res.codigo, res.url_pago);
      toast.success(`Solicitud creada. Código: ${res.codigo}`);
      router.push("/solicitar/pago");
    } catch {
      toast.error("No se pudo crear la solicitud. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <SolicitudProgress current="form" />

      <div className="rounded-2xl border border-border bg-white shadow-sm p-8 mt-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-navy mb-1">
            Completá tus datos
          </h1>
          <p className="text-sm text-muted-foreground">
            Todos los campos son obligatorios para procesar tu solicitud.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* CUIL */}
          <FormField label="CUIL" error={errors.cuil?.message} required htmlFor="cuil" hint="Formato: 20-12345678-9">
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="cuil"
                inputMode="numeric"
                placeholder="20-12345678-9"
                className="pl-9 font-mono"
                error={errors.cuil?.message}
                {...register("cuil")}
              />
            </div>
          </FormField>

          {/* Nombre */}
          <FormField label="Nombre completo" error={errors.nombre?.message} required htmlFor="nombre">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="nombre"
                placeholder="Juan Carlos García"
                className="pl-9"
                error={errors.nombre?.message}
                {...register("nombre")}
              />
            </div>
          </FormField>

          {/* Fecha de nacimiento */}
          <FormField label="Fecha de nacimiento" error={errors.fecha_nacimiento?.message} required htmlFor="fdn">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="fdn"
                type="date"
                className="pl-9"
                error={errors.fecha_nacimiento?.message}
                {...register("fecha_nacimiento")}
              />
            </div>
          </FormField>

          {/* Email */}
          <FormField label="Email" error={errors.email?.message} required htmlFor="email">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="nombre@ejemplo.com"
                className="pl-9"
                error={errors.email?.message}
                {...register("email")}
              />
            </div>
          </FormField>

          {/* Circunscripción */}
          <FormField label="Circunscripción" error={errors.circunscripcion?.message} required>
            <Controller
              name="circunscripcion"
              control={control}
              render={({ field }) => (
                <CircunscripcionSelector
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  error={errors.circunscripcion?.message}
                  disabled={loading}
                />
              )}
            />
          </FormField>

          <div className="pt-2">
            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full"
              loading={loading}
            >
              Continuar al pago
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
