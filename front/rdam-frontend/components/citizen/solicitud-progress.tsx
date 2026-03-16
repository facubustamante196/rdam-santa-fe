"use client";

import { cn } from "@/lib/utils";

type Step = "credentials" | "otp" | "form" | "payment" | "done";

const STEPS: { id: Step; label: string }[] = [
  { id: "credentials", label: "Verificación" },
  { id: "otp", label: "Código OTP" },
  { id: "form", label: "Datos" },
  { id: "payment", label: "Pago" },
  { id: "done", label: "Listo" },
];

const STEP_ORDER: Step[] = ["credentials", "otp", "form", "payment", "done"];

export function SolicitudProgress({ current }: { current: Step }) {
  const currentIdx = STEP_ORDER.indexOf(current);

  return (
    <div className="flex items-center justify-between">
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all",
                  done && "bg-navy text-white",
                  active && "bg-gold text-navy ring-4 ring-gold/20",
                  !done && !active && "bg-border text-muted-foreground"
                )}
              >
                {done ? (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 14 11" fill="none">
                    <path d="M1 5.5L5 9.5L13 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] whitespace-nowrap",
                  active ? "text-gold-dark font-semibold" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px mx-1 mb-5 transition-colors",
                  done ? "bg-navy" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
