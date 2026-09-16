"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  addCardToSection,
  moveSectionCard,
  removeCardFromSection,
} from "@/lib/actions/gallery";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/dialog";
import { IconArrowDown, IconArrowUp, IconPlus, IconX } from "@/components/ui/icons";

import { CheckboxItem } from "../checkbox-item";

export type PanelCard = {
  id: number;
  title: string;
  imageUrl: string;
};

/**
 * Panneau d'édition d'une section : gère les cartes liées (ordre DANS la
 * section, retrait) et l'ajout de cartes existantes. Une même carte peut
 * apparaître dans plusieurs sections.
 */
export function SectionCardsPanel({
  sectionId,
  sectionTitle,
  linkedCards,
  availableCards,
}: {
  sectionId: number;
  sectionTitle: string;
  linkedCards: PanelCard[];
  availableCards: PanelCard[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, startAdding] = useTransition();

  function move(cardId: number, direction: "up" | "down") {
    startTransition(async () => {
      await moveSectionCard(sectionId, cardId, direction);
      router.refresh();
    });
  }

  function remove(cardId: number) {
    startTransition(async () => {
      await removeCardFromSection(sectionId, cardId);
      router.refresh();
    });
  }

  function onAddSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const cardIds = formData
      .getAll("cardId")
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);
    if (cardIds.length === 0) return;

    startAdding(async () => {
      await Promise.all(cardIds.map((cardId) => addCardToSection(sectionId, cardId)));
      router.refresh();
    });
  }

  return (
    <section className="mt-6 rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
      <header className="mb-4">
        <h2 className="text-base font-semibold tracking-tight">
          Cartes de cette section
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          {linkedCards.length} carte{linkedCards.length > 1 ? "s" : ""} —
          l&apos;ordre ci-dessous ne concerne que la section «{" "}
          <span className="font-medium text-ink">{sectionTitle}</span> ».
        </p>
      </header>

      {linkedCards.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong bg-page px-4 py-6 text-center text-sm text-ink-muted">
          Aucune carte dans cette section pour le moment. Ajoutez-en depuis la
          liste des cartes disponibles ci-dessous.
        </p>
      ) : (
        <ul className="space-y-2">
          {linkedCards.map((card, index) => (
            <li
              key={card.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5 sm:gap-4 sm:p-3"
            >
              <div className="inline-flex flex-col sm:flex-row">
                <button
                  type="button"
                  aria-label={`Monter la carte ${card.title}`}
                  disabled={index === 0 || pending}
                  onClick={() => move(card.id, "up")}
                  className="inline-flex size-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-page hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                >
                  <IconArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Descendre la carte ${card.title}`}
                  disabled={index === linkedCards.length - 1 || pending}
                  onClick={() => move(card.id, "down")}
                  className="inline-flex size-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-page hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                >
                  <IconArrowDown className="size-4" />
                </button>
              </div>

              {card.imageUrl ? (
                <Image
                  src={card.imageUrl}
                  alt=""
                  width={64}
                  height={48}
                  className="h-12 w-16 shrink-0 rounded-lg border border-line object-cover"
                />
              ) : (
                <div className="h-12 w-16 shrink-0 rounded-lg border border-dashed border-line bg-page" />
              )}

              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                {card.title}
              </span>

              <ConfirmButton
                confirmTitle="Retirer cette carte ?"
                confirmMessage={
                  <>
                    La carte «{" "}
                    <span className="font-medium text-ink">{card.title}</span>{" "}
                    » sera retirée de cette section. Elle ne sera pas
                    supprimée et restera disponible pour les autres sections.
                  </>
                }
                confirmLabel="Retirer"
                onConfirm={() => remove(card.id)}
              >
                <IconX className="size-4" />
                <span className="sr-only">Retirer {card.title} de la section</span>
              </ConfirmButton>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 border-t border-line pt-5">
        <h3 className="text-sm font-semibold tracking-tight text-ink">
          Ajouter des cartes existantes
        </h3>
        {availableCards.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">
            Toutes les cartes sont déjà dans cette section. Créez-en de nouvelles
            depuis la page{" "}
            <Link
              href="/admin/galerie/cartes"
              className="font-medium text-navy underline underline-offset-2 hover:text-navy-hover"
            >
              Cartes photo
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={onAddSubmit} className="mt-3">
            <ul className="grid gap-2 sm:grid-cols-2">
              {availableCards.map((card) => (
                <li key={card.id}>
                  <CheckboxItem
                    name="cardId"
                    value={card.id}
                    label={card.title}
                  />
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end">
              <Button type="submit" loading={adding} disabled={adding}>
                <IconPlus className="size-4" />
                {adding ? "Ajout…" : "Ajouter à la section"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
