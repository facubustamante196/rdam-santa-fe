"use client";

import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

interface RecaptchaMockProps {
  verified: boolean;
  onVerify: () => void;
}

export function RecaptchaMock({ verified, onVerify }: RecaptchaMockProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer select-none transition-all",
        verified
          ? "border-emerald-400 bg-emerald-50"
          : "border-border bg-secondary/50 hover:border-navy/40"
      )}
      onClick={() => !verified && onVerify()}
      role="checkbox"
      aria-checked={verified}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && !verified && onVerify()}
    >
      {/* Custom checkbox */}
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-all",
          verified
            ? "border-emerald-500 bg-emerald-500"
            : "border-muted-foreground bg-white"
        )}
      >
        {verified && (
          <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 14 11" fill="none">
            <path d="M1 5.5L5 9.5L13 1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      <span className={cn("text-sm font-medium flex-1", verified ? "text-emerald-700" : "text-foreground")}>
        {verified ? "Verificado correctamente" : "No soy un robot"}
      </span>

      {verified ? (
        <ShieldCheck className="h-5 w-5 text-emerald-500" />
      ) : (
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 flex items-center justify-center opacity-40">
            <svg viewBox="0 0 64 64" className="h-8 w-8">
              <path d="M32 4C16.5 4 4 16.5 4 32s12.5 28 28 28 28-12.5 28-28S47.5 4 32 4z" fill="#4A90D9" />
              <path d="M32 12c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20z" fill="#63A7E5" />
            </svg>
          </div>
          <span className="text-[8px] text-muted-foreground">reCAPTCHA</span>
        </div>
      )}
    </div>
  );
}
