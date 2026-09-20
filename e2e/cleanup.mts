/**
 * Nettoyage des artifacts E2E avant une passe de tests.
 * Garantit une baseline déterministe même après un run interrompu.
 * Appelé par le script pnpm test:e2e.
 */
import { readdir, unlink } from "node:fs/promises";
import path from "node:path";

import "../src/db/env";
import { eq, like } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

import { db } from "../src/db/index";
import {
  account,
  galleryCards,
  gallerySections,
  services,
  siteSettings,
  tripRequests,
  user,
  voyages,
} from "../src/db/schema";

const TEXTE =
  "Üsküdar Travel est une agence de voyage située à Sétif proposant des voyages " +
  "organisés et sur-mesure (Algérie, Turquie, Tunisie, Égypte, Malaisie), hôtellerie, " +
  "billetterie, transferts et assurance. Prise en charge complète pour des vacances " +
  "et séjours sereins en famille, en groupe.";

async function main() {
  // Données créées par les tests E2E
  await db.delete(galleryCards).where(like(galleryCards.title, "E2E%"));
  await db.delete(gallerySections).where(like(gallerySections.slug, "e2e-%"));
  await db.delete(services).where(like(services.slug, "e2e-service%"));
  await db.delete(voyages).where(like(voyages.slug, "e2e-voyage%"));
  // Demandes de voyage de test (formulaire public + API)
  await db.delete(tripRequests).where(like(tripRequests.fullName, "E2E%"));

  // Textes éventuellement marqués « [E2E] » par les tests
  const [settings] = await db
    .select({ id: siteSettings.id })
    .from(siteSettings)
    .where(eq(siteSettings.id, 1))
    .limit(1);
  if (settings) {
    await db
      .update(siteSettings)
      .set({
        heroText: TEXTE,
        aboutText: TEXTE,
      })
      .where(eq(siteSettings.id, 1));
  }

  // Réaligne le mot de passe admin sur ADMIN_PASSWORD (si un run est mort
  // entre le changement et le revert).
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const [admin] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);
    if (admin) {
      await db
        .update(account)
        .set({ password: await hashPassword(password) })
        .where(eq(account.userId, admin.id));
    }
  }

  // Fichiers téléversés orphelins (public/uploads) : on garde ceux encore
  // référencés par une ligne en base, on supprime le reste (uploads de test
  // et fichiers abandonnés par un run interrompu).
  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const files = await readdir(uploadsDir);
    const rows = await Promise.all([
      db.select({ url: services.imageUrl }).from(services),
      db.select({ url: voyages.imageUrl }).from(voyages),
      db.select({ url: galleryCards.imageUrl }).from(galleryCards),
      db.select({ url: siteSettings.heroImageUrl }).from(siteSettings),
      db.select({ url: siteSettings.logoUrl }).from(siteSettings),
    ]);
    const referenced = new Set(
      rows
        .flat()
        .map((r) => r.url)
        .filter((u): u is string => Boolean(u))
        // URLs stockées sous /api/uploads/<clé> → clé = nom de fichier.
        .map((u) => u.replace(/^\/api\/uploads\//, "").replace(/^\/uploads\//, "")),
    );
    let removed = 0;
    for (const file of files) {
      if (referenced.has(file)) continue;
      await unlink(path.join(uploadsDir, file));
      removed += 1;
    }
    if (removed > 0) console.log(`${removed} fichier(s) orphelin(s) supprimé(s) de public/uploads`);
  } catch {
    // public/uploads absent : rien à nettoyer.
  }

  console.log("baseline E2E prête");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
