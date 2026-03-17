"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

interface FormFieldProps {
  label: string;
  error?: any;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

export function FormField({
  label,
  error,
  hint,
  required,
  children,
  className,
  htmlFor,
}: FormFieldProps) {
  const errorMessage = typeof error === "string" ? error : error?.message;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className={cn(errorMessage && "text-destructive")}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {errorMessage && (
        <p className="text-xs text-destructive flex items-center gap-1 animate-fade-in">
          <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
          {errorMessage}
        </p>
      )}
      {hint && !errorMessage && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
