import { create } from "zustand";

type OtpSessionState = {
  token: string | null;
  setToken: (token: string) => void;
  clear: () => void;
};

const readToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("rdam_otp_token");
};

export const useOtpSession = create<OtpSessionState>((set) => ({
  token: readToken(),
  setToken: (token) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("rdam_otp_token", token);
    }
    set({ token });
  },
  clear: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("rdam_otp_token");
    }
    set({ token: null });
  },
}));
