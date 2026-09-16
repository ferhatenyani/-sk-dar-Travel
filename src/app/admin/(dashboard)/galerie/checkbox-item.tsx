"use client";

import { IconCheck } from "@/components/ui/icons";

/**
 * Case à cocher stylée (aucune apparence native) pour les listes
 * d'assignation section ↔ carte. L'input caché porte la valeur au FormData.
 */
export function CheckboxItem({
  name,
  value,
  label,
  hint,
}: {
  name: string;
  value: number;
  label: string;
  hint?: string;
}) {
  return (
    <label
      className="flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2 transition-colors hover:border-line-strong has-checked:border-navy has-checked:bg-navy-soft/40"
    >
      <input type="checkbox" name={name} value={value} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-md border border-line-strong bg-surface text-transparent transition-colors peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-navy"
      >
        <IconCheck className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{label}</span>
        {hint && <span className="block truncate text-xs text-ink-muted">{hint}</span>}
      </span>
    </label>
  );
}
