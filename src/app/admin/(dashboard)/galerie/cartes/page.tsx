import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { galleryCards, gallerySections, sectionCards } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconImage, IconPlus } from "@/components/ui/icons";
import { DeleteCardButton, EditLink } from "../row-actions";

export const metadata: Metadata = {
  title: "Cartes photo — Administration",
};

export default async function CardsPage() {
  const cards = await db
    .select()
    .from(galleryCards)
    .orderBy(asc(galleryCards.id));

  const links = await db
    .select({
      cardId: sectionCards.cardId,
      sectionId: gallerySections.id,
      sectionTitle: gallerySections.title,
    })
    .from(sectionCards)
    .innerJoin(gallerySections, eq(gallerySections.id, sectionCards.sectionId))
    .orderBy(asc(gallerySections.sortOrder), asc(gallerySections.id));

  const sectionsByCard = new Map<number, { id: number; title: string }[]>();
  for (const link of links) {
    const list = sectionsByCard.get(link.cardId) ?? [];
    list.push({ id: link.sectionId, title: link.sectionTitle });
    sectionsByCard.set(link.cardId, list);
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cartes photo</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {cards.length} carte{cards.length > 1 ? "s" : ""} — une même carte
            peut apparaître dans plusieurs sections.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/galerie">
            <Button variant="secondary">Sections</Button>
          </Link>
          <Link href="/admin/galerie/cartes/nouveau">
            <Button>
              <IconPlus className="size-4" />
              Nouvelle carte
            </Button>
          </Link>
        </div>
      </header>

      {cards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong bg-surface p-10 text-center">
          <p className="text-sm text-ink-muted">
            Aucune carte pour le moment. Créez la première pour alimenter les
            sections de la galerie.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {cards.map((card) => {
            const cardSections = sectionsByCard.get(card.id) ?? [];
            return (
              <li
                key={card.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-sm sm:gap-4 sm:p-4"
              >
                {card.imageUrl ? (
                  <Image
                    src={card.imageUrl}
                    alt={card.alt}
                    width={64}
                    height={48}
                    className="h-12 w-16 shrink-0 rounded-lg border border-line object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-line bg-page">
                    <IconImage className="size-5 text-ink-faint" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">
                    {card.title}
                  </span>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {card.alt ? `Alt : ${card.alt}` : "Sans texte alternatif"}
                  </p>
                  {cardSections.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {cardSections.map((section) => (
                        <Badge key={section.id} variant="navy">
                          {section.title}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1.5 text-xs text-ink-faint">
                      Aucune section liée
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <EditLink
                    href={`/admin/galerie/cartes/${card.id}`}
                    label={card.title}
                  />
                  <DeleteCardButton id={card.id} title={card.title} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
