import { create } from "zustand";

export type SolicitudStep = "credentials" | "otp" | "form" | "payment" | "done";

interface SolicitudState {
  step: SolicitudStep;
  dni: string;
  email: string;
  otpToken: string | null;
  solicitudCodigo: string | null;
  solicitudId: string | null;
  urlPago: string | null;

  setCredentials: (dni: string, email: string) => void;
  setOtpToken: (token: string) => void;
  setSolicitudResult: (id: string, codigo: string, urlPago: string) => void;
  goToStep: (step: SolicitudStep) => void;
  reset: () => void;
}

const initialState = {
  step: "credentials" as SolicitudStep,
  dni: "",
  email: "",
  otpToken: null,
  solicitudCodigo: null,
  solicitudId: null,
  urlPago: null,
};

export const useSolicitudStore = create<SolicitudState>((set) => ({
  ...initialState,

  setCredentials: (dni, email) => set({ dni, email }),

  setOtpToken: (token) => set({ otpToken: token, step: "form" }),

  setSolicitudResult: (id, codigo, urlPago) =>
    set({ solicitudId: id, solicitudCodigo: codigo, urlPago, step: "payment" }),

  goToStep: (step) => set({ step }),

  reset: () => set(initialState),
}));
