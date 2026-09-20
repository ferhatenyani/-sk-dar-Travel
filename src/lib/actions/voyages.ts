"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { voyages } from "@/db/schema";
import type { ActionResult, FormState } from "@/lib/form-state";
import { slugify } from "@/lib/slug";
import { requireAdmin } from "@/lib/session";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.")
  .optional()
  .or(z.literal(""));

/** Une photo / un élément par ligne (textarea ou input caché de l'uploader). */
const lineList = (max: number, label: string) =>
  z.array(z.string().trim().min(1).max(300)).max(max, `${label} : ${max} lignes maximum.`).optional().default([]);

const voyageSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Le titre doit contenir au moins 2 caractères.")
      .max(120, "Le titre ne peut pas dépasser 120 caractères."),
    slug: z.string().trim().max(80).optional().default(""),
    description: z
      .string()
      .trim()
      .max(4000, "Description trop longue (4000 max).")
      .optional()
      .default(""),
    price: z.string().trim().max(60, "Prix trop long (60 caractères max).").optional(),
    imageUrl: z.string().trim().optional().default(""),
    galleryImages: lineList(6, "Galerie"),
    departureDate: isoDate,
    returnDate: isoDate,
    program: z
      .string()
      .trim()
      .max(4000, "Programme trop long (4000 max).")
      .optional()
      .default(""),
    included: lineList(20, "Inclus"),
    excluded: lineList(20, "Non inclus"),
    sortOrder: z.coerce.number().int("Doit être un entier.").min(0).max(999).optional().default(0),
    published: z.boolean(),
  })
  .refine(
    (d) =>
      !d.departureDate ||
      !d.returnDate ||
      d.returnDate > d.departureDate,
    { path: ["returnDate"], message: "Le retour doit être après le départ." },
  );

/** Éclate un champ « une valeur par ligne » en tableau propre. */
function linesOf(formData: FormData, name: string): string[] {
  const raw = String(formData.get(name) ?? "");
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseVoyageForm(formData: FormData) {
  return voyageSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    price: formData.get("price"),
    imageUrl: formData.get("imageUrl"),
    galleryImages: linesOf(formData, "galleryImages"),
    departureDate: formData.get("departureDate"),
    returnDate: formData.get("returnDate"),
    program: formData.get("program"),
    included: linesOf(formData, "included"),
    excluded: linesOf(formData, "excluded"),
    sortOrder: formData.get("sortOrder"),
    published: formData.get("published") !== null,
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

async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
  const slug = base || "voyage";
  let candidate = slug;
  for (let i = 2; ; i++) {
    const rows = await db
      .select({ id: voyages.id })
      .from(voyages)
      .where(eq(voyages.slug, candidate))
      .limit(1);
    if (!rows[0] || rows[0].id === excludeId) return candidate;
    candidate = `${slug}-${i}`;
  }
}

function revalidateVoyages() {
  revalidatePath("/admin/voyages");
  revalidatePath("/voyages-organises");
  revalidatePath("/");
}

export async function createVoyage(formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = parseVoyageForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Corrigez les champs indiqués.", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const d = parsed.data;

  await db.insert(voyages).values({
    title: d.title,
    slug: await uniqueSlug(slugify(d.slug || d.title)),
    description: d.description,
    price: d.price || null,
    imageUrl: d.imageUrl,
    galleryImages: d.galleryImages,
    departureDate: d.departureDate || null,
    returnDate: d.returnDate || null,
    program: d.program,
    included: d.included,
    excluded: d.excluded,
    sortOrder: d.sortOrder,
    published: d.published,
  });

  revalidateVoyages();
  return { status: "success", message: "Voyage créé." };
}

export async function updateVoyage(id: number, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = parseVoyageForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Corrigez les champs indiqués.", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const d = parsed.data;

  await db
    .update(voyages)
    .set({
      title: d.title,
      slug: await uniqueSlug(slugify(d.slug || d.title), id),
      description: d.description,
      price: d.price || null,
      imageUrl: d.imageUrl,
      galleryImages: d.galleryImages,
      departureDate: d.departureDate || null,
      returnDate: d.returnDate || null,
      program: d.program,
      included: d.included,
      excluded: d.excluded,
      sortOrder: d.sortOrder,
      published: d.published,
    })
    .where(eq(voyages.id, id));

  revalidateVoyages();
  return { status: "success", message: "Voyage mis à jour." };
}

export async function deleteVoyage(id: number): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(voyages).where(eq(voyages.id, id));
  revalidateVoyages();
  return { ok: true };
}

/** Échange l'ordre d'affichage avec le voisin (précédent ou suivant). */
export async function moveVoyage(id: number, direction: "up" | "down"): Promise<ActionResult> {
  await requireAdmin();

  const all = await db
    .select({ id: voyages.id })
    .from(voyages)
    .orderBy(asc(voyages.sortOrder), asc(voyages.id));

  const index = all.findIndex((v) => v.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= all.length) {
    return { ok: true };
  }

  await db
    .update(voyages)
    .set({ sortOrder: swapWith + 1 })
    .where(eq(voyages.id, all[index].id));
  await db
    .update(voyages)
    .set({ sortOrder: index + 1 })
    .where(eq(voyages.id, all[swapWith].id));

  revalidateVoyages();
  return { ok: true };
}
