import type { InputHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const controlBase =
  // text-base (16 px) partout : iOS zoome au focus de tout contrôle < 16 px.
  "w-full rounded-lg border bg-surface text-ink text-base placeholder:text-ink-faint " +
  "transition-colors duration-100 " +
  "hover:border-line-strong " +
  "focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/25 " +
  "disabled:cursor-not-allowed disabled:bg-page disabled:text-ink-muted " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/25";

export function Input({
  className,
  invalid = false,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(controlBase, "h-10 px-3", className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  invalid = false,
  rows = 4,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      rows={rows}
      className={cn(controlBase, "px-3 py-2", className)}
      {...props}
    />
  );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-sm font-medium text-ink mb-1.5", className)}
      {...props}
    />
  );
}

/** Champ complet : label + contrôle + message d'aide/erreur. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
