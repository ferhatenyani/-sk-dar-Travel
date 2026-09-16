import type { Metadata } from "next";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { SettingsForm, type SettingsFormValues } from "./settings-form";

export const metadata: Metadata = {
  title: "Contenus — Administration",
};

/** Valeurs par défaut (seed) si la ligne site_settings n'existe pas encore. */
const DEFAULT_SETTINGS: SettingsFormValues = {
  heroTitle: "Üsküdar Travel — Voyages organisés & sur-mesure",
  heroText:
    "Üsküdar Travel est une agence de voyage située à Sétif proposant des voyages organisés et sur-mesure (Algérie, Turquie, Tunisie, Égypte, Malaisie), hôtellerie, billetterie, transferts et assurance. Prise en charge complète pour des vacances et séjours sereins en famille, en groupe.",
  aboutText:
    "Üsküdar Travel est une agence de voyage située à Sétif proposant des voyages organisés et sur-mesure (Algérie, Turquie, Tunisie, Égypte, Malaisie), hôtellerie, billetterie, transferts et assurance. Prise en charge complète pour des vacances et séjours sereins en famille, en groupe.",
  phone: "0770505715",
  whatsappNumber: "+213770505715",
  email: "uskudar.travel19@gmail.com",
  address: "Sétif, Algérie",
  logoUrl: "",
  heroImageUrl: "",
  facebookUrl: "",
  instagramUrl: "",
  seoTitle: "",
  seoDescription: "",
};

export default async function ContenusPage() {
  const [settings] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, 1))
    .limit(1);

  const values: SettingsFormValues = settings
    ? {
        heroTitle: settings.heroTitle,
        heroText: settings.heroText,
        aboutText: settings.aboutText,
        phone: settings.phone,
        whatsappNumber: settings.whatsappNumber,
        email: settings.email,
        address: settings.address,
        logoUrl: settings.logoUrl ?? "",
        heroImageUrl: settings.heroImageUrl ?? "",
        facebookUrl: settings.facebookUrl ?? "",
        instagramUrl: settings.instagramUrl ?? "",
        seoTitle: settings.seoTitle,
        seoDescription: settings.seoDescription,
      }
    : DEFAULT_SETTINGS;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Contenus</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Textes, bannière et coordonnées affichés sur le site public.
        </p>
      </header>
      <SettingsForm settings={values} />
    </div>
  );
}
