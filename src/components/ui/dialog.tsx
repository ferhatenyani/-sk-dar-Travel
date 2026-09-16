"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { IconX } from "@/components/ui/icons";

/** Modale accessible : overlay, ESC pour fermer. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-xl"
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-mr-1 -mt-1 inline-flex size-8 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-page hover:text-ink"
          >
            <IconX className="size-4" />
          </button>
        </div>
        <div className="text-sm text-ink-secondary">{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/** Bouton qui demande confirmation via une modale avant d'exécuter l'action. */
export function ConfirmButton({
  confirmTitle,
  confirmMessage,
  confirmLabel = "Supprimer",
  onConfirm,
  children,
  variant = "secondary",
  size = "sm",
}: {
  confirmTitle: string;
  confirmMessage: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gold";
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function confirm() {
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
      setOpen(false);
    }
  }

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={confirmTitle}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Annuler
            </Button>
            <Button variant="danger" onClick={confirm} loading={pending}>
              {pending ? confirmLabel + "…" : confirmLabel}
            </Button>
          </>
        }
      >
        {confirmMessage}
      </Dialog>
    </>
  );
}
