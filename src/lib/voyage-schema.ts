import { z } from "zod";

/**
 * Validation des voyages organisés — partagée par les Server Actions
 * (autorité) et le formulaire admin (retour immédiat champ par champ, sans
 * attendre l'enregistrement).
 */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.")
  .optional()
  .or(z.literal(""));

/** Une photo / un élément par ligne (textarea ou input caché de l'uploader). */
const lineList = (max: number, label: string) =>
  z
    .array(z.string().trim().min(1).max(300))
    .max(max, `${label} : ${max} lignes maximum.`)
    .optional()
    .default([]);

export const voyageSchema = z
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
    sortOrder: z.coerce
      .number()
      .int("Doit être un entier.")
      .min(0)
      .max(999)
      .optional()
      .default(0),
    published: z.boolean(),
  })
  .refine(
    (d) => !d.departureDate || !d.returnDate || d.returnDate > d.departureDate,
    { path: ["returnDate"], message: "Le retour doit être après le départ." },
  );

export type VoyageInput = z.infer<typeof voyageSchema>;

/** Éclate un champ « une valeur par ligne » en tableau propre. */
export function linesOf(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Erreurs zod → { nomDeChamp: message } (1er message par champ). */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
