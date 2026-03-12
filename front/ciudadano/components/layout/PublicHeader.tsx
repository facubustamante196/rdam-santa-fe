import Link from "next/link";

const links = [
  { href: "/solicitar", label: "Solicitar certificado" },
  { href: "/consultar", label: "Consultar estado" },
  { href: "/historial", label: "Historial" },
];

export function PublicHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 text-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
            RD
          </div>
          <div>
            <p className="text-sm font-semibold uppercase">RDAM</p>
            <p className="text-xs text-slate-500">Poder Judicial Santa Fe</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
