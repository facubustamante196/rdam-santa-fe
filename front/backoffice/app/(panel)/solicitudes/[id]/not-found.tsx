import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
      <p>No encontramos la solicitud solicitada.</p>
      <Link className="mt-3 inline-flex text-primary hover:underline" href="/solicitudes">
        Volver a solicitudes
      </Link>
    </div>
  );
}
