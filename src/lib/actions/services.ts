"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { services } from "@/db/schema";
import type { ActionResult, FormState } from "@/lib/form-state";
import { slugify } from "@/lib/slug";
import { requireAdmin } from "@/lib/session";

const serviceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Le titre doit contenir au moins 2 caractères.")
    .max(120, "Le titre ne peut pas dépasser 120 caractères."),
  slug: z.string().trim().max(80).optional().default(""),
  description: z.string().trim().max(2000, "Description trop longue (2000 max).").optional().default(""),
  price: z.string().trim().max(60, "Prix trop long (60 caractères max).").optional(),
  imageUrl: z.string().trim().optional().default(""),
  sortOrder: z.coerce.number().int("Doit être un entier.").min(0).max(999).optional().default(0),
  published: z.boolean(),
});

function parseServiceForm(formData: FormData) {
  return serviceSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    price: formData.get("price"),
    imageUrl: formData.get("imageUrl"),
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
  const slug = base || "service";
  let candidate = slug;
  for (let i = 2; ; i++) {
    const rows = await db
      .select({ id: services.id })
      .from(services)
      .where(eq(services.slug, candidate))
      .limit(1);
    if (!rows[0] || rows[0].id === excludeId) return candidate;
    candidate = `${slug}-${i}`;
  }
}

function revalidateServices() {
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/");
}

export async function createService(formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = parseServiceForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Corrigez les champs indiqués.", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const { title, slug, description, price, imageUrl, sortOrder, published } = parsed.data;

  await db.insert(services).values({
    title,
    slug: await uniqueSlug(slugify(slug || title)),
    description,
    price: price || null,
    imageUrl,
    sortOrder,
    published,
  });

  revalidateServices();
  return { status: "success", message: "Service créé." };
}

export async function updateService(id: number, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = parseServiceForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Corrigez les champs indiqués.", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const { title, slug, description, price, imageUrl, sortOrder, published } = parsed.data;

  await db
    .update(services)
    .set({
      title,
      slug: await uniqueSlug(slugify(slug || title), id),
      description,
      price: price || null,
      imageUrl,
      sortOrder,
      published,
    })
    .where(eq(services.id, id));

  revalidateServices();
  return { status: "success", message: "Service mis à jour." };
}

export async function deleteService(id: number): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(services).where(eq(services.id, id));
  revalidateServices();
  return { ok: true };
}

/** Échange l'ordre d'affichage avec le voisin (précédent ou suivant). */
export async function moveService(id: number, direction: "up" | "down"): Promise<ActionResult> {
  await requireAdmin();

  const all = await db
    .select({ id: services.id })
    .from(services)
    .orderBy(asc(services.sortOrder), asc(services.id));

  const index = all.findIndex((s) => s.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= all.length) {
    return { ok: true };
  }

  await db
    .update(services)
    .set({ sortOrder: swapWith + 1 })
    .where(eq(services.id, all[index].id));
  await db
    .update(services)
    .set({ sortOrder: index + 1 })
    .where(eq(services.id, all[swapWith].id));

  revalidateServices();
  return { ok: true };
}
