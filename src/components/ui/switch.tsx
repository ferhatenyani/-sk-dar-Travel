"use client";

import { cn } from "@/lib/cn";

/**
 * Interrupteur stylé (aucune apparence native). Utilisé dans un formulaire :
 * le <input type="checkbox"> caché (sr-only) porte la valeur côté serveur.
 */
export function Switch({
  name,
  defaultChecked = false,
  label,
  hint,
}: {
  name: string;
  defaultChecked?: boolean;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-ink-muted">{hint}</span>}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-line-strong bg-line/60 transition-colors",
          "peer-checked:border-navy peer-checked:bg-navy",
          "peer-checked:[&>span]:translate-x-5",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-navy",
        )}
      >
        <span className="ml-0.5 inline-block size-[18px] translate-x-0 rounded-full bg-white shadow transition-transform" />
      </span>
    </label>
  );
}
