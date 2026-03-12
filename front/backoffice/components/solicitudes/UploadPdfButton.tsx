"use client";

import { useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { uploadPdf, ApiError } from "@/lib/api";
import type { EstadoSolicitud } from "@/types";

interface UploadPdfButtonProps {
  solicitudId: string;
  estadoSolicitud: EstadoSolicitud;
  onSuccess: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const UploadPdfButton = ({
  solicitudId,
  estadoSolicitud,
  onSuccess,
}: UploadPdfButtonProps) => {
  const { data: session } = useSession();
  const token = session?.accessToken ?? "";
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (estadoSolicitud !== "PAGADA") {
    return null;
  }

  const handleSelect = () => {
    inputRef.current?.click();
  };

  const handleUpload = async (file: File) => {
    setError(null);
    if (file.type !== "application/pdf") {
      setError("El archivo debe ser un PDF.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("El archivo supera el limite de 5MB.");
      return;
    }

    try {
      setIsLoading(true);
      await uploadPdf({ token, solicitudId, file });
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut({ callbackUrl: "/login" });
        return;
      }
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("No se pudo subir el PDF.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleUpload(file);
          }
        }}
      />
      <Button type="button" onClick={handleSelect} disabled={isLoading}>
        {isLoading ? <Spinner size="sm" /> : "Subir PDF"}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
};
