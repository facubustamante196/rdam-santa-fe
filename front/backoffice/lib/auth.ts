import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { LoginResponseSchema } from "@/lib/schemas";
import type { Role } from "@/types";

const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contrasena", type: "password" },
        role: { label: "Rol", type: "text" },
      },
      authorize: async (credentials) => {
        const username = credentials?.username;
        const password = credentials?.password;
        const expectedRole = credentials?.role as Role | undefined;

        if (!username || !password) {
          return null;
        }

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          return null;
        }

        const json = await response.json();
        const parsed = LoginResponseSchema.parse(json);

        if (expectedRole && parsed.usuario.rol !== expectedRole) {
          return null;
        }

        return {
          id: parsed.usuario.id,
          name: parsed.usuario.nombreCompleto,
          username: parsed.usuario.username,
          role: parsed.usuario.rol,
          circunscripcion: parsed.usuario.circunscripcion,
          accessToken: parsed.access_token,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user?.role) {
        token.role = user.role;
      }
      if (user?.accessToken) {
        token.accessToken = user.accessToken;
      }
      if (user?.username) {
        token.username = user.username;
      }
      if (user?.circunscripcion) {
        token.circunscripcion = user.circunscripcion;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id;
        session.user.role = token.role as Role;
        session.user.username = token.username as string | undefined;
        session.user.circunscripcion = token.circunscripcion as string | undefined;
      }
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
  },
});
