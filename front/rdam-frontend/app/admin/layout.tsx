"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Scale, LayoutDashboard, FileText, Users, Shield,
  AlertTriangle, LogOut, Bell, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "sonner";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["OPERARIO", "SUPERVISOR"] },
  { href: "/admin/solicitudes", label: "Solicitudes", icon: FileText, roles: ["OPERARIO", "SUPERVISOR"] },
  { href: "/admin/alertas", label: "Alertas SLA", icon: AlertTriangle, roles: ["SUPERVISOR"] },
  { href: "/admin/usuarios", label: "Operarios", icon: Users, roles: ["SUPERVISOR"] },
  { href: "/admin/auditoria", label: "Auditoría", icon: Shield, roles: ["SUPERVISOR"] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { adminUser, adminRole, clearAdmin } = useAuthStore();

  const handleLogout = () => {
    clearAdmin();
    toast.success("Sesión cerrada.");
    router.push("/admin/login");
  };

  const visibleNav = NAV_ITEMS.filter(
    (item) => adminRole && item.roles.includes(adminRole)
  );

  return (
    <div className="flex min-h-screen bg-[#F8F7F4]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col bg-navy border-r border-white/5">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/20">
            <Scale className="h-4 w-4 text-gold" />
          </div>
          <div>
            <span className="font-display font-semibold text-white text-sm leading-tight block">RDAM</span>
            <span className="text-[9px] text-white/40 uppercase tracking-widest leading-tight block">
              Panel interno
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {visibleNav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all group",
                  active
                    ? "bg-gold/15 text-gold"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="h-3 w-3 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 mb-1">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
              {adminUser?.nombre?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">{adminUser?.nombre}</p>
              <p className="text-[10px] text-white/40">{adminRole}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between border-b border-border bg-white/80 backdrop-blur-sm px-6">
          <h1 className="font-display font-semibold text-navy text-base capitalize">
            {visibleNav.find((n) => pathname.startsWith(n.href))?.label ?? "Panel"}
          </h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative rounded-full p-2 hover:bg-secondary transition-colors"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-gold" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
