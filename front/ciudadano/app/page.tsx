import Link from "next/link";

const actions = [
  {
    title: "Solicitar certificado",
    description:
      "Inicia una nueva solicitud. Vas a validar tu identidad con OTP y luego continuar al pago.",
    href: "/solicitar",
  },
  {
    title: "Consultar estado",
    description:
      "Consulta el estado de tu solicitud con codigo o DNI y email.",
    href: "/consultar",
  },
  {
    title: "Historial",
    description:
      "Accede a tus solicitudes anteriores y descarga certificados vigentes.",
    href: "/historial",
  },
];

export default function Page() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="max-w-2xl space-y-4">
          <p className="text-xs font-semibold uppercase text-accent">
            Registro de Deudores Alimentarios Morosos
          </p>
          <h1 className="text-3xl font-bold text-slate-900">
            Portal ciudadano RDAM
          </h1>
          <p className="text-sm text-slate-600">
            Solicita certificados, consulta el estado de tu tramite y descarga
            documentos vigentes sin necesidad de acudir presencialmente.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/solicitar"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              Iniciar solicitud
            </Link>
            <Link
              href="/consultar"
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Consultar estado
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-primary"
          >
            <h3 className="text-base font-semibold text-slate-900">
              {action.title}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {action.description}
            </p>
            <span className="mt-4 inline-flex text-xs font-semibold text-primary">
              Ir a la vista
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
