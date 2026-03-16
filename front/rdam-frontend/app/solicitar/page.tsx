"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ShieldCheck, Mail, CreditCard } from "lucide-react";

import { otpSolicitarSchema, type OtpSolicitarInput } from "@/lib/schemas";
import { api } from "@/lib/api";
import { useSolicitudStore } from "@/lib/stores/solicitud.store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { RecaptchaMock } from "@/components/shared/recaptcha-mock";
import { SolicitudProgress } from "@/components/citizen/solicitud-progress";

export default function SolicitarPage() {
  const router = useRouter();
  const { setCredentials, goToStep } = useSolicitudStore();
  const [captchaOk, setCaptchaOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpSolicitarInput>({
    resolver: zodResolver(otpSolicitarSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: OtpSolicitarInput) => {
    if (!captchaOk) {
      toast.error("Completá el captcha antes de continuar.");
      return;
    }
    setLoading(true);
    try {
      // Pass a dummy token since it's disabled in backend .env but required by flow
      const res = await api.auth.solicitarOtp({ 
        dni: data.dni, 
        email: data.email,
        captchaToken: "mock-token-verification-v2-length-satisfied"
      });
      
      setCredentials(data.dni, data.email);
      router.push("/solicitar/otp");
      
      if (res._dev_otp) {
        toast.success(`Código enviado. (DEV: ${res._dev_otp})`, { duration: 10000 });
      } else {
        toast.success("Código enviado a tu email.");
      }
    } catch (error: any) {
      const msg = error.body?.message || "No se pudo enviar el código. Intentá de nuevo.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <SolicitudProgress current="credentials" />

      <div className="rounded-2xl border border-border bg-white shadow-sm p-8 mt-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-navy mb-1">
            Solicitar certificado
          </h1>
          <p className="text-sm text-muted-foreground">
            Ingresá tu DNI y email para comenzar. Te enviaremos un código de
            verificación.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            label="DNI"
            error={errors.dni?.message}
            required
            htmlFor="dni"
            hint="Sin puntos ni espacios"
          >
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="dni"
                inputMode="numeric"
                placeholder="12345678"
                className="pl-9"
                error={errors.dni?.message}
                {...register("dni")}
              />
            </div>
          </FormField>

          <FormField
            label="Email"
            error={errors.email?.message}
            required
            htmlFor="email"
            hint="El código OTP se enviará a este correo"
          >
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

          <RecaptchaMock verified={captchaOk} onVerify={() => setCaptchaOk(true)} />

          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="w-full"
            loading={loading}
          >
            <ShieldCheck className="h-4 w-4" />
            Solicitar código OTP
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4">
        ¿Ya iniciaste un trámite?{" "}
        <a href="/solicitar/consulta" className="text-navy hover:underline">
          Consultar estado
        </a>
      </p>
    </div>
  );
}
