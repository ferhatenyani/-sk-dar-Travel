"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import type { FormState } from "@/lib/form-state";
import { requireAdmin } from "@/lib/session";

/** Ligne unique des réglages du site (id = 1). */
const SETTINGS_ID = 1;

/** URL absolue, chemin local (« /… ») ou chaîne vide (champ optionnel). */
const urlOrEmpty = z
  .union([
    z.string().trim().url("URL invalide (ex. https://exemple.com)."),
    z.string().trim().regex(/^\/[^\s]+$/, "Chemin local invalide (ex. /images/photo.webp)."),
    z.literal(""),
  ])
  .optional()
  .default("");

const settingsSchema = z.object({
  heroTitle: z
    .string()
    .trim()
    .min(2, "Le titre doit contenir au moins 2 caractères.")
    .max(150, "Le titre ne peut pas dépasser 150 caractères."),
  heroText: z
    .string()
    .trim()
    .min(2, "Le texte d'accueil est requis.")
    .max(3000, "Le texte d'accueil ne peut pas dépasser 3000 caractères."),
  heroImageUrl: urlOrEmpty,
  aboutText: z
    .string()
    .trim()
    .min(2, "Le texte « À propos » est requis.")
    .max(3000, "Le texte « À propos » ne peut pas dépasser 3000 caractères."),
  phone: z
    .string()
    .trim()
    .min(1, "Le téléphone est obligatoire.")
    .max(20, "Le téléphone ne peut pas dépasser 20 caractères.")
    .regex(/^[\d\s+]+$/, "Le téléphone ne peut contenir que des chiffres, des espaces et « + »."),
  address: z
    .string()
    .trim()
    .max(200, "L'adresse ne peut pas dépasser 200 caractères.")
    .optional()
    .default(""),
  logoUrl: urlOrEmpty,
  facebookUrl: urlOrEmpty,
  instagramUrl: urlOrEmpty,
  seoTitle: z
    .string()
    .trim()
    .max(150, "Le titre SEO ne peut pas dépasser 150 caractères.")
    .optional()
    .default(""),
  seoDescription: z
    .string()
    .trim()
    .max(300, "La description SEO ne peut pas dépasser 300 caractères.")
    .optional()
    .default(""),
});

function strOf(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseSettingsForm(formData: FormData) {
  return settingsSchema.safeParse({
    heroTitle: strOf(formData, "heroTitle"),
    heroText: strOf(formData, "heroText"),
    heroImageUrl: strOf(formData, "heroImageUrl"),
    aboutText: strOf(formData, "aboutText"),
    phone: strOf(formData, "phone"),
    address: strOf(formData, "address"),
    logoUrl: strOf(formData, "logoUrl"),
    facebookUrl: strOf(formData, "facebookUrl"),
    instagramUrl: strOf(formData, "instagramUrl"),
    seoTitle: strOf(formData, "seoTitle"),
    seoDescription: strOf(formData, "seoDescription"),
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

function revalidateSitePages() {
  revalidatePath("/");
  revalidatePath("/a-propos");
  revalidatePath("/services");
  revalidatePath("/galerie");
  revalidatePath("/admin/contenus");
}

/**
 * Met à jour (ou crée) la ligne unique site_settings (id = 1) qui pilote
 * les textes et coordonnées du site public.
 */
export async function updateSettings(formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = parseSettingsForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Corrigez les champs indiqués.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  const data = parsed.data;
  const values = {
    heroTitle: data.heroTitle,
    heroText: data.heroText,
    heroImageUrl: data.heroImageUrl || null,
    aboutText: data.aboutText,
    phone: data.phone,
    address: data.address,
    logoUrl: data.logoUrl || null,
    facebookUrl: data.facebookUrl || null,
    instagramUrl: data.instagramUrl || null,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
  };

  await db
    .insert(siteSettings)
    .values({ id: SETTINGS_ID, ...values })
    .onConflictDoUpdate({ target: siteSettings.id, set: values });

  revalidateSitePages();
  return { status: "success", message: "Modifications enregistrées." };
}
