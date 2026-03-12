"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginFormSchema, LoginFormValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUiStore } from "@/hooks/useUiStore";
import { signIn } from "next-auth/react";

export default function Page() {
  const { selectedRole, setSelectedRole } = useUiStore();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    await signIn("credentials", {
      username: values.username,
      password: values.password,
      role: selectedRole,
      redirect: true,
      callbackUrl: selectedRole === "SUPERVISOR" ? "/dashboard" : "/solicitudes",
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Ingreso RDAM</h1>
          <p className="text-sm text-slate-600">
            Accede al panel operativo del Poder Judicial Santa Fe.
          </p>
        </div>

        <div className="mb-6 flex items-center gap-2">
          {(["OPERARIO", "SUPERVISOR"] as const).map((role) => (
            <Button
              key={role}
              type="button"
              variant={selectedRole === role ? "default" : "outline"}
              className="flex-1"
              onClick={() => setSelectedRole(role)}
            >
              {role === "OPERARIO" ? "Operario" : "Supervisor"}
            </Button>
          ))}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-medium text-slate-700">Usuario</label>
            <Input placeholder="usuario.apellido" {...register("username")} />
            {errors.username ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.username.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Contrasena
            </label>
            <Input type="password" {...register("password")} />
            {errors.password ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.password.message}
              </p>
            ) : null}
          </div>
          <Button className="w-full" disabled={isSubmitting} type="submit">
            Ingresar
          </Button>
        </form>
      </div>
    </div>
  );
}
