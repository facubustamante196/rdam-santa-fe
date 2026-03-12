"use client";

import type { EstadoSolicitud } from "@/types";

interface CambiarEstadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  solicitudId: string;
  estadoActual: EstadoSolicitud;
  onSuccess: () => void;
}

export const CambiarEstadoModal = ({}: CambiarEstadoModalProps) => {
  return null;
};
