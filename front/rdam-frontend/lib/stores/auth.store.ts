import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Usuario } from "@/lib/api";

type AuthRole = "OPERARIO" | "SUPERVISOR" | null;

interface AuthState {
  // Citizen
  citizenToken: string | null;
  citizenDni: string | null;
  citizenEmail: string | null;

  // Admin
  adminToken: string | null;
  adminUser: Usuario | null;
  adminRole: AuthRole;

  // Actions – Citizen
  setCitizenSession: (token: string) => void;
  setCitizenCredentials: (dni: string, email: string) => void;
  clearCitizen: () => void;

  // Actions – Admin
  setAdminSession: (token: string, user: Usuario) => void;
  clearAdmin: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      citizenToken: null,
      citizenDni: null,
      citizenEmail: null,
      adminToken: null,
      adminUser: null,
      adminRole: null,

      setCitizenSession: (token) => set({ citizenToken: token }),
      setCitizenCredentials: (dni, email) =>
        set({ citizenDni: dni, citizenEmail: email }),
      clearCitizen: () =>
        set({
          citizenToken: null,
          citizenDni: null,
          citizenEmail: null,
        }),

      setAdminSession: (token, user) =>
        set({
          adminToken: token,
          adminUser: user,
          adminRole: user.rol,
        }),
      clearAdmin: () =>
        set({ adminToken: null, adminUser: null, adminRole: null }),
    }),
    {
      name: "rdam-auth",
      // only persist admin session; citizen tokens are short-lived
      partialize: (state) => ({
        adminToken: state.adminToken,
        adminUser: state.adminUser,
        adminRole: state.adminRole,
      }),
    }
  )
);
