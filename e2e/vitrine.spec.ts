import { expect, test, type Page } from "@playwright/test";

/**
 * Parcours VISITEUR sur la vitrine publique (sans session admin) :
 * accueil (hero + panneau « Composer mon voyage »), pages détail
 * offre/destination, formulaire de demande de devis (stocké côté admin),
 * responsive mobile et bases SEO.
 */

test.describe.configure({ mode: "serial" });

const DEMANDE_NAME = "E2E Vitrine Contact";

/** Aucune image cassée (src inchargées avec naturalWidth = 0). */
async function assertNoBrokenImages(page: Page) {
  const broken = await page.evaluate(() =>
    Array.from(document.querySelectorAll("img"))
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.getAttribute("src") ?? "src inconnu"),
  );
  expect(broken, `images cassées : ${broken.join(", ")}`).toEqual([]);
}

/** Pas de défilement horizontal parasite. */
async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `débordement horizontal de ${overflow}px`).toBeLessThanOrEqual(1);
}

async function scrollThroughPage(page: Page) {
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await page.waitForLoadState("networkidle");
}

test("accueil : hero, destinations, services, aucun lien WhatsApp/email", async ({
  page,
}) => {
  await page.goto("/");

  // Titre du hero piloté par le CMS
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Üsküdar Travel",
  );

  // Barre de navigation flottante : lien actif en pilule cobalt
  const header = page.locator("header");
  await expect(
    header.getByRole("link", { name: "Accueil", exact: true }),
  ).toHaveClass(/bg-cobalt/);

  // Aucune trace WhatsApp / e-mail sur la page
  await expect(page.locator('a[href^="https://wa.me"], a[href^="mailto:"]')).toHaveCount(0);
  await expect(page.getByText(/WhatsApp/i)).toHaveCount(0);

  // Carrousel du hero : points de pagination par destination + flèches ;
  // la diapositive suivante affiche un titre « Partez en … »
  await expect(
    page.getByRole("button", { name: "Aller à la destination Turquie" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Destination suivante" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Partez en");
  await expect(
    page.getByRole("button", { name: /le défilement automatique/ }),
  ).toBeVisible();

  // Les 6 services publiés, chacun lié à sa page détail
  await expect(page.locator('a[href^="/services/"]')).toHaveCount(6);

  await scrollThroughPage(page);
  await assertNoBrokenImages(page);
  await assertNoHorizontalOverflow(page);
});

test("composer : scroll vers le formulaire (desktop), feuille pré-cochée (mobile)", async ({
  page,
}) => {
  await page.goto("/");

  // Diapo destination active → la Turquie est pré-cochée dans la feuille
  await page.getByRole("button", { name: "Aller à la destination Turquie" }).click();

  // Desktop : le bouton fait défiler jusqu'au formulaire intégré (pas de panneau)
  await page
    .getByRole("region", { name: "Destinations à la une" })
    .getByRole("button", { name: /Composer mon voyage/ })
    .click();
  await expect(page.locator("#vt-form-fullName")).toBeInViewport();
  await expect(page.getByRole("dialog", { name: "Composer mon voyage" })).toHaveCount(0);

  // Mobile : le même bouton ouvre la feuille basse, destination pré-cochée
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Aller à la destination Turquie" }).click();
  await page
    .getByRole("region", { name: "Destinations à la une" })
    .getByRole("button", { name: /Composer mon voyage/ })
    .click();

  const panel = page.getByRole("dialog", { name: "Composer mon voyage" });
  await expect(panel).toBeVisible();

  // Les destinations vivent à l'étape 2 : coordonnées d'abord (validation
  // par étape), comme dans le parcours réel.
  await panel.locator("#vt-modal-fullName").fill("E2E Preflight");
  await panel.locator("#vt-modal-phone").fill("0555000011");
  await panel.locator("#vt-modal-email").fill("preflight@e2e.dz");
  await panel.getByRole("button", { name: "Suivant", exact: true }).click();
  await expect(
    panel
      .getByRole("group", { name: /Destinations/ })
      .getByRole("button", { name: "Turquie", pressed: true }),
  ).toBeVisible();

  // Fermeture à la croix : démontage complet
  await panel.getByRole("button", { name: "Fermer", exact: true }).click();
  await expect(panel).toHaveCount(0);
});

test("navigation : pages publiques, détail offre et détail destination", async ({
  page,
}) => {
  await page.goto("/");
  const header = page.locator("header");

  // Galerie : les 5 sections thématiques issues du CMS
  await header.getByRole("link", { name: "Galerie" }).click();
  await expect(page).toHaveURL(/\/galerie$/);
  for (const section of ["Algérie", "Turquie", "Tunisie", "Égypte", "Malaisie"]) {
    await expect(page.getByRole("heading", { name: section })).toBeVisible();
  }
  await scrollThroughPage(page);
  await assertNoBrokenImages(page);

  // Services
  await header.getByRole("link", { name: "Services" }).click();
  await expect(page).toHaveURL(/\/services$/);
  await expect(page.getByText("1. Vous décrivez")).toBeVisible();

  // Page détail d'une offre : l'offre est pré-cochée dans le wizard (étape 2)
  await page.locator('a[href="/services/voyages-organises"]').first().click();
  await expect(page).toHaveURL(/\/services\/voyages-organises$/);
  await expect(
    page.getByRole("heading", { name: "Voyages organisés" }),
  ).toBeVisible();
  await page.locator("#vt-service-fullName").fill("E2E Preflight");
  await page.locator("#vt-service-phone").fill("0555000011");
  await page.locator("#vt-service-email").fill("preflight@e2e.dz");
  await page.getByRole("button", { name: "Suivant", exact: true }).click();
  await expect(
    page
      .getByRole("group", { name: /Offres concernées/ })
      .getByRole("button", { name: "Voyages organisés", pressed: true }),
  ).toBeVisible();
  await assertNoBrokenImages(page);

  // Page détail d'une destination : Turquie pré-cochée dans le wizard
  await page.goto("/destinations/turquie");
  await expect(
    page.getByRole("heading", { name: /Partez en Turquie/ }),
  ).toBeVisible();
  await page.locator("#vt-destination-fullName").fill("E2E Preflight");
  await page.locator("#vt-destination-phone").fill("0555000011");
  await page.locator("#vt-destination-email").fill("preflight@e2e.dz");
  await page.getByRole("button", { name: "Suivant", exact: true }).click();
  await expect(
    page
      .getByRole("group", { name: /Destinations/ })
      .getByRole("button", { name: "Turquie", pressed: true }),
  ).toBeVisible();
  await assertNoBrokenImages(page);

  // À propos : texte officiel du brief
  await page.goto("/a-propos");
  await expect(page.getByText(/agence de voyage située à Sétif/)).toBeVisible();

  // Contact : formulaire complet + carte Google + téléphone (accueil)
  await page.goto("/#contact");
  await expect(page.getByRole("heading", { name: /devis gratuit/ })).toBeVisible();
  await expect(page.locator('a[href^="tel:"]').first()).toBeVisible();
  await expect(page.locator('iframe[title^="Carte —"]')).toBeVisible();
  await expect(
    page.locator('a[href*="google.com/maps"]').filter({ hasText: "Sétif" }).first(),
  ).toBeVisible();
  await expect(page.locator("#vt-form-fullName")).toBeVisible();
});

test("devis : validation par étape puis demande enregistrée", async ({ page }) => {
  await page.goto("/#contact");

  // Étape 1 soumise à vide → erreurs de validation bloquantes
  await page.getByRole("button", { name: "Suivant", exact: true }).click();
  await expect(page.getByText("Le nom complet est requis.")).toBeVisible();
  await expect(page.getByText("Adresse e-mail invalide.")).toBeVisible();

  // Étape 1 valide → étape 2
  await page.locator("#vt-form-fullName").fill(DEMANDE_NAME);
  await page.locator("#vt-form-phone").fill("0555999888");
  await page.locator("#vt-form-email").fill("vitrine@e2e.dz");
  await page.getByRole("button", { name: "Suivant", exact: true }).click();

  // Étape 2 : au moins une destination
  await page.getByRole("button", { name: "Suivant", exact: true }).click();
  await expect(page.getByText("Choisissez au moins une destination.")).toBeVisible();
  await page
    .getByRole("group", { name: /Destinations/ })
    .getByRole("button", { name: "Turquie", exact: false })
    .first()
    .click();

  // Calendrier maison : mois suivant, départ le 10, retour le 20
  await page.locator("#vt-form-dates").click();
  const calendar = page.getByRole("dialog", { name: "Choisir les dates du voyage" });
  await calendar.getByRole("button", { name: "Mois suivant" }).click();
  await calendar.getByRole("button", { name: /\b10\b/ }).click();
  await calendar.getByRole("button", { name: /\b20\b/ }).click();
  await expect(calendar).toHaveCount(0); // fermé après la plage complète
  // La flèche d'itinéraire vit dans le libellé accessible (visuel : connecteurs)
  await expect(page.locator("#vt-form-dates")).toHaveAttribute("aria-label", /→/);

  await page.locator("#vt-form-departureCity").fill("Sétif");
  await page.getByRole("button", { name: "Ajouter un adulte" }).click();
  await page.getByRole("button", { name: "Suivant", exact: true }).click();

  // Étape 3 : type, budget (dropdown maison), hébergement, récap, envoi
  await page
    .getByRole("group", { name: /Type de voyage/ })
    .getByRole("button", { name: "En famille" })
    .click();
  await page.locator("#vt-form-budget").click();
  await page.getByRole("option", { name: "100 000 à 200 000 DA" }).click();
  await page
    .getByRole("group", { name: /Hébergement/ })
    .getByRole("button", { name: "Hôtel 4★" })
    .click();
  await page
    .locator("#vt-form-notes")
    .fill("Séjour en Turquie pour 4 personnes (test E2E vitrine).");
  await expect(page.getByText("Récapitulatif", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Confirmer ma demande" }).click();
  await expect(page.getByText("Demande envoyée !")).toBeVisible();
});

test("voyages organisés : accueil → modale détail → wizard pré-rempli", async ({
  page,
}) => {
  // Section accueil : les voyages seedés sont dans le carrousel
  await page.goto("/");
  const voyagesSection = page
    .locator("section")
    .filter({ hasText: "Nos prochains départs en groupe" });
  const card = voyagesSection.getByRole("link", {
    name: /Cappadoce & Istanbul — 8 jours/,
  });
  await expect(card).toBeVisible();

  // Clic sur la carte → page listing ouverte sur la modale du voyage cliqué
  await card.click();
  await expect(page).toHaveURL(/\/voyages-organises\?voyage=cappadoce-istanbul-8-jours$/);
  const modal = page.getByRole("dialog", {
    name: "Voyage organisé : Cappadoce & Istanbul — 8 jours",
  });
  await expect(modal).toBeVisible();
  await expect(modal.getByText("À partir de 189 000 DA")).toBeVisible();
  await expect(modal.getByText("Programme", { exact: true })).toBeVisible();
  await expect(modal.getByText(/J5 – Cappadoce/)).toBeVisible();
  await expect(modal.getByText("Inclus", { exact: true })).toBeVisible();

  // « Sélectionner ce voyage » → wizard pré-rempli (desktop : accueil #contact)
  await modal.getByRole("button", { name: "Sélectionner ce voyage" }).click();
  await expect(modal).toHaveCount(0);
  await expect(page.locator("#vt-form-fullName")).toBeInViewport({ timeout: 20_000 });
  await page.locator("#vt-form-fullName").fill("E2E Vitrine Voyage");
  await page.locator("#vt-form-phone").fill("0555000011");
  await page.locator("#vt-form-email").fill("voyage@e2e.dz");
  await page.getByRole("button", { name: "Suivant", exact: true }).click();
  // Le menu « Voyage organisé » (étape 2) affiche le voyage sélectionné
  await expect(page.locator("#vt-form-voyage")).toContainText(
    "Cappadoce & Istanbul — 8 jours",
  );

  // « Voir plus » : listing complet sans modale, puis ouverture par carte.
  // (Pas de décompte exact : la page est en ISR et peut refléter
  // transientement d'autres lignes du CMS.)
  await page.goto("/");
  await page.getByRole("link", { name: "Voir tous les voyages" }).click();
  await expect(page).toHaveURL(/\/voyages-organises$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const listingCard = page.locator(
    'a[href="/voyages-organises?voyage=cappadoce-istanbul-8-jours"]',
  );
  await expect(listingCard).toBeVisible();
  await listingCard.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("mobile : voyages organisés — modale puis feuille pré-remplie", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/voyages-organises?voyage=caire-mer-rouge-7-jours");
  const modal = page.getByRole("dialog", {
    name: "Voyage organisé : Le Caire & la Mer Rouge — 7 jours",
  });
  await expect(modal).toBeVisible();

  await modal.getByRole("button", { name: "Sélectionner ce voyage" }).click();
  const sheet = page.getByRole("dialog", { name: "Composer mon voyage" });
  await expect(sheet).toBeVisible();
  await sheet.locator("#vt-modal-fullName").fill("E2E Mobile Voyage");
  await sheet.locator("#vt-modal-phone").fill("0555000011");
  await sheet.locator("#vt-modal-email").fill("mobile@e2e.dz");
  await sheet.getByRole("button", { name: "Suivant", exact: true }).click();
  await expect(sheet.locator("#vt-modal-voyage")).toContainText(
    "Le Caire & la Mer Rouge — 7 jours",
  );
  await sheet.getByRole("button", { name: "Fermer", exact: true }).click();
  await expect(sheet).toHaveCount(0);
});

test("mobile : menu, panneau composer et galerie sans débordement", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await assertNoHorizontalOverflow(page);

  const burger = page.getByRole("button", { name: "Ouvrir le menu" });
  await expect(burger).toBeVisible();
  await burger.click();
  await page
    .locator("#vt-mobile-menu")
    .getByRole("link", { name: "Galerie" })
    .click();
  await expect(page).toHaveURL(/\/galerie$/);
  await expect(page.getByRole("heading", { name: "Turquie" })).toBeVisible();

  await scrollThroughPage(page);
  await assertNoBrokenImages(page);
  await assertNoHorizontalOverflow(page);
});

test("SEO : titres, description, canonical, robots et sitemap", async ({
  page,
}) => {
  await page.goto("/services");
  await expect(page).toHaveTitle(/services — Üsküdar Travel/);
  const description = await page
    .locator('meta[name="description"]')
    .getAttribute("content");
  expect((description ?? "").length).toBeGreaterThan(50);

  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");

  // Le sitemap embarque désormais les pages détail publiées
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/services/voyages-organises");
  expect(sitemap).toContain("/destinations/turquie");
  expect(sitemap).toContain("/voyages-organises");
  expect((await page.request.get("/robots.txt")).status()).toBe(200);
});
