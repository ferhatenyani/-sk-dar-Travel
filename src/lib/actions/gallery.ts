"use server";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { galleryCards, gallerySections, sectionCards } from "@/db/schema";
import type { ActionResult, FormState } from "@/lib/form-state";
import { slugify } from "@/lib/slug";
import { requireAdmin } from "@/lib/session";

/* ——— Validation ——— */

const sectionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Le titre doit contenir au moins 2 caractères.")
    .max(120, "Le titre ne peut pas dépasser 120 caractères."),
  slug: z.string().trim().max(80).optional().default(""),
  description: z.string().trim().max(2000, "Description trop longue (2000 max).").optional(),
  sortOrder: z.coerce.number().int("Doit être un entier.").min(0).max(999).optional().default(0),
  published: z.boolean(),
});

const cardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Le titre doit contenir au moins 2 caractères.")
    .max(120, "Le titre ne peut pas dépasser 120 caractères."),
  description: z.string().trim().max(2000, "Description trop longue (2000 max).").optional(),
  imageUrl: z.string().trim().min(1, "L'image est obligatoire."),
  alt: z.string().trim().max(300, "Texte alternatif trop long (300 caractères max).").optional().default(""),
});

const idSchema = z.coerce.number().int("Identifiant invalide.").positive("Identifiant invalide.");

function parseSectionForm(formData: FormData) {
  return sectionSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    sortOrder: formData.get("sortOrder"),
    published: formData.get("published") !== null,
  });
}

function parseCardForm(formData: FormData) {
  return cardSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    alt: formData.get("alt"),
  });
}

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

async function parseId(raw: unknown): Promise<number | null> {
  const parsed = idSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/* ——— Helpers ——— */

async function uniqueSectionSlug(base: string, excludeId?: number): Promise<string> {
  const slug = base || "section";
  let candidate = slug;
  for (let i = 2; ; i++) {
    const rows = await db
      .select({ id: gallerySections.id })
      .from(gallerySections)
      .where(eq(gallerySections.slug, candidate))
      .limit(1);
    if (!rows[0] || rows[0].id === excludeId) return candidate;
    candidate = `${slug}-${i}`;
  }
}

function revalidateGallery() {
  revalidatePath("/admin/galerie");
  revalidatePath("/admin/galerie/cartes");
  revalidatePath("/galerie");
  revalidatePath("/");
}

/* ——— Sections ——— */

export async function createSection(formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = parseSectionForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Corrigez les champs indiqués.", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const { title, slug, description, sortOrder, published } = parsed.data;

  await db.insert(gallerySections).values({
    title,
    slug: await uniqueSectionSlug(slugify(slug || title)),
    description: description || null,
    sortOrder,
    published,
  });

  revalidateGallery();
  return { status: "success", message: "Section créée." };
}

export async function updateSection(id: number, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = parseSectionForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Corrigez les champs indiqués.", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const { title, slug, description, sortOrder, published } = parsed.data;

  await db
    .update(gallerySections)
    .set({
      title,
      slug: await uniqueSectionSlug(slugify(slug || title), id),
      description: description || null,
      sortOrder,
      published,
    })
    .where(eq(gallerySections.id, id));

  revalidateGallery();
  return { status: "success", message: "Section mise à jour." };
}

/** Supprime la section seule — les cartes restent disponibles (cascade sur les jointures uniquement). */
export async function deleteSection(id: number): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(gallerySections).where(eq(gallerySections.id, id));
  revalidateGallery();
  return { ok: true };
}

/** Échange l'ordre d'affichage avec la section voisine (précédente ou suivante). */
export async function moveSection(id: number, direction: "up" | "down"): Promise<ActionResult> {
  await requireAdmin();

  const all = await db
    .select({ id: gallerySections.id })
    .from(gallerySections)
    .orderBy(asc(gallerySections.sortOrder), asc(gallerySections.id));

  const index = all.findIndex((s) => s.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= all.length) {
    return { ok: true };
  }

  await db
    .update(gallerySections)
    .set({ sortOrder: swapWith + 1 })
    .where(eq(gallerySections.id, all[index].id));
  await db
    .update(gallerySections)
    .set({ sortOrder: index + 1 })
    .where(eq(gallerySections.id, all[swapWith].id));

  revalidateGallery();
  return { ok: true };
}

/* ——— Cartes ——— */

export async function createCard(formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = parseCardForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Corrigez les champs indiqués.", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const { title, description, imageUrl, alt } = parsed.data;

  await db.insert(galleryCards).values({
    title,
    description: description || null,
    imageUrl,
    alt,
  });

  revalidateGallery();
  return { status: "success", message: "Carte créée." };
}

export async function updateCard(id: number, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = parseCardForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Corrigez les champs indiqués.", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const { title, description, imageUrl, alt } = parsed.data;

  await db
    .update(galleryCards)
    .set({
      title,
      description: description || null,
      imageUrl,
      alt,
    })
    .where(eq(galleryCards.id, id));

  revalidateGallery();
  return { status: "success", message: "Carte mise à jour." };
}

/** Supprime la carte — les cascades FK la retirent de toutes les sections où elle apparaît. */
export async function deleteCard(id: number): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(galleryCards).where(eq(galleryCards.id, id));
  revalidateGallery();
  return { ok: true };
}

/* ——— Liens section ↔ carte ——— */

/** Remplace l'assignation aux sections d'une carte (ordre = ordre du tableau). */
export async function setCardSections(cardId: number, sectionIds: number[]): Promise<ActionResult> {
  await requireAdmin();

  const parsedCardId = await parseId(cardId);
  if (parsedCardId === null) {
    return { ok: false, error: "Carte invalide." };
  }

  const ids = Array.from(
    new Set(
      sectionIds
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );

  const [card] = await db
    .select({ id: galleryCards.id })
    .from(galleryCards)
    .where(eq(galleryCards.id, parsedCardId))
    .limit(1);
  if (!card) {
    return { ok: false, error: "Carte introuvable." };
  }

  if (ids.length > 0) {
    const sections = await db
      .select({ id: gallerySections.id })
      .from(gallerySections)
      .where(inArray(gallerySections.id, ids));
    if (sections.length !== ids.length) {
      return { ok: false, error: "Une des sections sélectionnées n'existe plus." };
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(sectionCards).where(eq(sectionCards.cardId, parsedCardId));
    if (ids.length > 0) {
      await tx.insert(sectionCards).values(
        ids.map((sectionId, index) => ({
          sectionId,
          cardId: parsedCardId,
          sortOrder: index + 1,
        })),
      );
    }
  });

  revalidateGallery();
  return { ok: true };
}

/** Ajoute une carte existante à une section (en fin d'ordre, sans doublon). */
export async function addCardToSection(sectionId: number, cardId: number): Promise<ActionResult> {
  await requireAdmin();

  const parsedSectionId = await parseId(sectionId);
  const parsedCardId = await parseId(cardId);
  if (parsedSectionId === null || parsedCardId === null) {
    return { ok: false, error: "Section ou carte invalide." };
  }

  const [section] = await db
    .select({ id: gallerySections.id })
    .from(gallerySections)
    .where(eq(gallerySections.id, parsedSectionId))
    .limit(1);
  const [card] = await db
    .select({ id: galleryCards.id })
    .from(galleryCards)
    .where(eq(galleryCards.id, parsedCardId))
    .limit(1);
  if (!section || !card) {
    return { ok: false, error: "Section ou carte introuvable." };
  }

  const [last] = await db
    .select({ sortOrder: sectionCards.sortOrder })
    .from(sectionCards)
    .where(eq(sectionCards.sectionId, parsedSectionId))
    .orderBy(desc(sectionCards.sortOrder))
    .limit(1);
  const nextSortOrder = last ? last.sortOrder + 1 : 1;

  await db
    .insert(sectionCards)
    .values({ sectionId: parsedSectionId, cardId: parsedCardId, sortOrder: nextSortOrder })
    .onConflictDoNothing();

  revalidateGallery();
  return { ok: true };
}

/** Retire la carte d'une section — la carte elle-même n'est pas supprimée. */
export async function removeCardFromSection(sectionId: number, cardId: number): Promise<ActionResult> {
  await requireAdmin();

  const parsedSectionId = await parseId(sectionId);
  const parsedCardId = await parseId(cardId);
  if (parsedSectionId === null || parsedCardId === null) {
    return { ok: false, error: "Section ou carte invalide." };
  }

  await db
    .delete(sectionCards)
    .where(
      and(eq(sectionCards.sectionId, parsedSectionId), eq(sectionCards.cardId, parsedCardId)),
    );

  revalidateGallery();
  return { ok: true };
}

/** Échange l'ordre de la carte avec sa voisine DANS la section (l'ordre global des cartes n'existe pas). */
export async function moveSectionCard(
  sectionId: number,
  cardId: number,
  direction: "up" | "down",
): Promise<ActionResult> {
  await requireAdmin();

  const parsedSectionId = await parseId(sectionId);
  if (parsedSectionId === null) {
    return { ok: false, error: "Section invalide." };
  }

  const all = await db
    .select({ cardId: sectionCards.cardId })
    .from(sectionCards)
    .where(eq(sectionCards.sectionId, parsedSectionId))
    .orderBy(asc(sectionCards.sortOrder), asc(sectionCards.cardId));

  const index = all.findIndex((row) => row.cardId === cardId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= all.length) {
    return { ok: true };
  }

  const movedId = all[index].cardId;
  const neighborId = all[swapWith].cardId;

  await db
    .update(sectionCards)
    .set({ sortOrder: swapWith + 1 })
    .where(
      and(eq(sectionCards.sectionId, parsedSectionId), eq(sectionCards.cardId, movedId)),
    );
  await db
    .update(sectionCards)
    .set({ sortOrder: index + 1 })
    .where(
      and(eq(sectionCards.sectionId, parsedSectionId), eq(sectionCards.cardId, neighborId)),
    );

  revalidateGallery();
  return { ok: true };
}
