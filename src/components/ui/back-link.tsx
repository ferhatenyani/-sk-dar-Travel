import Link from "next/link";

import { IconChevronDown } from "./icons";

/** Lien « retour » vers la page parente (haut des pages détail / création). */
export function BackLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-ink-muted transition-colors hover:text-ink"
      aria-label={`Retour à ${label}`}
    >
      <IconChevronDown className="size-4 rotate-90" />
      {label}
    </Link>
  );
}
