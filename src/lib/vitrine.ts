import type { SiteSettings } from "@/db/schema";

/** Texte officiel du brief — repli si le CMS n'est pas encore renseigné. */
export const TEXTE_OFFICIEL =
  "Üsküdar Travel est une agence de voyage située à Sétif proposant des voyages " +
  "organisés et sur-mesure (Algérie, Turquie, Tunisie, Égypte, Malaisie), hôtellerie, " +
  "billetterie, transferts et assurance. Prise en charge complète pour des vacances " +
  "et séjours sereins en famille, en groupe.";

/** Réglages avec valeurs de repli pour la vitrine (CMS = source de vérité). */
export function vitrineSettings(settings: SiteSettings | null) {
  return {
    heroTitle: settings?.heroTitle || "Voyages organisés & sur-mesure, depuis Sétif",
    heroText: settings?.heroText || TEXTE_OFFICIEL,
    heroImageUrl: settings?.heroImageUrl || "/images/hero.webp",
    aboutText: settings?.aboutText || TEXTE_OFFICIEL,
    phone: settings?.phone || "0770505715",
    whatsappNumber: settings?.whatsappNumber || "+213770505715",
    email: settings?.email || "uskudar.travel19@gmail.com",
    address: settings?.address || "Sétif, Algérie",
    logoUrl: settings?.logoUrl || "/logo.jpg",
    facebookUrl: settings?.facebookUrl || "",
    instagramUrl: settings?.instagramUrl || "",
    seoTitle: settings?.seoTitle || "Üsküdar Travel — Agence de voyage à Sétif",
    seoDescription: settings?.seoDescription || TEXTE_OFFICIEL,
  };
}

export type VitrineSettings = ReturnType<typeof vitrineSettings>;

/** Lien wa.me : numéro réduit aux chiffres + message prérempli optionnel. */
export function waLink(whatsappNumber: string, message?: string): string {
  const digits = (whatsappNumber || "+213770505715").replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const WA_MESSAGE =
  "Bonjour Üsküdar Travel ! Je souhaite organiser un voyage. Pouvez-vous me renseigner ?";

export function waServiceLink(whatsappNumber: string, service: string): string {
  return waLink(
    whatsappNumber,
    `Bonjour Üsküdar Travel ! Je suis intéressé(e) par votre service « ${service} ». Pouvez-vous me donner plus d'informations ?`,
  );
}

/** Lien WhatsApp prérempli avec la destination affichée dans le hero. */
export function waDestinationLink(whatsappNumber: string, destination: string): string {
  return waLink(
    whatsappNumber,
    `Bonjour Üsküdar Travel ! Je souhaite organiser un voyage en ${destination}. Pouvez-vous me faire un devis ?`,
  );
}

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
