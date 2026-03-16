"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Calendar, Mail, MapPin, User, 
  Clock, Shield, Hash, FileText, CheckCircle2,
  AlertCircle, Users, ExternalLink
} from "lucide-react";
import { toast } from "sonner";

import { api, type AdminSolicitud, type Usuario, type EstadoSolicitud } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import { formatDateTime, formatDate } from "@/lib/utils";
import { CIRC_ENUM_TO_ID } from "@/lib/schemas";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EstadoBadge } from "@/components/shared/estado-badge";
import { Separator } from "@/components/ui/separator";

export default function SolicitudDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { adminToken, adminRole } = useAuthStore();
  
  const [solicitud, setSolicitud] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [operarios, setOperarios] = useState<Usuario[]>([]);
  const [assigning, setAssigning] = useState(false);

  const fetchData = useCallback(async () => {
    if (!adminToken || !id) return;
    setLoading(true);
    try {
      const data = await api.admin.solicitudes.detalle(id as string, adminToken);
      setSolicitud(data);
      
      if (adminRole === "SUPERVISOR") {
        const ops = await api.admin.usuarios.listar(adminToken);
        setOperarios((ops as any).operarios || []);
      }
    } catch (error) {
      toast.error("No se pudo cargar la solicitud");
      router.push("/admin/solicitudes");
    } finally {
      setLoading(false);
    }
  }, [id, adminToken, adminRole, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAsignar = async (operarioId: string) => {
    if (!adminToken) return;
    setAssigning(true);
    try {
      await api.admin.solicitudes.asignar(id as string, operarioId, adminToken);
      toast.success("Operario asignado correctamente");
      fetchData();
    } catch (error) {
      toast.error("Error al asignar operario");
    } finally {
      setAssigning(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!adminToken) return;
    try {
      await api.admin.solicitudes.cambiarEstado(id as string, { 
        estado: nuevoEstado, 
        observaciones: `Cambio manual por ${adminRole}` 
      }, adminToken);
      toast.success("Estado actualizado");
      fetchData();
    } catch (error) {
      toast.error("Error al cambiar estado");
    }
  };

  const handleUploadPdf = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("archivo") as File;
    
    if (!file || file.size === 0) {
      toast.error("Seleccioná un archivo PDF");
      return;
    }

    if (!adminToken) return;
    setAssigning(true); // Reusing assigning state for general loading
    try {
      await api.admin.solicitudes.cargarPdf(id as string, formData, adminToken);
      toast.success("Certificado emitido y enviado por email");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Error al subir el certificado");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    );
  }

  if (!solicitud) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 w-9 p-0" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl font-bold text-navy">
                {solicitud.codigo}
              </h2>
              <EstadoBadge estado={solicitud.estado} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Creada el {formatDateTime(solicitud.createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {adminRole === "SUPERVISOR" && solicitud.estado !== "EMITIDA" && (
            <div className="flex items-center gap-2">
              <select 
                className="rounded-md border border-input bg-white px-3 py-1.5 text-xs focus:outline-none"
                defaultValue=""
                onChange={(e) => e.target.value && handleAsignar(e.target.value)}
                disabled={assigning}
              >
                <option value="" disabled>Asignar operario...</option>
                {operarios.map(op => (
                  <option key={op.id} value={op.id}>{op.nombre}</option>
                ))}
              </select>
            </div>
          )}
          
          {solicitud.pdfUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={solicitud.pdfUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-2" />
                Ver PDF
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col - Data */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-gold" />
                Datos del Ciudadano
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Nombre Completo</p>
                <p className="text-sm font-medium text-navy">{solicitud.nombreCompleto}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">DNI / CUIL</p>
                <p className="text-sm font-mono text-navy">
                  {solicitud.dni} / {solicitud.cuil}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-navy" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Email de contacto</p>
                  <p className="text-sm font-medium">{solicitud.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-navy" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Fecha de Nacimiento</p>
                  <p className="text-sm font-medium">{formatDate(solicitud.fechaNacimiento)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-navy" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Circunscripción</p>
                  <p className="text-sm font-medium">
                    {CIRC_ENUM_TO_ID[solicitud.circunscripcion]}ª - {solicitud.circunscripcion}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gold/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-gold" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Asignado a</p>
                  <p className="text-sm font-medium">
                    {solicitud.operarioAsignado?.nombreCompleto || "Sin asignar"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-gold" />
                Historial de Solicitud
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {solicitud.registrosAuditoria?.map((log: any, i: number) => (
                  <div key={log.id} className="relative pl-6 pb-6 last:pb-0">
                    {i !== solicitud.registrosAuditoria.length - 1 && (
                      <div className="absolute left-[7px] top-6 bottom-0 w-px bg-border"></div>
                    )}
                    <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-gold bg-white"></div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <p className="text-sm font-bold text-navy">{log.accion.replace(/_/g, " ")}</p>
                      <span className="text-[10px] font-medium text-muted-foreground">{formatDateTime(log.timestamp)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Realizado por <span className="font-semibold text-foreground">{log.usuario?.nombreCompleto || log.actorTipo}</span>
                    </p>
                    {log.observaciones && (
                      <div className="mt-2 text-xs bg-secondary/30 p-2 rounded-md border-l-2 border-gold/30 italic">
                        "{log.observaciones}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col - Info & Actions */}
        <div className="space-y-6">
          <Card className="bg-navy text-white overflow-hidden relative">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Shield className="h-24 w-24" />
            </div>
            <CardHeader>
              <CardTitle className="text-base text-gold font-display uppercase tracking-widest">Estado Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                     <CheckCircle2 className="h-6 w-6 text-gold" />
                   </div>
                   <div>
                     <p className="text-xs text-white/60 mb-1 uppercase font-bold tracking-tighter">Estado Operativo</p>
                     <p className="text-xl font-display font-bold tracking-wide">{solicitud.estado.replace(/_/g, " ")}</p>
                   </div>
                </div>
                
                <Separator className="bg-white/10" />
                
                <div className="space-y-2">
                  <p className="text-xs text-white/60 uppercase font-bold">Resumen Técnico</p>
                  <div className="grid grid-cols-2 gap-2">
                     <div className="bg-white/5 p-2 rounded">
                        <p className="text-[10px] text-white/40">ID Sistema</p>
                        <p className="text-[10px] font-mono truncate">{solicitud.id}</p>
                     </div>
                     <div className="bg-white/5 p-2 rounded">
                        <p className="text-[10px] text-white/40">Código Público</p>
                        <p className="text-[10px] font-mono">{solicitud.codigo}</p>
                     </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emitir Certificado - Only if PAGADA */}
          {solicitud.estado === "PAGADA" && (
            <Card className="border-gold/50 shadow-md animate-in zoom-in-95 duration-300">
              <CardHeader className="pb-3 border-b border-border/50 bg-secondary/10">
                <CardTitle className="text-base flex items-center gap-2 text-navy">
                  <FileText className="h-5 w-5 text-gold" />
                  Emitir Certificado Oficial
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Para emitir el certificado, adjunte el archivo PDF generado por el sistema registral. 
                  Al confirmar, la solicitud pasará a estado <Badge variant="success">EMITIDA</Badge> y el ciudadano recibirá el PDF por email automáticamente.
                </p>
                <form onSubmit={handleUploadPdf} className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-tight text-muted-foreground">Seleccionar PDF</label>
                    <input 
                      type="file" 
                      name="archivo" 
                      accept=".pdf" 
                      required
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <Button type="submit" variant="gold" className="w-full" loading={assigning}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Generar Emisión y Notificar
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Payments Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Información de Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {solicitud.transaccionesPago?.length > 0 ? (
                solicitud.transaccionesPago.map((t: any) => (
                  <div key={t.id} className="p-3 rounded-lg border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={t.estado === "APROBADO" ? "success" : "outline"} className="text-[10px]">
                        {t.estado}
                      </Badge>
                      <span className="text-xs font-bold text-navy">${(t.monto / 100).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Ref: {t.gateway_id || "N/A"}</span>
                      <span>{formatDateTime(t.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">No hay intentos de pago registrados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
