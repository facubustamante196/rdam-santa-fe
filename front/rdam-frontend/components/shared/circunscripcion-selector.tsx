"use client";

import { cn } from "@/lib/utils";
import { CIRCUNSCRIPCIONES } from "@/lib/schemas";
import { MapPin } from "lucide-react";

interface CircunscripcionSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function CircunscripcionSelector({
  value,
  onChange,
  error,
  disabled,
}: CircunscripcionSelectorProps) {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {CIRCUNSCRIPCIONES.map((circ) => {
          const isSelected = value === circ.id;
          return (
            <button
              key={circ.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(circ.id)}
              className={cn(
                "relative flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all",
                "hover:border-navy/60 hover:bg-secondary/60",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                isSelected
                  ? "border-navy bg-navy/5 shadow-sm"
                  : "border-border bg-white"
              )}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
                style={{ backgroundColor: circ.color }}
              >
                {circ.id}°
              </div>
              <div className="min-w-0">
                <p className={cn("text-sm font-medium", isSelected && "text-navy")}>
                  {circ.label}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {circ.ciudad}
                </p>
              </div>
              {isSelected && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-navy flex items-center justify-center">
                  <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1 animate-fade-in">
          <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
          {error}
        </p>
      )}
    </div>
  );
}
