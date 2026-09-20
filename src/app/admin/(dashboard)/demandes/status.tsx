import type { TripStatus } from "@/db/schema";

/** Libellés + styles des pastilles de statut (liste et détail admin). */
export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  nouvelle: "Nouvelle",
  en_cours: "En cours",
  traitee: "Traitée",
  archivee: "Archivée",
};

export const TRIP_STATUS_BADGE_CLASS: Record<TripStatus, string> = {
  nouvelle: "bg-danger-soft text-danger border-danger-border",
  en_cours: "bg-warning-soft text-warning border-warning-border",
  traitee: "bg-success-soft text-success border-success-border",
  archivee: "bg-page text-ink-muted border-line",
};

export function StatusBadge({ status }: { status: TripStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${TRIP_STATUS_BADGE_CLASS[status]}`}
    >
      {TRIP_STATUS_LABELS[status]}
    </span>
  );
}

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** AAAA-MM-JJ (base de données) → « 12 avr. 2026 ». */
export function formatDate(iso: string): string {
  return dateFmt.format(new Date(`${iso}T12:00:00`));
}

/** Horodatage → « 12 avr., 14:05 ». */
export function formatDateTime(date: Date): string {
  return dateTimeFmt.format(date);
}
