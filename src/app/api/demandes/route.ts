import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { gallerySections, services, tripRequests, voyages } from "@/db/schema";
import { clientIpFrom, rateLimit } from "@/lib/rate-limit";
import {
  ACCOMMODATION_VALUES,
  BUDGET_VALUES,
  OTHER_DESTINATION,
  TRIP_TYPE_VALUES,
} from "@/lib/trip-options";

/** Date du jour (AAAA-MM-JJ, fuseau serveur) pour les bornes de dates. */
function todayIso(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

/** « » → undefined : le formulaire envoie tous les champs, même vides. */
const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const demandSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Le nom complet est requis.")
      .max(100, "Le nom est trop long."),
    phone: z
      .string()
      .trim()
      .min(6, "Le numéro de téléphone est requis.")
      .max(30, "Le numéro est trop long.")
      .regex(/^[+0-9 ()./-]+$/, "Le téléphone ne peut contenir que des chiffres et + ( ) - ."),
    // E-mail optionnel : validé seulement s'il est renseigné.
    email: z
      .union([z.literal(""), z.string().trim().max(200).email("Adresse e-mail invalide.")])
      .optional()
      .default(""),
    // Destinations : optionnelles — le mode express (voyage organisé choisi)
    // ne les demande plus, le voyage porte déjà la destination.
    destinations: z
      .array(z.string().trim().min(1).max(60))
      .max(10, "Dix destinations maximum.")
      .optional()
      .default([]),
    // Offres concernées : 0 à 5 slugs (multi-sélection du formulaire).
    offers: z
      .array(z.string().trim().min(1).max(80))
      .max(5, "Cinq offres maximum.")
      .optional()
      .default([]),
    // Voyage organisé choisi : slug unique, optionnel.
    voyage: z.string().trim().max(80).optional().default(""),
    // Champs « wizard classique » : optionnels (mode express).
    departureCity: z.string().trim().max(100, "La ville est trop longue.").optional().default(""),
    departureDate: z
      .union([
        z.literal(""),
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de départ invalide."),
      ])
      .optional()
      .default(""),
    returnDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date de retour invalide.")
      .optional()
      .or(z.literal("")),
    adults: z.coerce
      .number()
      .int("Doit être un entier.")
      .min(1, "Au moins un adulte.")
      .max(30, "Trop de voyageurs — appelez-nous pour un grand groupe.")
      .nullable()
      .optional(),
    children: z.coerce.number().int("Doit être un entier.").min(0).max(30).nullable().optional(),
    tripType: z.preprocess(
      emptyToUndefined,
      z
        .enum(TRIP_TYPE_VALUES as [string, ...string[]], {
          message: "Choisissez un type de voyage.",
        })
        .optional(),
    ),
    budget: z.preprocess(
      emptyToUndefined,
      z
        .enum(BUDGET_VALUES as [string, ...string[]], {
          message: "Choisissez une fourchette de budget.",
        })
        .optional(),
    ),
    accommodation: z.preprocess(
      emptyToUndefined,
      z
        .enum(ACCOMMODATION_VALUES as [string, ...string[]], {
          message: "Choisissez un hébergement.",
        })
        .optional(),
    ),
    notes: z
      .string()
      .trim()
      .max(2000, "Les demandes spéciales sont trop longues (2000 caractères max).")
      .optional()
      .default(""),
    // Honeypot anti-spam : doit rester vide (champ caché du formulaire).
    website: z.string().optional().default(""),
  })
  .refine(
    (d) => !d.returnDate || !d.departureDate || d.returnDate > d.departureDate,
    { path: ["returnDate"], message: "Le retour doit être après le départ." },
  )
  .refine(
    (d) => !d.departureDate || d.departureDate >= todayIso(),
    { path: ["departureDate"], message: "La date de départ doit être future." },
  );

export async function POST(request: Request) {
  const ip = clientIpFrom(request.headers);
  if (!rateLimit(`demandes:${ip}`, 10, 5 * 60_000)) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez dans quelques minutes." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = demandSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json({ error: "Données invalides.", fieldErrors }, { status: 400 });
  }

  const data = parsed.data;

  // Honeypot rempli → bot : faux succès, rien n'est enregistré.
  if (data.website) {
    return NextResponse.json({ ok: true });
  }

  // Destinations : on ne garde que les slugs réellement publiés (ou « autre »),
  // pour que la demande corresponde toujours à des choix affichables en admin.
  const publishedSlugs = await db
    .select({ slug: gallerySections.slug })
    .from(gallerySections)
    .where(eq(gallerySections.published, true));
  const allowed = new Set(publishedSlugs.map((s) => s.slug));
  allowed.add(OTHER_DESTINATION);
  // Destination « autre » reste admise même sans section publiée.
  const destinations = data.destinations.filter((slug) => allowed.has(slug));
  if (data.destinations.length > 0 && destinations.length === 0) {
    return NextResponse.json(
      { error: "Données invalides.", fieldErrors: { destinations: "Choisissez au moins une destination valide." } },
      { status: 400 },
    );
  }

  // Offres : seuls les slugs réellement publiés sont gardés (formulaire
  // trafiqué), titres snapshotés pour survivre à une suppression d'offre.
  let offers: string[] = [];
  let offerTitles: string[] = [];
  if (data.offers.length > 0) {
    const rows = await db
      .select({ slug: services.slug, title: services.title })
      .from(services)
      .where(and(eq(services.published, true), inArray(services.slug, data.offers)));
    const titleBySlug = new Map(rows.map((r) => [r.slug, r.title]));
    // Ordre du formulaire conservé, dédoublonné.
    offers = [...new Set(data.offers)].filter((slug) => titleBySlug.has(slug));
    offerTitles = offers.map((slug) => titleBySlug.get(slug)!);
  }

  // Voyage organisé : seul un slug publié est accepté, titre snapshoté pour
  // survivre à une suppression du voyage.
  let voyageSlug: string | null = null;
  let voyageTitle: string | null = null;
  if (data.voyage) {
    const [row] = await db
      .select({ slug: voyages.slug, title: voyages.title })
      .from(voyages)
      .where(and(eq(voyages.published, true), eq(voyages.slug, data.voyage)))
      .limit(1);
    if (row) {
      voyageSlug = row.slug;
      voyageTitle = row.title;
    }
  }

  await db.insert(tripRequests).values({
    fullName: data.fullName,
    phone: data.phone,
    email: data.email || null,
    destinations,
    offers,
    offerTitles,
    voyageSlug,
    voyageTitle,
    departureCity: data.departureCity || null,
    departureDate: data.departureDate || null,
    returnDate: data.returnDate ? data.returnDate : null,
    adults: data.adults ?? null,
    children: data.children ?? null,
    tripType: data.tripType || null,
    budget: data.budget || null,
    accommodation: data.accommodation || null,
    notes: data.notes || null,
  });

  return NextResponse.json({ ok: true });
}
