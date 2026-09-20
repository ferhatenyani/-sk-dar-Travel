import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  galleryCards,
  gallerySections,
  sectionCards,
  services,
  siteSettings,
  voyages,
} from "@/db/schema";

/** Réglages du site (ligne unique id=1). */
export async function getSettings() {
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, 1))
    .limit(1);
  return row ?? null;
}

/** Offres publiées (services) — page /services, pages détail, formulaire. */
export async function getPublishedOffers() {
  return db
    .select({ slug: services.slug, title: services.title })
    .from(services)
    .where(eq(services.published, true))
    .orderBy(asc(services.sortOrder), asc(services.id));
}

/** Destinations publiées (sections galerie) — chips du formulaire + hero. */
export async function getPublishedDestinations() {
  return db
    .select({ slug: gallerySections.slug, title: gallerySections.title })
    .from(gallerySections)
    .where(eq(gallerySections.published, true))
    .orderBy(asc(gallerySections.sortOrder), asc(gallerySections.id));
}

/** Voyages organisés publiés (colonnes publiables) — accueil, page listing, modale. */
export async function getPublishedVoyages() {
  return db
    .select({
      slug: voyages.slug,
      title: voyages.title,
      description: voyages.description,
      price: voyages.price,
      imageUrl: voyages.imageUrl,
      galleryImages: voyages.galleryImages,
      departureDate: voyages.departureDate,
      returnDate: voyages.returnDate,
      program: voyages.program,
      included: voyages.included,
      excluded: voyages.excluded,
    })
    .from(voyages)
    .where(eq(voyages.published, true))
    .orderBy(asc(voyages.sortOrder), asc(voyages.id));
}

/** Voyages organisés publiés (slug + titre) — menu « Voyage organisé » du formulaire. */
export async function getPublishedVoyageChoices() {
  return db
    .select({ slug: voyages.slug, title: voyages.title })
    .from(voyages)
    .where(eq(voyages.published, true))
    .orderBy(asc(voyages.sortOrder), asc(voyages.id));
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
