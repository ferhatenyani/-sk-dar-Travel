"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { voyages } from "@/db/schema";
import type { ActionResult, FormState } from "@/lib/form-state";
import { slugify } from "@/lib/slug";
import { requireAdmin } from "@/lib/session";
import { fieldErrorsOf, linesOf, voyageSchema } from "@/lib/voyage-schema";

function parseVoyageForm(formData: FormData) {
  return voyageSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    price: formData.get("price"),
    imageUrl: formData.get("imageUrl"),
    galleryImages: linesOf(String(formData.get("galleryImages") ?? "")),
    departureDate: formData.get("departureDate"),
    returnDate: formData.get("returnDate"),
    program: formData.get("program"),
    included: linesOf(String(formData.get("included") ?? "")),
    excluded: linesOf(String(formData.get("excluded") ?? "")),
    sortOrder: formData.get("sortOrder"),
    published: formData.get("published") !== null,
  });
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
