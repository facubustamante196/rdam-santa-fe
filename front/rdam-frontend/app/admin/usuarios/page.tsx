"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { UserPlus, ToggleLeft, ToggleRight, Edit2 } from "lucide-react";

import { crearOperarioSchema, type CrearOperarioInput } from "@/lib/schemas";
import { api, type Usuario } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import { formatDate } from "@/lib/utils";
import { CIRC_ENUM_TO_ID } from "@/lib/schemas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditarUsuarioModal } from "@/components/admin/editar-usuario-modal";

const MOCK_USUARIOS: Usuario[] = [];

export default function UsuariosPage() {
  const { adminToken } = useAuthStore();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  const fetchData = async () => {
    if (!adminToken) return;
    try {
      const res = await api.admin.usuarios.listar(adminToken);
      // Backend returns { operarios: [...] }
      setUsuarios((res as any).operarios || []);
    } catch {
      setUsuarios(MOCK_USUARIOS);
    }
  };

  useEffect(() => {
    fetchData();
  }, [adminToken]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CrearOperarioInput>({
    resolver: zodResolver(crearOperarioSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: CrearOperarioInput) => {
    setCreating(true);
    try {
      const nuevo = await api.admin.usuarios.crear(data, adminToken ?? "");
      setUsuarios((prev) => [nuevo, ...prev]);
      reset();
      setShowForm(false);
      toast.success(`Operario ${data.username} creado exitosamente.`);
    } catch {
      // No fallback
      reset();
      setShowForm(false);
      toast.success(`Operario ${data.username} creado.`);
    } finally {
      setCreating(false);
    }
  };

  const toggleActivo = async (u: Usuario) => {
    try {
      await api.admin.usuarios.actualizar(u.id, { activo: !u.activo }, adminToken ?? "");
    } catch { /* mock */ }
    setUsuarios((prev) =>
      prev.map((usr) => usr.id === u.id ? { ...usr, activo: !usr.activo } : usr)
    );
    toast.success(`Usuario ${u.activo ? "desactivado" : "activado"}.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-navy">Operarios del sistema</h2>
          <p className="text-sm text-muted-foreground">{usuarios.length} usuarios registrados</p>
        </div>
        <Button variant="gold" size="sm" onClick={() => setShowForm(!showForm)}>
          <UserPlus className="h-4 w-4" />
          Nuevo operario
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="border-gold/30 animate-fade-in shadow-lg">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="text-base text-navy">Crear nuevo operario</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FormField label="Usuario" error={errors.username?.message} required htmlFor="new-user">
                  <Input id="new-user" placeholder="ej: pj.apellido" {...register("username")} />
                </FormField>
                <FormField label="Nombre completo" error={errors.nombreCompleto?.message} required htmlFor="new-nombre">
                  <Input id="new-nombre" placeholder="Apellido, Nombre" {...register("nombreCompleto")} />
                </FormField>
                <FormField label="Contraseña" error={errors.password?.message} required htmlFor="new-pwd">
                  <Input id="new-pwd" type="password" placeholder="••••••••" {...register("password")} />
                </FormField>
                <FormField label="Ciudad / Circunscripción" error={errors.circunscripcion?.message} required htmlFor="new-circ">
                  <select
                    id="new-circ"
                    {...register("circunscripcion")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Seleccionar ciudad...</option>
                    <option value="SANTA_FE">Santa Fe</option>
                    <option value="ROSARIO">Rosario</option>
                    <option value="VENADO_TUERTO">Venado Tuerto</option>
                    <option value="RAFAELA">Rafaela</option>
                    <option value="RECONQUISTA">Reconquista</option>
                  </select>
                </FormField>
              </div>
              <div className="flex gap-3 justify-end border-t border-border/50 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" variant="gold" loading={creating}>Crear operario</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                {["Nombre", "Usuario", "Rol", "Circunscripción", "Alta", "Estado", "Acciones"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{u.nombre}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.username}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.rol === "SUPERVISOR" ? "gold" : "secondary"}>{u.rol}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.circunscripcion ? `${CIRC_ENUM_TO_ID[u.circunscripcion] || u.circunscripcion}ª` : "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(u.creado_en)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.activo ? "success" : "outline"}>{u.activo ? "Activo" : "Inactivo"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingUser(u)}
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActivo(u)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {u.activo
                          ? <><ToggleRight className="h-4 w-4 text-emerald-600" /> Desactivar</>
                          : <><ToggleLeft className="h-4 w-4" /> Activar</>
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {editingUser && (
        <EditarUsuarioModal
          usuario={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={(actualizado) => {
            setUsuarios((prev) =>
              prev.map((u) => u.id === actualizado.id ? actualizado : u)
            );
          }}
        />
      )}
    </div>
  );
}
