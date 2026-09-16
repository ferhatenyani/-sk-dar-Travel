"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteService } from "@/lib/actions/services";
import { ConfirmButton } from "@/components/ui/dialog";
import { IconArrowDown, IconArrowUp, IconPencil, IconTrash } from "@/components/ui/icons";

/** Flèches de réordonnancement (haut/bas) branchées sur l'action move*. */
export function MoveButtons({
  id,
  onMove,
  isFirst,
  isLast,
}: {
  id: number;
  onMove: (id: number, direction: "up" | "down") => Promise<{ ok: boolean } | { ok: false; error: string }>;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      await onMove(id, direction);
      router.refresh();
    });
  }

  return (
    <div className="inline-flex flex-col sm:flex-row">
      <button
        type="button"
        aria-label="Monter"
        disabled={isFirst || pending}
        onClick={() => move("up")}
        className="inline-flex size-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-page hover:text-ink disabled:pointer-events-none disabled:opacity-30"
      >
        <IconArrowUp className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Descendre"
        disabled={isLast || pending}
        onClick={() => move("down")}
        className="inline-flex size-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-page hover:text-ink disabled:pointer-events-none disabled:opacity-30"
      >
        <IconArrowDown className="size-4" />
      </button>
    </div>
  );
}

/** Bouton suppression avec modale de confirmation. */
export function DeleteServiceButton({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <ConfirmButton
      confirmTitle="Supprimer ce service ?"
      confirmMessage={
        <>
          « <span className="font-medium text-ink">{title}</span> » sera définitivement
          supprimé. Cette action est irréversible.
        </>
      }
      onConfirm={() =>
        startTransition(async () => {
          await deleteService(id);
          router.refresh();
        })
      }
    >
      <IconTrash className="size-4" />
      <span className="sr-only">Supprimer {title}</span>
    </ConfirmButton>
  );
}

/** Bouton d'édition (lien stylé cohérent avec les autres actions de ligne). */
export function EditLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      aria-label={`Modifier ${label}`}
      className="inline-flex size-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-page hover:text-ink"
    >
      <IconPencil className="size-4" />
    </a>
  );
}
