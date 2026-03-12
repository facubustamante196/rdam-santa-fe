import NextAuth from "next-auth";
import { Role } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: Role;
      rol?: Role;
      username?: string;
      circunscripcion?: string;
    };
    accessToken?: string;
  }

  interface User {
    role?: Role;
    rol?: Role;
    username?: string;
    circunscripcion?: string;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    rol?: Role;
    username?: string;
    circunscripcion?: string;
    accessToken?: string;
  }
}
