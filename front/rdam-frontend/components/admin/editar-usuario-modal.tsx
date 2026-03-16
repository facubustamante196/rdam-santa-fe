"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { actualizarUsuarioSchema, type ActualizarUsuarioInput } from "@/lib/schemas";
import { api, type Usuario } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";

interface EditarUsuarioModalProps {
  usuario: Usuario;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (u: Usuario) => void;
}

export function EditarUsuarioModal({ usuario, isOpen, onClose, onSuccess }: EditarUsuarioModalProps) {
  const { adminToken } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ActualizarUsuarioInput>({
    resolver: zodResolver(actualizarUsuarioSchema),
    defaultValues: {
      nombreCompleto: usuario.nombre,
      username: usuario.username,
      rol: usuario.rol as any,
      circunscripcion: usuario.circunscripcion || "",
      activo: usuario.activo,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        nombreCompleto: usuario.nombre,
        username: usuario.username,
        rol: usuario.rol as any,
        circunscripcion: usuario.circunscripcion || "",
        activo: usuario.activo,
      });
    }
  }, [isOpen, usuario, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: ActualizarUsuarioInput) => {
    setLoading(true);
    try {
      const actualizado = await api.admin.usuarios.actualizar(
        usuario.id,
        {
          nombreCompleto: data.nombreCompleto,
          username: data.username,
          rol: data.rol,
          circunscripcion: data.circunscripcion,
          activo: data.activo,
        },
        adminToken ?? ""
      );
      toast.success("Usuario actualizado correctamente");
      onSuccess(actualizado);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-border animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
          <h3 className="font-display text-lg font-semibold text-navy">Editar Operario</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nombre completo" error={errors.nombreCompleto?.message} required>
              <Input {...register("nombreCompleto")} placeholder="Apellido, Nombre" />
            </FormField>

            <FormField label="Usuario" error={errors.username?.message} required>
              <Input {...register("username")} placeholder="pj.apellido" />
            </FormField>

            <FormField label="Rol" error={errors.rol?.message} required>
              <select
                {...register("rol")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="OPERARIO">Operario</option>
                <option value="SUPERVISOR">Supervisor</option>
              </select>
            </FormField>

            <FormField label="Circunscripción" error={errors.circunscripcion?.message}>
              <select
                {...register("circunscripcion")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Ninguna</option>
                <option value="SANTA_FE">Santa Fe</option>
                <option value="ROSARIO">Rosario</option>
                <option value="VENADO_TUERTO">Venado Tuerto</option>
                <option value="RAFAELA">Rafaela</option>
                <option value="RECONQUISTA">Reconquista</option>
              </select>
            </FormField>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="activo-edit"
              {...register("activo")}
              className="h-4 w-4 rounded border-gray-300 text-gold focus:ring-gold"
            />
            <label htmlFor="activo-edit" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-opacity-70">
              Usuario activo
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="gold" loading={loading} className="gap-2">
              <Save className="h-4 w-4" />
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
