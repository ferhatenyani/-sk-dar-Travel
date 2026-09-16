import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { galleryCards, gallerySections, sectionCards } from "@/db/schema";

import { SectionForm } from "../section-form";
import { SectionCardsPanel } from "../section-cards-panel";

import { BackLink } from "@/components/ui/back-link";

export const metadata: Metadata = {
  title: "Modifier la section — Administration",
};

export default async function EditSectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sectionId = Number(id);
  if (!Number.isInteger(sectionId)) notFound();

  const [section] = await db
    .select()
    .from(gallerySections)
    .where(eq(gallerySections.id, sectionId))
    .limit(1);
  if (!section) notFound();

  // Cartes liées à cette section, triées par leur ordre DANS la section.
  const linkedCards = await db
    .select({
      id: galleryCards.id,
      title: galleryCards.title,
      imageUrl: galleryCards.imageUrl,
    })
    .from(sectionCards)
    .innerJoin(galleryCards, eq(galleryCards.id, sectionCards.cardId))
    .where(eq(sectionCards.sectionId, sectionId))
    .orderBy(asc(sectionCards.sortOrder), asc(sectionCards.cardId));

  // Toutes les cartes, pour déduire celles qui ne sont pas encore liées.
  const allCards = await db
    .select({ id: galleryCards.id, title: galleryCards.title, imageUrl: galleryCards.imageUrl })
    .from(galleryCards)
    .orderBy(asc(galleryCards.id));

  const linkedIds = new Set(linkedCards.map((c) => c.id));
  const availableCards = allCards.filter((card) => !linkedIds.has(card.id));

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/admin/galerie" label="Retour à la galerie" />
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Modifier la section</h1>
        <p className="mt-1 text-sm text-ink-muted">
          <span className="font-medium text-ink">{section.title}</span>{" "}
          <span className="text-ink-faint">/{section.slug}</span>
        </p>
      </header>

      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        <SectionForm section={section} />
      </div>

      <SectionCardsPanel
        sectionId={section.id}
        sectionTitle={section.title}
        linkedCards={linkedCards}
        availableCards={availableCards}
      />
    </div>
  );
}
