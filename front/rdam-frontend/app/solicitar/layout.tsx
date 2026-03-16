import { Scale } from "lucide-react";
import Link from "next/link";

export default function SolicitarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col">
      <header className="border-b border-border/60 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy">
              <Scale className="h-4 w-4 text-gold" />
            </div>
            <span className="font-display font-semibold text-navy text-sm">RDAM</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center py-12 px-4">
        <div className="w-full max-w-lg">{children}</div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border">
        Poder Judicial de la Provincia de Santa Fe
      </footer>
    </div>
  );
}
