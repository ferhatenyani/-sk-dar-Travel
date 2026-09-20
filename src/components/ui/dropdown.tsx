"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/cn";

export type DropdownOption = {
  value: string;
  label: string;
  /** Icône optionnelle affichée devant le libellé (grilles d'options). */
  icon?: ReactNode;
};

/**
 * Dropdown 100 % maison — aucun `<select>` natif. Bouton déclencheur +
 * popover listbox (rôles ARIA listbox/option, navigation clavier ↑↓ Entrée
 * Échap, fermeture au clic extérieur). Un input hidden porte la valeur pour
 * les formulaires soumis en FormData (server actions).
 *
 * Deux habillages : « admin » (compact, navy) et « vitrine » (aéré, cobalt,
 * 16 px pour l'iOS-safe). Le même composant sert au statut des demandes et
 * au budget du formulaire « Composer mon voyage ».
 */
export function Dropdown({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = "Choisir…",
  ariaLabel,
  tone = "admin",
  invalid = false,
  className,
}: {
  id?: string;
  /** FormData : input hidden portant la valeur (formulaires en server action). */
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  ariaLabel: string;
  tone?: "admin" | "vitrine";
  invalid?: boolean;
  className?: string;
}) {
  const autoId = useId();
  const listboxId = `dd-${autoId}`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];
  const hasValue = Boolean(value);

  const optionId = (i: number) => `${listboxId}-${i}`;

  function openListbox() {
    setActive(selectedIndex);
    setOpen(true);
  }

  function commit(i: number) {
    onChange(options[i].value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  // À l'ouverture : focus de la listbox + positionnement sur l'option choisie.
  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const el = document.getElementById(optionId(active));
    el?.scrollIntoView({ block: "nearest" });
    // Clic extérieur → fermeture ; Échap → fermeture + retour du focus.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Déplacement actif : garde l'option visible dans le popover.
  useEffect(() => {
    if (!open) return;
    document
      .getElementById(optionId(active))
      ?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open]);

  function onTriggerKeyDown(e: ReactKeyboardEvent<HTMLButtonElement>) {
    if (open) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      openListbox();
    }
  }

  function onListKeyDown(e: ReactKeyboardEvent<HTMLUListElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => Math.min(options.length - 1, a + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(active);
        break;
      // Tab : fermeture sans capture du focus (le focus passe naturellement).
      case "Tab":
        setOpen(false);
        break;
    }
  }

  const triggerCls =
    tone === "admin"
      ? cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-surface px-3 text-base text-ink transition-colors duration-100",
          "hover:border-line-strong focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/25",
          invalid ? "border-danger" : "border-line",
        )
      : cn(
          "flex min-h-[3.25rem] w-full items-center justify-between gap-2 rounded-2xl border bg-white px-4 py-3 text-base text-night transition-colors",
          "hover:border-ice-strong focus:outline-none focus:border-cobalt",
          invalid ? "border-danger" : "border-ice",
        );

  const popoverCls =
    tone === "admin"
      ? "absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-[0_12px_32px_-12px_rgba(23,23,23,0.25)]"
      : "absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-ice bg-white py-1.5 shadow-[0_24px_48px_-16px_rgba(15,23,42,0.3)]";

  const optionCls = (isSelected: boolean, isActive: boolean) =>
    tone === "admin"
      ? cn(
          "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors",
          isActive ? "bg-navy-soft" : "hover:bg-page",
          isSelected ? "font-semibold text-navy" : "text-ink",
        )
      : cn(
          "flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-base transition-colors",
          isActive ? "bg-cobalt-soft" : "hover:bg-ice/50",
          isSelected ? "font-semibold text-cobalt" : "text-night-soft",
        );

  const checkCls = tone === "admin" ? "text-navy" : "text-cobalt";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => (open ? setOpen(false) : openListbox())}
        onKeyDown={onTriggerKeyDown}
        className={triggerCls}
      >
        <span className={cn("min-w-0 flex-1 truncate text-left", !hasValue && tone === "admin" && "text-ink-faint", !hasValue && tone === "vitrine" && "text-night-faint")}>
          {hasValue ? (
            <span className="inline-flex items-center gap-2">
              {selected?.icon}
              {selected?.label ?? value}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            tone === "admin" ? "text-ink-faint" : "text-night-faint",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel}
          aria-activedescendant={optionId(active)}
          onKeyDown={onListKeyDown}
          className={cn(popoverCls, "focus:outline-none")}
        >
          {options.map((option, i) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                id={optionId(i)}
                role="option"
                aria-selected={isSelected}
                className={optionCls(isSelected, i === active)}
                // Souris : survol = actif, clic = sélection.
                onPointerMove={() => setActive(i)}
                onClick={() => commit(i)}
              >
                {option.icon}
                <span className="min-w-0 flex-1">{option.label}</span>
                {isSelected ? <Check aria-hidden className={cn("h-4 w-4 shrink-0", checkCls)} strokeWidth={3} /> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
