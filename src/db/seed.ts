import { randomUUID } from "node:crypto";

import "./env";

import { eq, like, sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

import { db } from "./index";
import {
  account,
  galleryCards,
  gallerySections,
  sectionCards,
  services,
  siteSettings,
  user,
} from "./schema";

const TEXTE_OFFICIEL =
  "Üsküdar Travel est une agence de voyage située à Sétif proposant des voyages " +
  "organisés et sur-mesure (Algérie, Turquie, Tunisie, Égypte, Malaisie), hôtellerie, " +
  "billetterie, transferts et assurance. Prise en charge complète pour des vacances " +
  "et séjours sereins en famille, en groupe.";

/**
 * Images locales de démonstration (banques gratuites — voir
 * site/public/images/CREDITS.md). L'admin les remplace via le CMS.
 */
const IMG = {
  hero: "/images/hero.webp",
  istanbul: "/images/tr-istanbul.webp",
  cappadoce: "/images/tr-cappadoce.webp",
  pamukkale: "/images/tr-pamukkale.webp",
  sidi: "/images/tn-sidi.webp",
  douz: "/images/tn-douz.webp",
  eljem: "/images/tn-eljem.webp",
  pyramides: "/images/eg-pyramides.webp",
  louxor: "/images/eg-louxor.webp",
  nil: "/images/eg-nil.webp",
  petronas: "/images/my-petronas.webp",
  batu: "/images/my-batu.webp",
  mosquee: "/images/my-mosquee.webp",
  constantine: "/images/dz-constantine.webp",
  alger: "/images/dz-alger.webp",
  casbah: "/images/dz-casbah.webp",
};

async function seedSettings() {
  await db
    .insert(siteSettings)
    .values({
      id: 1,
      heroTitle: "Üsküdar Travel — Voyages organisés & sur-mesure",
      heroText: TEXTE_OFFICIEL,
      heroImageUrl: IMG.hero,
      aboutText: TEXTE_OFFICIEL,
      phone: "0770505715",
      address: "6C23+XHW, Sétif",
      seoTitle: "Üsküdar Travel — Agence de voyage à Sétif",
      seoDescription: TEXTE_OFFICIEL,
    })
    .onConflictDoUpdate({
      target: siteSettings.id,
      // N'écrase pas une bannière choisie par l'admin : ne remplit que si vide.
      set: { heroImageUrl: sql`coalesce(${siteSettings.heroImageUrl}, excluded.hero_image_url)` },
    });
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("⚠ ADMIN_EMAIL / ADMIN_PASSWORD absents — admin non créé.");
    return;
  }

  const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  if (existing.length > 0) {
    console.log("• Admin déjà existant :", email);
    return;
  }

  const id = randomUUID();
  await db.insert(user).values({ id, name: "Administrateur", email });
  await db.insert(account).values({
    id: randomUUID(),
    accountId: id,
    providerId: "credential",
    userId: id,
    password: await hashPassword(password),
  });
  console.log("✓ Admin créé :", email);
}

async function seedGallery() {
  const sections = [
    { slug: "algerie", title: "Algérie", description: "Constantine, Alger, le Sahara — nos merveilles locales.", sortOrder: 1 },
    { slug: "turquie", title: "Turquie", description: "Istanbul, Cappadoce, Pamukkale — entre Orient et Occident.", sortOrder: 2 },
    { slug: "tunisie", title: "Tunisie", description: "Sidi Bou Saïd, le Sahara et la Méditerranée.", sortOrder: 3 },
    { slug: "egypte", title: "Égypte", description: "Le Caire, Louxor et les croisières sur le Nil.", sortOrder: 4 },
    { slug: "malaisie", title: "Malaisie", description: "Kuala Lumpur, Batu Caves et les mosquées de Putrajaya.", sortOrder: 5 },
  ];

  const cardsBySection: Record<
    string,
    { title: string; description: string; imageUrl: string; legacySeeds?: string[] }[]
  > = {
    algerie: [
      { title: "Constantine — le pont Sidi M'Cid", description: "La ville des ponts suspendus, perchée sur le Rhumel.", imageUrl: IMG.constantine },
      { title: "Alger — la Blanche", description: "La capitale, entre baie majestueuse et Méditerranée.", imageUrl: IMG.alger },
      { title: "Casbah d'Alger", description: "Les ruelles millénaires de la médina classée UNESCO.", imageUrl: IMG.casbah },
    ],
    turquie: [
      { title: "Istanbul — Sainte-Sophie", description: "Entre Orient et Occident, la ville aux deux continents.", imageUrl: IMG.istanbul },
      { title: "Cappadoce en montgolfière", description: "Survolez les vallées féeriques au lever du soleil.", imageUrl: IMG.cappadoce },
      { title: "Pamukkale", description: "Les terrasses de travertin et leurs eaux thermales.", imageUrl: IMG.pamukkale },
    ],
    tunisie: [
      { title: "Sidi Bou Saïd", description: "Le village bleu et blanc dominant la Méditerranée.", imageUrl: IMG.sidi },
      { title: "Sahara — Douz", description: "Dunes, oasis et nuits sous les étoiles.", imageUrl: IMG.douz },
      { title: "Amphithéâtre d'El Jem", description: "Le plus grand colisée d'Afrique du Nord, classé UNESCO.", imageUrl: IMG.eljem },
    ],
    egypte: [
      { title: "Pyramides de Gizeh", description: "La dernière merveille du monde antique.", imageUrl: IMG.pyramides },
      { title: "Louxor — Temple de Karnak", description: "Le plus vaste ensemble religieux de l'Égypte antique.", imageUrl: IMG.louxor },
      { title: "Felouque sur le Nil", description: "Navigation traditionnelle entre les rives millénaires.", imageUrl: IMG.nil },
    ],
    malaisie: [
      { title: "Kuala Lumpur — Tours Petronas", description: "La capitale moderne entre gratte-ciel et jardins.", imageUrl: IMG.petronas },
      { title: "Grottes de Batu", description: "Le sanctuaire hindou doré au cœur des collines calcaires.", imageUrl: IMG.batu },
      { title: "Mosquée de Putrajaya", description: "La roseraie sur l'eau, joyau de l'architecture malaisienne.", imageUrl: IMG.mosquee },
    ],
  };

  // Cartes de démonstration d'origine (visuels picsum) : remplacées par les
  // visuels locaux. Les jointures section ↔ carte partent en cascade.
  await db
    .delete(galleryCards)
    .where(like(galleryCards.imageUrl, "https://picsum.photos/%"));

  for (const s of sections) {
    await db
      .insert(gallerySections)
      .values({ ...s, published: true })
      .onConflictDoUpdate({
        target: gallerySections.slug,
        set: { title: s.title, description: s.description, sortOrder: s.sortOrder },
      });
  }

  const sectionRows = await db.select({ id: gallerySections.id, slug: gallerySections.slug }).from(gallerySections);
  const sectionId = new Map(sectionRows.map((r) => [r.slug, r.id]));

  for (const [slug, cards] of Object.entries(cardsBySection)) {
    const sid = sectionId.get(slug);
    if (!sid) continue;

    let order = 0;
    for (const c of cards) {
      const existing = await db.select({ id: galleryCards.id }).from(galleryCards).where(eq(galleryCards.title, c.title));
      let cardId = existing[0]?.id;

      if (!cardId) {
        const inserted = await db
          .insert(galleryCards)
          .values({ title: c.title, description: c.description, imageUrl: c.imageUrl, alt: c.title })
          .returning({ id: galleryCards.id });
        cardId = inserted[0].id;
      } else {
        // Rafraîchit l'image locale de démo (l'admin peut la remplacer ensuite).
        await db
          .update(galleryCards)
          .set({ imageUrl: c.imageUrl, description: c.description, alt: c.title })
          .where(eq(galleryCards.id, cardId));
      }

      await db
        .insert(sectionCards)
        .values({ sectionId: sid, cardId, sortOrder: order++ })
        .onConflictDoNothing();
    }
  }

  console.log("✓ Galerie de démonstration prête");
}

async function seedDemoServices() {
  const demo = [
    { title: "Voyages organisés", slug: "voyages-organises", description: "Circuits accompagnés en groupe vers la Turquie, la Tunisie, l'Égypte et la Malaisie.", imageUrl: "/images/sv-organises.webp", price: null, sortOrder: 1 },
    { title: "Voyages sur-mesure", slug: "voyages-sur-mesure", description: "Un itinéraire pensé pour vous : dates, budget, envies — prise en charge complète.", imageUrl: "/images/sv-sur-mesure.webp", price: null, sortOrder: 2 },
    { title: "Hôtellerie", slug: "hotellerie", description: "Réservation d'hôtels sélectionnés, du séjour familial au haut de gamme.", imageUrl: "/images/sv-hotellerie.webp", price: null, sortOrder: 3 },
    { title: "Billetterie", slug: "billetterie", description: "Billets d'avion au meilleur tarif, toutes destinations.", imageUrl: "/images/sv-billetterie.webp", price: null, sortOrder: 4 },
    { title: "Transferts", slug: "transferts", description: "Aéroport ↔ hôtel ↔ ville, véhicules confortables avec chauffeur.", imageUrl: "/images/sv-transferts.webp", price: null, sortOrder: 5 },
    { title: "Assurance voyage", slug: "assurance-voyage", description: "Partez l'esprit tranquille avec nos assurances annulation et santé.", imageUrl: "/images/sv-assurance.webp", price: null, sortOrder: 6 },
  ];

  for (const s of demo) {
    await db
      .insert(services)
      .values({ ...s, published: true })
      .onConflictDoUpdate({
        target: services.slug,
        set: { imageUrl: s.imageUrl, description: s.description, sortOrder: s.sortOrder },
      });
  }
  console.log("✓ Services de démonstration prêts");
}

async function main() {
  console.log("— Seed Üsküdar Travel —");
  await seedSettings();
  await seedAdmin();
  await seedGallery();
  await seedDemoServices();
  console.log("— Terminé —");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
