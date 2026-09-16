import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { galleryCards, gallerySections, sectionCards } from "@/db/schema";

import { CardForm } from "../card-form";

import { BackLink } from "@/components/ui/back-link";

export const metadata: Metadata = {
  title: "Modifier la carte — Administration",
};

export default async function EditCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cardId = Number(id);
  if (!Number.isInteger(cardId)) notFound();

  const [card] = await db
    .select()
    .from(galleryCards)
    .where(eq(galleryCards.id, cardId))
    .limit(1);
  if (!card) notFound();

  const sections = await db
    .select({ id: gallerySections.id, title: gallerySections.title })
    .from(gallerySections)
    .orderBy(asc(gallerySections.sortOrder), asc(gallerySections.id));

  const assignments = await db
    .select({ sectionId: sectionCards.sectionId })
    .from(sectionCards)
    .where(eq(sectionCards.cardId, cardId));

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/admin/galerie/cartes" label="Retour aux cartes" />
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Modifier la carte</h1>
        <p className="mt-1 text-sm text-ink-muted">
          <span className="font-medium text-ink">{card.title}</span>
        </p>
      </header>
      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        <CardForm
          card={card}
          sections={sections}
          assignedSectionIds={assignments.map((a) => a.sectionId)}
        />
      </div>
    </div>
  );
}
