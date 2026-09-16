import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { galleryCards, gallerySections, sectionCards, siteSettings } from "@/db/schema";

/** Réglages du site (ligne unique id=1). */
export async function getSettings() {
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, 1))
    .limit(1);
  return row ?? null;
}

/** Sections publiées avec leurs cartes publiables (via la jointure N-N). */
export async function getPublishedGallery() {
  const sections = await db
    .select()
    .from(gallerySections)
    .where(eq(gallerySections.published, true))
    .orderBy(asc(gallerySections.sortOrder), asc(gallerySections.id));

  const cards = await db
    .select({
      sectionId: sectionCards.sectionId,
      sortOrder: sectionCards.sortOrder,
      title: galleryCards.title,
      description: galleryCards.description,
      imageUrl: galleryCards.imageUrl,
      alt: galleryCards.alt,
    })
    .from(sectionCards)
    .innerJoin(galleryCards, eq(sectionCards.cardId, galleryCards.id))
    .orderBy(asc(sectionCards.sortOrder), asc(galleryCards.id));

  return sections.map((section) => ({
    ...section,
    cards: cards
      .filter((c) => c.sectionId === section.id)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ sectionId: _sectionId, sortOrder: _sortOrder, ...card }) => card),
  }));
}
