"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { cn } from "@/lib/cn";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

const MONTH_LABEL = new Intl.DateTimeFormat("fr-FR", { month: "long" });
const DAY_LABEL = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Date ISO locale (AAAA-MM-JJ), sans décalage UTC. */
function toIso(d: Date): string {
  const offsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}

/** Affichage demandé : jour/mois/année (jj/mm/aaaa). */
function formatIso(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

function monthIndex(y: number, m: number): number {
  return y * 12 + m;
}

/** Décalage maximal de navigation par rapport au mois courant (±15 ans). */
const MONTH_SPAN = 15 * 12;

/**
 * Sélecteur de date 100 % maison pour l'admin (aucun input[type=date], aucun
 * popup navigateur) : déclencheur affichant jj/mm/aaaa, popover calendrier
 * (navigation mois + année, semaines le lundi, jour sélectionné navy,
 * aujourd'hui cerclé). Un input hidden porte la valeur ISO pour les Server
 * Actions via FormData.
 */
export function DatePicker({
  name,
  value,
  onChange,
  ariaLabel,
  placeholder = "jj/mm/aaaa",
  invalid = false,
  className,
  id,
}: {
  /** FormData : input hidden portant la valeur ISO. */
  name?: string;
  /** Valeur ISO (AAAA-MM-JJ) ou chaîne vide. */
  value: string;
  onChange: (iso: string) => void;
  ariaLabel: string;
  placeholder?: string;
  invalid?: boolean;
  className?: string;
  /** id du déclencheur (focus programmatique en cas d'erreur). */
  id?: string;
}) {
  const popoverId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });

  function toggleOpen() {
    if (open) {
      setOpen(false);
      return;
    }
    const base = value ? new Date(`${value}T12:00:00`) : new Date();
    setView({ y: base.getFullYear(), m: base.getMonth() });
    setOpen(true);
  }

  function select(iso: string) {
    onChange(iso);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function clear() {
    onChange("");
    triggerRef.current?.focus();
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

  function shiftMonth(delta: number) {
    setView((v) => {
      const next = monthIndex(v.y, v.m) + delta;
      return { y: Math.floor(next / 12), m: ((next % 12) + 12) % 12 };
    });
  }

  const currentIndex = monthIndex(now.getFullYear(), now.getMonth());
  const viewIndex = monthIndex(view.y, view.m);
  const minIndex = currentIndex - MONTH_SPAN;
  const maxIndex = currentIndex + MONTH_SPAN;

  // Grille du mois : cases vides jusqu'au lundi de la 1re semaine.
  const firstWeekday = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toIso(new Date(view.y, view.m, i + 1))),
  ];
  const today = toIso(new Date());

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        onClick={toggleOpen}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-surface px-3 text-base transition-colors duration-100",
          "hover:border-line-strong focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/25",
          invalid ? "border-danger" : "border-line",
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate text-left", !value && "text-ink-faint")}>
          {value ? formatIso(value) : placeholder}
        </span>
        <CalendarDays
          aria-hidden
          className="h-4 w-4 shrink-0 text-ink-faint"
        />
      </button>

      {open ? (
        <div
          id={popoverId}
          role="dialog"
          aria-label={`${ariaLabel} — choisir une date`}
          className="absolute inset-x-0 top-full z-30 mt-1.5 rounded-lg border border-line bg-surface p-3 shadow-[0_12px_32px_-12px_rgba(23,23,23,0.25)]"
        >
          {/* Navigation : année (double chevron) puis mois */}
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              aria-label="Année précédente"
              disabled={viewIndex - 12 < minIndex}
              onClick={() => shiftMonth(-12)}
              className="grid h-8 w-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-page hover:text-ink disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Mois précédent"
              disabled={viewIndex <= minIndex}
              onClick={() => shiftMonth(-1)}
              className="grid h-8 w-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-page hover:text-ink disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p
              aria-live="polite"
              className="min-w-0 flex-1 text-center text-sm font-semibold capitalize text-ink"
            >
              {MONTH_LABEL.format(new Date(view.y, view.m, 1))} {view.y}
            </p>
            <button
              type="button"
              aria-label="Mois suivant"
              disabled={viewIndex >= maxIndex}
              onClick={() => shiftMonth(1)}
              className="grid h-8 w-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-page hover:text-ink disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Année suivante"
              disabled={viewIndex + 12 > maxIndex}
              onClick={() => shiftMonth(12)}
              className="grid h-8 w-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-page hover:text-ink disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>

          {/* Grille : semaines commençant le lundi */}
          <div className="mt-2.5 grid grid-cols-7 gap-y-0.5 text-center">
            {WEEKDAYS.map((d, i) => (
              <span
                key={`${d}-${i}`}
                aria-hidden
                className="pb-1 text-[11px] font-semibold text-ink-faint"
              >
                {d}
              </span>
            ))}
            {cells.map((iso, i) => {
              if (!iso) return <span key={`empty-${i}`} />;
              const day = Number(iso.slice(8, 10));
              const isSelected = iso === value;
              const isToday = iso === today;
              return (
                <button
                  key={iso}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={DAY_LABEL.format(new Date(`${iso}T12:00:00`))}
                  onClick={() => select(iso)}
                  className={cn(
                    "mx-auto grid h-8 w-8 place-items-center rounded-md text-sm font-medium tabular-nums transition-colors",
                    isSelected
                      ? "bg-navy font-semibold text-white"
                      : isToday
                        ? "border border-navy-border text-navy hover:bg-navy-soft"
                        : "text-ink hover:bg-navy-soft",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {value ? (
            <div className="mt-2 border-t border-line pt-2">
              <button
                type="button"
                onClick={clear}
                className="w-full rounded-md px-3 py-1.5 text-sm font-medium text-ink-secondary transition-colors hover:bg-page hover:text-ink"
              >
                Effacer
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Petite étiquette au-dessus d'un DatePicker (départ / retour). */
export function PickerLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1 block text-[11px] font-medium tracking-wide text-ink-muted uppercase">
      {children}
    </span>
  );
}
