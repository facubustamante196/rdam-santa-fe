"use client";

import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fetchOperarios } from "@/lib/api";
import {
  NuevoOperarioSchema,
  NuevoOperarioValues,
} from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { usePermissions } from "@/hooks/usePermissions";
import { useSession } from "next-auth/react";

export default function Page() {
  const { can } = usePermissions();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const { data: operarios } = useQuery({
    queryKey: ["operarios"],
    queryFn: () => fetchOperarios(token ?? ""),
    enabled: !!token,
  });

  const form = useForm<NuevoOperarioValues>({
    resolver: zodResolver(NuevoOperarioSchema),
    defaultValues: {
      nombre: "",
      usuario: "",
      rol: "OPERARIO",
      circunscripcion: "SANTA_FE",
    },
  });

  if (!operarios) {
    return <div className="text-sm text-slate-500">Cargando operarios...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Operario</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Circunscripcion</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {operarios.operarios.map((operario) => (
              <tr
                key={operario.id}
                className="border-b border-slate-100 last:border-b-0"
              >
                <td className="px-4 py-3 font-medium text-slate-800">
                  {operario.nombreCompleto}
                </td>
                <td className="px-4 py-3">{operario.rol}</td>
                <td className="px-4 py-3">{operario.circunscripcion}</td>
                <td className="px-4 py-3">
                  {operario.activo ? "Activo" : "Inactivo"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">
          Nuevo operario
        </h3>
        <form
          className="mt-4 grid gap-3 md:grid-cols-4"
          onSubmit={form.handleSubmit(() => {})}
        >
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-500">
              Nombre completo
            </label>
            <Input {...form.register("nombre")} />
            {form.formState.errors.nombre ? (
              <p className="text-xs text-red-600">
                {form.formState.errors.nombre.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Usuario</label>
            <Input {...form.register("usuario")} />
            {form.formState.errors.usuario ? (
              <p className="text-xs text-red-600">
                {form.formState.errors.usuario.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Rol</label>
            <Select {...form.register("rol")}>
              <option value="OPERARIO">Operario</option>
              <option value="SUPERVISOR">Supervisor</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-500">
              Circunscripcion
            </label>
            <Select {...form.register("circunscripcion")}>
              <option value="SANTA_FE">SANTA_FE</option>
              <option value="ROSARIO">ROSARIO</option>
              <option value="VENADO_TUERTO">VENADO_TUERTO</option>
              <option value="RAFAELA">RAFAELA</option>
              <option value="RECONQUISTA">RECONQUISTA</option>
            </Select>
            {form.formState.errors.circunscripcion ? (
              <p className="text-xs text-red-600">
                {form.formState.errors.circunscripcion.message}
              </p>
            ) : null}
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={!can("manage:operarios")}>
              Crear operario
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
