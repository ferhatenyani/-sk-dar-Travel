/**
 * Nettoyage des artifacts E2E avant une passe de tests.
 * Garantit une baseline déterministe même après un run interrompu.
 * Appelé par le script pnpm test:e2e.
 */
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
  user,
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

  console.log("baseline E2E prête");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
