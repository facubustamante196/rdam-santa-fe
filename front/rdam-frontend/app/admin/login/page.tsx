"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Scale, Eye, EyeOff, Lock, User } from "lucide-react";

import { adminLoginSchema, type AdminLoginInput } from "@/lib/schemas";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAdminSession } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: AdminLoginInput) => {
    setLoading(true);
    try {
      const res = await api.admin.login(data);
      setAdminSession(res.access_token, res.usuario);
      toast.success(`Bienvenido, ${res.usuario.nombre}`);
      router.push("/admin/dashboard");
    } catch {
      toast.error("Credenciales incorrectas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-white/3 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/20">
            <Scale className="h-7 w-7 text-gold" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">
            Panel de administración
          </h1>
          <p className="text-sm text-white/50">RDAM — Poder Judicial Santa Fe</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              label="Usuario"
              error={errors.username?.message}
              required
              htmlFor="username"
            >
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  id="username"
                  type="text"
                  placeholder="operario.gonzalez"
                  autoComplete="username"
                  className="flex h-10 w-full rounded-md border border-white/15 bg-white/10 px-3 py-2 pl-9 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-gold/60 focus:border-transparent transition-colors"
                  {...register("username")}
                />
              </div>
            </FormField>

            <FormField
              label="Contraseña"
              error={errors.password?.message}
              required
              htmlFor="password"
            >
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="flex h-10 w-full rounded-md border border-white/15 bg-white/10 px-3 py-2 pl-9 pr-10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-gold/60 focus:border-transparent transition-colors"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full mt-2"
              loading={loading}
            >
              Ingresar
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          Acceso exclusivo para personal autorizado del Poder Judicial
        </p>
      </div>
    </div>
  );
}
