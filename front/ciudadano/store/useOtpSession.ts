import { create } from "zustand";

type OtpSessionState = {
  dni: string | null;
  email: string | null;
  validated: boolean;
  setOtpData: (payload: { dni: string; email: string }) => void;
  setValidated: (value: boolean) => void;
  clear: () => void;
};

export const useOtpSession = create<OtpSessionState>((set) => ({
  dni: null,
  email: null,
  validated: false,
  setOtpData: (payload) =>
    set({
      dni: payload.dni,
      email: payload.email,
    }),
  setValidated: (value) => set({ validated: value }),
  clear: () => set({ validated: false, dni: null, email: null }),
}));
