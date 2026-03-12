"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { asignarOperario, ApiError } from "@/lib/api";
import { usePermissions } from "@/hooks/usePermissions";

interface AsignarOperarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  solicitudId: string;
  onSuccess: () => void;
}

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const AsignarOperarioModal = ({
  isOpen,
  onClose,
  solicitudId,
  onSuccess,
}: AsignarOperarioModalProps) => {
  const { canAsignarOperario } = usePermissions();
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";
  const [operarioId, setOperarioId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!canAsignarOperario) {
    return null;
  }

  const handleSubmit = async () => {
    setError(null);
    if (!uuidRegex.test(operarioId)) {
      setError("El operario_id debe ser un UUID valido.");
      return;
    }

    try {
      setIsLoading(true);
      await asignarOperario({ token, solicitudId, operarioId });
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
        setError("No se pudo asignar el operario.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asignar operario">
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-500">
            Operario ID
          </label>
          <Input
            value={operarioId}
            onChange={(event) => setOperarioId(event.target.value)}
            placeholder="UUID del operario"
          />
          {error ? (
            <p className="mt-2 text-xs text-red-600">{error}</p>
          ) : null}
        </div>
        <Button type="button" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? <Spinner size="sm" /> : "Asignar"}
        </Button>
      </div>
    </Modal>
  );
};
