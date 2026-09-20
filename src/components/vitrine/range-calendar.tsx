"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plane } from "lucide-react";

import { cn } from "@/lib/cn";

export type DateRange = { from: string; to: string | null };

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

const MONTH_LABEL = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});
const DAY_LABEL = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const SHORT_DAY = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

/** Date ISO locale (AAAA-MM-JJ), sans décalage UTC. */
function toIso(d: Date): string {
  const offsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}

function todayIso(): string {
  return toIso(new Date());
}

/** Mois affichable le plus lointain (36 mois de planification). */
const MAX_MONTHS_AHEAD = 36;

function monthIndex(y: number, m: number): number {
  return y * 12 + m;
}

/**
 * Calendrier plage 100 % maison (aucun input[type=date], aucun popup
 * navigateur) : 1er clic = départ, 2e clic = retour (plage surlignée,
 * jours avant le départ désactivés), bouton Effacer. Passé désactivé.
 * Le libellé compact « 12 avr. → 24 avr. 2026 » est rendu en monospace.
 */
export function RangeCalendar({
  idPrefix,
  value,
  onChange,
  invalid = false,
  className,
}: {
  idPrefix: string;
  value: DateRange | null;
  onChange: (value: DateRange | null) => void;
  invalid?: boolean;
  className?: string;
}) {
  const popoverId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });

  const from = value?.from ?? null;
  const to = value?.to ?? null;

  // Ouverture : mois courant, ou mois du départ déjà choisi (posé ici, pas
  // dans un effet, pour éviter un rendu en cascade).
  function toggleOpen() {
    if (open) {
      setOpen(false);
      return;
    }
    const base = from ? new Date(`${from}T12:00:00`) : new Date();
    setView({ y: base.getFullYear(), m: base.getMonth() });
    setOpen(true);
  }

  // Clic extérieur → fermeture ; Échap → fermeture + retour du focus.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function pick(iso: string) {
    // 1er clic (ou nouvelle sélection) : départ. 2e clic : retour + fermeture.
    if (!from || (from && to)) {
      onChange({ from: iso, to: null });
      return;
    }
    if (iso > from) {
      onChange({ from, to: iso });
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  function shiftMonth(delta: number) {
    setView((v) => {
      const next = monthIndex(v.y, v.m) + delta;
      return { y: Math.floor(next / 12), m: ((next % 12) + 12) % 12 };
    });
  }

  const current = monthIndex(now.getFullYear(), now.getMonth());
  const viewIndex = monthIndex(view.y, view.m);
  const minIndex = current;
  const maxIndex = current + MAX_MONTHS_AHEAD;

  // Grille du mois : cases vides jusqu'au lundi de la 1re semaine.
  const firstWeekday = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => toIso(new Date(view.y, view.m, i + 1)),
    ),
  ];

  const today = todayIso();
  const selecting = Boolean(from && !to);

  const display = (() => {
    if (!from) return null;
    const fmtFrom = SHORT_DAY.format(new Date(`${from}T12:00:00`));
    if (!to) return `${fmtFrom} → …`;
    const fmtTo = SHORT_DAY.format(new Date(`${to}T12:00:00`));
    const sameYear = from.slice(0, 4) === to.slice(0, 4);
    return sameYear
      ? `${fmtFrom} → ${fmtTo} ${to.slice(0, 4)}`
      : `${fmtFrom} ${from.slice(0, 4)} → ${fmtTo} ${to.slice(0, 4)}`;
  })();

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {/* Champ unique « Dates » : la ligne d'itinéraire Départ ✈ Retour */}
      <button
        ref={triggerRef}
        id={idPrefix}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        aria-label={
          display
            ? `Dates du voyage : ${display} — modifier`
            : "Choisir les dates du voyage"
        }
        onClick={toggleOpen}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-left transition-colors",
          "hover:border-ice-strong focus:outline-none focus:border-cobalt",
          invalid ? "border-danger" : "border-ice",
        )}
      >
        <CalendarDays aria-hidden className="h-5 w-5 shrink-0 text-cobalt" />
        <span className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2">
          <span className="min-w-0">
            <span className="block font-mono text-[10px] font-bold tracking-[0.14em] text-night-faint uppercase">
              Départ
            </span>
            <span
              className={cn(
                "block truncate font-mono text-[15px] font-semibold",
                from ? "text-night" : "text-night-faint",
              )}
            >
              {from ? SHORT_DAY.format(new Date(`${from}T12:00:00`)) : "—"}
            </span>
          </span>
          <span
            aria-hidden
            className="flex shrink-0 items-center"
          >
            {/* Ligne d'itinéraire : Départ --- ✈ --- Retour */}
            <span className="h-0 w-4 border-t border-dashed border-ice-strong sm:w-6" />
            <span className="grid h-9 w-9 place-items-center rounded-full bg-night text-citrine">
              {/* Avion lucide orienté vers la droite */}
              <Plane className="h-4 w-4 rotate-90" />
            </span>
            <span className="h-0 w-4 border-t border-dashed border-ice-strong sm:w-6" />
          </span>
          <span className="min-w-0 text-right">
            <span className="block font-mono text-[10px] font-bold tracking-[0.14em] text-night-faint uppercase">
              Retour
            </span>
            <span
              className={cn(
                "block truncate font-mono text-[15px] font-semibold",
                to ? "text-night" : "text-night-faint",
              )}
            >
              {to ? SHORT_DAY.format(new Date(`${to}T12:00:00`)) : "—"}
            </span>
          </span>
        </span>
      </button>

      {open ? (
        <div
          id={popoverId}
          role="dialog"
          aria-label="Choisir les dates du voyage"
          className="absolute inset-x-0 top-full z-30 mt-2 rounded-2xl border border-ice bg-white p-4 shadow-[0_24px_48px_-16px_rgba(15,23,42,0.3)]"
        >
          {/* Navigation de mois */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Mois précédent"
              disabled={viewIndex <= minIndex}
              onClick={() => shiftMonth(-1)}
              className="grid h-9 w-9 place-items-center rounded-full border border-ice text-night transition-colors hover:bg-ice/60 disabled:opacity-35"
            >
              <ChevronLeft aria-hidden className="h-4 w-4" />
            </button>
            <p
              aria-live="polite"
              className="font-mono text-sm font-bold text-night capitalize"
            >
              {MONTH_LABEL.format(new Date(view.y, view.m, 1))}
            </p>
            <button
              type="button"
              aria-label="Mois suivant"
              disabled={viewIndex >= maxIndex}
              onClick={() => shiftMonth(1)}
              className="grid h-9 w-9 place-items-center rounded-full border border-ice text-night transition-colors hover:bg-ice/60 disabled:opacity-35"
            >
              <ChevronRight aria-hidden className="h-4 w-4" />
            </button>
          </div>

          {/* Grille : semaines commençant le lundi */}
          <div className="mt-3 grid grid-cols-7 gap-y-0.5 text-center">
            {WEEKDAYS.map((d, i) => (
              <span
                key={`${d}-${i}`}
                aria-hidden
                className="pb-1 font-mono text-[11px] font-bold text-night-faint"
              >
                {d}
              </span>
            ))}
            {cells.map((iso, i) => {
              if (!iso) return <span key={`empty-${i}`} />;
              const day = Number(iso.slice(8, 10));
              const isPast = iso < today;
              const isFrom = iso === from;
              const isTo = iso !== null && iso === to;
              const inRange =
                from && to ? iso > from && iso < to : false;
              // Sélection du retour : tout jour ≤ départ est désactivé.
              const disabled =
                isPast || (from !== null && selecting ? iso <= from : false);
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  aria-pressed={isFrom || isTo}
                  aria-label={`${DAY_LABEL.format(new Date(`${iso}T12:00:00`))}${
                    isFrom ? " (départ)" : isTo ? " (retour)" : ""
                  }`}
                  onClick={() => pick(iso)}
                  className={cn(
                    "mx-auto grid h-9 w-9 place-items-center rounded-full font-mono text-base font-semibold tabular-nums transition-colors",
                    disabled && "cursor-not-allowed text-night-faint/40",
                    !disabled && !isFrom && !isTo && !inRange &&
                      "text-night hover:bg-ice/70",
                    inRange && "rounded-none bg-cobalt-soft text-cobalt",
                    (isFrom || isTo) &&
                      "bg-cobalt text-white shadow-[0_6px_14px_-6px_rgba(37,99,235,0.9)]",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-ice pt-3">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                triggerRef.current?.focus();
              }}
              disabled={!from}
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-night-muted transition-colors hover:bg-ice/60 hover:text-night disabled:pointer-events-none disabled:opacity-40"
            >
              Effacer
            </button>
            <p aria-live="polite" className="font-mono text-[11px] text-night-muted">
              {selecting && from
                ? `Départ ${SHORT_DAY.format(new Date(`${from}T12:00:00`))} — choisissez le retour`
                : "1er clic : départ · 2e : retour"}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
