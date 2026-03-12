import { create } from "zustand";

type OtpSessionState = {
  validated: boolean;
  setValidated: (value: boolean) => void;
  clear: () => void;
};

export const useOtpSession = create<OtpSessionState>((set) => ({
  validated: false,
  setValidated: (value) => set({ validated: value }),
  clear: () => set({ validated: false }),
}));
