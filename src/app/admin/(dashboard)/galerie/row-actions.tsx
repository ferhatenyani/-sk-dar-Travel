"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteCard, deleteSection } from "@/lib/actions/gallery";
import type { ActionResult } from "@/lib/form-state";
import { ConfirmButton } from "@/components/ui/dialog";
import { IconArrowDown, IconArrowUp, IconPencil, IconTrash } from "@/components/ui/icons";

type MoveFn = (
  id: number,
  direction: "up" | "down",
) => Promise<ActionResult>;

/** Flèches de réordonnancement (haut/bas) branchées sur une action move*. */
export function MoveButtons({
  id,
  onMove,
  isFirst,
  isLast,
  label = "l'élément",
}: {
  id: number;
  onMove: MoveFn;
  isFirst: boolean;
  isLast: boolean;
  label?: string;
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
        aria-label={`Monter ${label}`}
        disabled={isFirst || pending}
        onClick={() => move("up")}
        className="inline-flex size-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-page hover:text-ink disabled:pointer-events-none disabled:opacity-30"
      >
        <IconArrowUp className="size-4" />
      </button>
      <button
        type="button"
        aria-label={`Descendre ${label}`}
        disabled={isLast || pending}
        onClick={() => move("down")}
        className="inline-flex size-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-page hover:text-ink disabled:pointer-events-none disabled:opacity-30"
      >
        <IconArrowDown className="size-4" />
      </button>
    </div>
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

/**
 * Suppression d'une section : la section seule est supprimée, les cartes
 * (jointures comprises via cascade FK) restent intactes et réutilisables.
 */
export function DeleteSectionButton({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <ConfirmButton
      confirmTitle="Supprimer cette section ?"
      confirmMessage={
        <>
          La section « <span className="font-medium text-ink">{title}</span> » sera
          définitivement supprimée. Cette action est irréversible.
          <br />
          <br />
          Les cartes de cette section ne seront pas supprimées, elles resteront
          disponibles pour d&apos;autres sections.
        </>
      }
      onConfirm={() =>
        startTransition(async () => {
          await deleteSection(id);
          router.refresh();
        })
      }
    >
      <IconTrash className="size-4" />
      <span className="sr-only">Supprimer la section {title}</span>
    </ConfirmButton>
  );
}

/** Suppression d'une carte : retirée de toutes les sections via les cascades FK. */
export function DeleteCardButton({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <ConfirmButton
      confirmTitle="Supprimer cette carte ?"
      confirmMessage={
        <>
          La carte « <span className="font-medium text-ink">{title}</span> » sera
          définitivement supprimée. Cette action est irréversible.
          <br />
          <br />
          La carte sera retirée de toutes les sections où elle apparaît.
        </>
      }
      onConfirm={() =>
        startTransition(async () => {
          await deleteCard(id);
          router.refresh();
        })
      }
    >
      <IconTrash className="size-4" />
      <span className="sr-only">Supprimer la carte {title}</span>
    </ConfirmButton>
  );
}
