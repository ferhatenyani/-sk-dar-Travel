"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteVoyage } from "@/lib/actions/voyages";
import { ConfirmButton } from "@/components/ui/dialog";
import { IconTrash } from "@/components/ui/icons";

/** Bouton suppression avec modale de confirmation. */
export function DeleteVoyageButton({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <ConfirmButton
      confirmTitle="Supprimer ce voyage ?"
      confirmMessage={
        <>
          « <span className="font-medium text-ink">{title}</span> » sera définitivement
          supprimé. Cette action est irréversible.
        </>
      }
      onConfirm={() =>
        startTransition(async () => {
          await deleteVoyage(id);
          router.refresh();
        })
      }
    >
      <IconTrash className="size-4" />
      <span className="sr-only">Supprimer {title}</span>
    </ConfirmButton>
  );
}
