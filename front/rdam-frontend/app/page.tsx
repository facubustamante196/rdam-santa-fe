import Link from "next/link";
import { Scale, ShieldCheck, Clock, FileText, ChevronRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Header */}
      <header className="border-b border-border/60 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy">
              <Scale className="h-5 w-5 text-gold" />
            </div>
            <div>
              <span className="font-display font-semibold text-navy text-sm leading-tight block">RDAM</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-tight block">
                Santa Fe
              </span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#que-es" className="hover:text-foreground transition-colors">¿Qué es el RDAM?</Link>
            <Link href="#como-funciona" className="hover:text-foreground transition-colors">Cómo funciona</Link>
            <Link href="/solicitar/consulta" className="hover:text-foreground transition-colors">Consultar estado</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/admin/login">
              <Button variant="outline" size="sm">
                Panel de administración
              </Button>
            </Link>
            <Link href="/solicitar">
              <Button variant="gold" size="sm">
                Solicitar certificado
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-36">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-navy/5 blur-3xl" />
        </div>

        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-medium text-gold-dark mb-8 animate-fade-in">
              <Building2 className="h-3.5 w-3.5" />
              Poder Judicial de la Provincia de Santa Fe
            </div>

            <h1
              className="font-display text-4xl md:text-6xl font-bold text-navy leading-tight tracking-tight mb-6 animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              Registro de Deudores{" "}
              <span className="italic text-gold">Alimentarios</span>{" "}
              Morosos
            </h1>

            <p
              className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto mb-10 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              Solicitá tu certificado de libre deuda alimentaria de manera
              digital, segura y sin necesidad de concurrir a tribunales.
            </p>

            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <Link href="/solicitar">
                <Button variant="gold" size="xl" className="group min-w-48">
                  Solicitar certificado
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/solicitar/consulta">
                <Button variant="outline" size="xl" className="min-w-48">
                  Consultar estado
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="que-es" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-semibold text-navy mb-3">
              ¿Por qué necesitás el certificado?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              El certificado RDAM es requerido en diversas gestiones
              administrativas y contractuales en la provincia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: ShieldCheck,
                title: "100% Digital",
                desc: "Trámite completamente en línea. Sin colas, sin papel, sin traslados.",
              },
              {
                icon: Clock,
                title: "Respuesta rápida",
                desc: "El certificado se emite dentro de las 48 horas hábiles de aprobado el pago.",
              },
              {
                icon: FileText,
                title: "Validez oficial",
                desc: "Documento emitido por el Poder Judicial de la Provincia de Santa Fe con firma digital.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border p-6 hover:border-gold/50 hover:shadow-sm transition-all"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-navy/5">
                  <f.icon className="h-5 w-5 text-navy" />
                </div>
                <h3 className="font-display font-semibold text-navy mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section id="como-funciona" className="py-20 bg-[#F8F7F4]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-semibold text-navy mb-3">
              Cómo funciona
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Cuatro pasos simples para obtener tu certificado.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {[
              { n: "01", title: "Ingresá tu DNI y email", desc: "Verificamos tu identidad mediante un código OTP enviado a tu correo." },
              { n: "02", title: "Completá el formulario", desc: "Ingresá tus datos personales y seleccioná la circunscripción correspondiente." },
              { n: "03", title: "Abonás el arancel", desc: "Realizás el pago del trámite mediante la pasarela de pagos segura." },
              { n: "04", title: "Descargás el certificado", desc: "Una vez emitido, recibirás el PDF por email y podrás descargarlo desde el portal." },
            ].map((step, i) => (
              <div key={step.n} className="flex gap-6 mb-8 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-gold font-display font-bold text-sm">
                    {step.n}
                  </div>
                  {i < 3 && <div className="mt-2 w-px flex-1 bg-border min-h-8" />}
                </div>
                <div className="pb-8">
                  <h3 className="font-semibold text-navy mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/solicitar">
              <Button variant="gold" size="lg" className="group">
                Iniciar trámite
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-navy">
              <Scale className="h-4 w-4 text-gold" />
            </div>
            <span className="font-display font-semibold text-navy text-sm">RDAM — Santa Fe</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Poder Judicial de la Provincia de Santa Fe — Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
