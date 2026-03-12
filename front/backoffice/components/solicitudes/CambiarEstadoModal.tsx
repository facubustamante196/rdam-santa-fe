"use client";

import { useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { cambiarEstado, ApiError } from "@/lib/api";
import { usePermissions } from "@/hooks/usePermissions";
import type { EstadoSolicitud } from "@/types";

interface CambiarEstadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  solicitudId: string;
  estadoActual: EstadoSolicitud;
  onSuccess: () => void;
}

const ESTADOS: EstadoSolicitud[] = [
  "PENDIENTE_PAGO",
  "PAGADA",
  "RECHAZADA",
  "EMITIDA",
  "VENCIDO",
  "PUBLICADO_VENCIDO",
];

export const CambiarEstadoModal = ({
  isOpen,
  onClose,
  solicitudId,
  estadoActual,
  onSuccess,
}: CambiarEstadoModalProps) => {
  const { canCambiarEstado } = usePermissions();
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";
  const [estado, setEstado] = useState<EstadoSolicitud>("PAGADA");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const estadosDisponibles = useMemo(
    () => ESTADOS.filter((item) => item !== estadoActual),
    [estadoActual],
  );

  if (!canCambiarEstado) {
    return null;
  }

  const handleSubmit = async () => {
    setError(null);
    try {
      setIsLoading(true);
      await cambiarEstado({ token, solicitudId, estado });
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut({ callbackUrl: "/login" });
        return;
      }
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("No se pudo cambiar el estado.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cambiar estado">
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-500">
            Estado destino
          </label>
          <Select
            value={estado}
            onChange={(event) => setEstado(event.target.value as EstadoSolicitud)}
          >
            {estadosDisponibles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          {error ? (
            <p className="mt-2 text-xs text-red-600">{error}</p>
          ) : null}
        </div>
        <Button type="button" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? <Spinner size="sm" /> : "Confirmar"}
        </Button>
      </div>
    </Modal>
  );
};
