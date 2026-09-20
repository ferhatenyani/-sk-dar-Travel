import type { SiteSettings } from "@/db/schema";

/** Texte officiel du brief — repli si le CMS n'est pas encore renseigné. */
export const TEXTE_OFFICIEL =
  "Üsküdar Travel est une agence de voyage située à Sétif proposant des voyages " +
  "organisés et sur-mesure (Algérie, Turquie, Tunisie, Égypte, Malaisie), hôtellerie, " +
  "billetterie, transferts et assurance. Prise en charge complète pour des vacances " +
  "et séjours sereins en famille, en groupe.";

/**
 * Adresse réelle de l'agence : Plus Code Google Maps, cliquable et affiché
 * sur la carte intégrée de la section contact.
 */
export const ADDRESS_QUERY = "6C23+XHW, Sétif";

/** Lien « itinéraire » : ouvre Google Maps sur le pin de l'agence. */
export function mapsLink(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS_QUERY)}`;
}

/** Carte intégrée (iframe Google, sans clé API). */
export function mapsEmbedUrl(): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS_QUERY)}&hl=fr&z=16&output=embed`;
}

/** Réglages avec valeurs de repli pour la vitrine (CMS = source de vérité). */
export function vitrineSettings(settings: SiteSettings | null) {
  return {
    heroTitle: settings?.heroTitle || "Voyages organisés & sur-mesure, depuis Sétif",
    heroText: settings?.heroText || TEXTE_OFFICIEL,
    heroImageUrl: settings?.heroImageUrl || "/images/hero.webp",
    aboutText: settings?.aboutText || TEXTE_OFFICIEL,
    phone: settings?.phone || "0770505715",
    address: settings?.address || ADDRESS_QUERY,
    logoUrl: settings?.logoUrl || "/logo.jpg",
    facebookUrl: settings?.facebookUrl || "",
    instagramUrl: settings?.instagramUrl || "",
    seoTitle: settings?.seoTitle || "Üsküdar Travel — Agence de voyage à Sétif",
    seoDescription: settings?.seoDescription || TEXTE_OFFICIEL,
  };
}

export type VitrineSettings = ReturnType<typeof vitrineSettings>;

/** Formats d'affichage des coordonnées. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}
export function formatPhone(phone: string): string {
  return phone;
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** Images locales de repli si une destination n'a pas encore de carte publiée. */
export const DESTINATION_FALLBACKS: Record<string, string> = {
  algerie: "/images/dz-constantine.webp",
  turquie: "/images/tr-cappadoce.webp",
  tunisie: "/images/tn-sidi.webp",
  egypte: "/images/eg-pyramides.webp",
  malaisie: "/images/my-petronas.webp",
};

export function destinationImage(slug: string): string {
  return DESTINATION_FALLBACKS[slug] ?? "/images/hero.webp";
}
