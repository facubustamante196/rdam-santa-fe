"use client";

import { create } from "zustand";
import { Role } from "@/types";

type UiState = {
  selectedRole: Role;
  setSelectedRole: (role: Role) => void;
};

export const useUiStore = create<UiState>((set) => ({
  selectedRole: "OPERARIO",
  setSelectedRole: (role) => set({ selectedRole: role }),
}));
