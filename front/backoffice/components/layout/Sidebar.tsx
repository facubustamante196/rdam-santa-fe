"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

const baseLink =
  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors";

export function Sidebar() {
  const pathname = usePathname();
  const { data } = useSession();
  const { can, role } = usePermissions();

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      visible: can("view:dashboard"),
    },
    {
      label: "Solicitudes",
      href: "/solicitudes",
      visible: true,
    },
    {
      label: "Equipo",
      href: "/equipo",
      visible: can("view:equipo"),
    },
  ];

  return (
    <aside className="flex w-72 flex-col border-r border-slate-200 bg-white px-4 py-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="text-2xl">⚖️</div>
        <div>
          <p className="text-lg font-bold text-primary">RDAM</p>
          <p className="text-xs text-slate-500">Poder Judicial Santa Fe</p>
        </div>
      </div>

      <div className="mb-4 text-xs font-semibold tracking-widest text-slate-400">
        GESTION
      </div>
      <nav className="mb-6 space-y-1">
        {links
          .filter((link) => link.visible)
          .map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  baseLink,
                  isActive
                    ? "bg-primary-light text-white"
                    : "text-slate-700 hover:bg-primary-light hover:text-white",
                )}
              >
                {link.label}
              </Link>
            );
          })}
      </nav>

      <div className="mb-2 text-xs font-semibold tracking-widest text-slate-400">
        ADMINISTRACION
      </div>
      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Acceso restringido segun permisos operativos.
      </div>

      <div className="mt-auto flex items-center gap-3 border-t border-slate-200 pt-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
          {data?.user?.name?.slice(0, 2)?.toUpperCase() ?? "RD"}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {data?.user?.name ?? "Usuario RDAM"}
          </p>
          <p className="text-xs text-slate-500">{role}</p>
        </div>
      </div>
    </aside>
  );
}
