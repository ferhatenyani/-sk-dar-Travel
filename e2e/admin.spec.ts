import { expect, test } from "@playwright/test";

/**
 * Parcours ADMINISTRATEUR (session injectée via storageState du projet setup).
 * Suite séquentielle : les données de test « E2E » sont supprimées par les
 * tests eux-mêmes ; déconnexion + reconnexion en fin de fichier.
 * Les demandes de voyage du formulaire public atterrissent dans la section
 * « Demandes » — le test dédié s'appuie sur la demande créée par vitrine.spec.
 */

test.describe.configure({ mode: "serial" });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "uskudar.travel19@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const AUTH_FILE = "playwright/.auth/admin.json";
// Nom distinct de la demande créée par vitrine.spec (les deux coexistent).
const DEMANDE_NAME = "E2E Admin Demande";

/** Date future (AAAA-MM-JJ) pour les payloads API. */
function futureDate(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * 86_400_000).toISOString().slice(0, 10);
}

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

/* ——— Tableau de bord ——— */

test("tableau de bord : modules accessibles", async ({ page }) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Administration", exact: true }),
  ).toBeVisible();
  for (const label of ["Demandes", "Services", "Galerie", "Contenus", "Compte"]) {
    await expect(
      page.getByRole("link", { name: label, exact: true }),
    ).toBeVisible();
  }
});

/* ——— Services ——— */

test("services : création, édition puis suppression", async ({ page }) => {
  await page.goto("/admin/services/nouveau");
  await page.getByLabel("Titre").fill("E2E Service");
  await page.getByLabel("Description").fill("Service créé par le test E2E.");
  await page.getByLabel("Prix affiché").fill("Test 1 000 DA");
  await page.getByRole("button", { name: "Créer le service" }).click();
  await page.waitForURL("**/admin/services");

  const row = page.locator("main ul li").filter({ hasText: "E2E Service" });
  await expect(row).toBeVisible();

  await row.getByRole("link", { name: "Modifier E2E Service" }).click();
  await page.waitForURL(/\/admin\/services\/\d+$/);
  await page.getByLabel("Prix affiché").fill("Test 2 000 DA");
  await page.getByRole("button", { name: /Enregistrer/ }).click();
  await expect(page.getByText("Service mis à jour.")).toBeVisible();

  await page.goto("/admin/services");
  const rowToDrop = page.locator("main ul li").filter({ hasText: "E2E Service" });
  await rowToDrop.getByRole("button", { name: "Supprimer E2E Service" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Supprimer", exact: true })
    .click();
  await expect(rowToDrop).toHaveCount(0);
});

/* ——— Galerie : sections ——— */

test("galerie : création puis suppression de section", async ({ page }) => {
  await page.goto("/admin/galerie/sections/nouveau");
  await page.getByLabel("Titre").fill("E2E Section");
  await page.getByRole("button", { name: "Créer la section" }).click();
  await page.waitForURL("**/admin/galerie");

  const row = page.locator("main ul li").filter({ hasText: "E2E Section" });
  await expect(row).toBeVisible();

  await row
    .getByRole("button", { name: "Supprimer la section E2E Section" })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // La suppression d'une section conserve les cartes.
  await expect(dialog.getByText(/ne seront pas supprimées/)).toBeVisible();
  await dialog.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(row).toHaveCount(0);
});

/* ——— Galerie : cartes (upload UploadThing réel) ——— */

test("galerie : carte avec upload, assignation à une section puis suppression", async ({
  page,
}) => {
  await page.goto("/admin/galerie/cartes/nouveau");
  await page.getByLabel("Titre").fill("E2E Carte");
  await page
    .locator('input[type="file"]')
    .setInputFiles({
      name: "e2e-pixel.png",
      mimeType: "image/png",
      buffer: PNG_1PX,
    });
  await expect(
    page.getByRole("img", { name: "Aperçu de l'image téléversée" }),
  ).toBeVisible({ timeout: 45_000 });
  await page
    .getByLabel("Texte alternatif (accessibilité)")
    .fill("Carte de test E2E");
  await page.getByRole("button", { name: "Créer la carte" }).click();
  await page.waitForURL("**/admin/galerie/cartes");
  await expect(page.getByText("E2E Carte").first()).toBeVisible();

  // Assignation à la section « Turquie » (seed) puis retrait
  await page.goto("/admin/galerie/sections/1");
  const checkbox = page.getByRole("checkbox", { name: "E2E Carte" });
  await expect(checkbox).toBeAttached();
  await checkbox.check({ force: true });
  await page.getByRole("button", { name: "Ajouter à la section" }).click();
  const panel = page
    .locator("main section")
    .filter({ hasText: "Cartes de cette section" });
  await expect(panel).toContainText("3 cartes");

  const cardRow = page
    .locator("ul > li")
    .filter({ hasText: "E2E Carte" })
    .filter({ hasText: "Retirer" });
  await expect(cardRow).toBeVisible();
  await cardRow
    .getByRole("button", { name: "Retirer E2E Carte de la section" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Retirer", exact: true })
    .click();
  // L'action serveur + le refresh peuvent prendre quelques secondes (Neon).
  await expect(cardRow).toHaveCount(0, { timeout: 30_000 });

  // Suppression de la carte
  await page.goto("/admin/galerie/cartes");
  const listRow = page.locator("li").filter({ hasText: "E2E Carte" });
  await listRow
    .getByRole("button", { name: "Supprimer la carte E2E Carte" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Supprimer", exact: true })
    .click();
  await expect(listRow).toHaveCount(0);
});

/* ——— Contenus ——— */

test("contenus : édition enregistrée et persistée", async ({ page }) => {
  await page.goto("/admin/contenus");
  const about = page.locator("#aboutText");
  const initial = await about.inputValue();

  await about.fill(initial + " [E2E]");
  await page
    .getByRole("button", { name: "Enregistrer les modifications" })
    .click();
  await expect(page.getByText("Modifications enregistrées.")).toBeVisible();

  await page.reload();
  await expect(page.locator("#aboutText")).toHaveValue(/ \[E2E\]$/);

  await page.locator("#aboutText").fill(initial);
  await page
    .getByRole("button", { name: "Enregistrer les modifications" })
    .click();
  await expect(page.locator("#aboutText")).toHaveValue(initial);
});

/* ——— Compte ——— */

test("compte : changement de mot de passe puis retour à l'original", async ({
  page,
}) => {
  await page.goto("/admin/compte");
  await page.locator("#current-password").fill(ADMIN_PASSWORD);
  await page.locator("#new-password").fill("e2e-temp-pass-123");
  await page.locator("#confirm-password").fill("e2e-temp-pass-123");
  await page.getByRole("button", { name: "Mettre à jour" }).click();
  await expect(page.getByText("Mot de passe mis à jour.")).toBeVisible();
  // changePassword renouvelle la session : met à jour le storageState partagé.
  await page.context().storageState({ path: AUTH_FILE });

  await page.locator("#current-password").fill("e2e-temp-pass-123");
  await page.locator("#new-password").fill(ADMIN_PASSWORD);
  await page.locator("#confirm-password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Mettre à jour" }).click();
  await expect(page.locator("#current-password")).toHaveValue("");
  await page.context().storageState({ path: AUTH_FILE });
});

/* ——— Demandes de voyage ——— */

test("demandes : liste, détail, statut puis suppression", async ({
  page,
  request,
}) => {
  // Crée une demande de référence via l'API publique (suite autonome),
  // avec une offre concernée (multi-offres : tableau de slugs).
  const created = await request.post("/api/demandes", {
    data: {
      fullName: DEMANDE_NAME,
      phone: "0555999888",
      email: "vitrine@e2e.dz",
      destinations: ["turquie"],
      offers: ["voyages-organises"],
      departureCity: "Sétif",
      departureDate: futureDate(42),
      adults: 3,
      children: 0,
      tripType: "famille",
      budget: "100k-200k",
      accommodation: "hotel-4",
      notes: "Séjour en Turquie pour 4 personnes (test E2E vitrine).",
    },
  });
  expect(created.status()).toBe(200);

  // Elle apparaît dans la liste admin, avec le badge multi-offres
  await page.goto("/admin/demandes");
  const row = page.locator("main ul li").filter({ hasText: DEMANDE_NAME });
  await expect(row).toBeVisible();
  await expect(row).toContainText("Turquie");
  await expect(row).toContainText("Nouvelle");
  await expect(row).toContainText("1 offre");

  // Détail : toutes les données du formulaire, dont le titre de l'offre
  await row.getByRole("link").first().click();
  await page.waitForURL(/\/admin\/demandes\/\d+$/);
  await expect(page.getByText("0555999888")).toBeVisible();
  await expect(page.getByText("Voyages organisés")).toBeVisible();
  await expect(page.getByText("Séjour en famille")).toBeVisible();
  await expect(page.getByText("100 000 à 200 000 DA")).toBeVisible();

  // Statut (dropdown 100 % maison) + note interne
  await page.locator("#status").click();
  await page.getByRole("option", { name: "En cours" }).click();
  await page.locator("#adminNote").fill("Devis envoyé (E2E).");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Demande mise à jour.")).toBeVisible();
  // Rechargement : assertion sur l'état persisté en base (pas sur l'UI optimiste)
  await page.reload();
  await expect(page.locator("#status")).toContainText("En cours");

  // Suppression (window.confirm : à accepter explicitement)
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Supprimer la demande" }).click();
  await page.waitForURL("**/admin/demandes");
  await expect(page.locator("main ul li").filter({ hasText: DEMANDE_NAME })).toHaveCount(0);
});

/* ——— API demandes (stockage en base) ——— */

test("API demandes : validation, honeypot et enregistrement", async ({
  request,
}) => {
  const payload = {
    fullName: "E2E API Contact",
    phone: "0555000000",
    email: "e2e@contact.dz",
    destinations: ["turquie"],
    offers: ["voyages-organises"],
    departureCity: "Sétif",
    departureDate: futureDate(30),
    adults: 2,
    children: 1,
    tripType: "famille",
    budget: "50k-100k",
    accommodation: "hotel-4",
    notes: "Payload de test E2E pour l'API des demandes.",
  };

  // Requête invalide → 400 avec erreurs de champ
  const invalid = await request.post("/api/demandes", {
    data: { fullName: "X", email: "pas-un-email" },
  });
  expect(invalid.status()).toBe(400);
  const invalidBody = await invalid.json();
  expect(invalidBody.fieldErrors.email).toBeTruthy();

  // Honeypot rempli → faux succès, rien n'est enregistré
  const spam = await request.post("/api/demandes", {
    data: { ...payload, website: "http://spam.example" },
  });
  expect(spam.status()).toBe(200);

  // Demande légitime → acceptée et stockée en base
  const valid = await request.post("/api/demandes", { data: payload });
  expect(valid.status()).toBe(200);

  // Destination inconnue → rejetée même si le reste est valide
  const bogus = await request.post("/api/demandes", {
    data: { ...payload, destinations: ["atlantide"] },
  });
  expect(bogus.status()).toBe(400);

  // Offre inconnue → ignorée silencieusement (le reste est enregistré)
  const unknownOffer = await request.post("/api/demandes", {
    data: { ...payload, fullName: "E2E API Offre Inconnue", offers: ["atlantide"] },
  });
  expect(unknownOffer.status()).toBe(200);
});

/* ——— Admin responsive (mobile) ——— */

test("interface admin : menu mobile fonctionnel", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin");
  const burger = page.getByRole("button", { name: "Ouvrir le menu" });
  await expect(burger).toBeVisible();
  await burger.click();
  const servicesLink = page.getByRole("link", { name: "Services", exact: true });
  await expect(servicesLink).toBeVisible();
  await servicesLink.click();
  await page.waitForURL("**/admin/services");
  await expect(
    page.getByRole("heading", { name: "Services", exact: true }),
  ).toBeVisible();
});

/* ——— Déconnexion (fin de suite) ——— */

test("déconnexion : session révoquée, accès admin bloqué", async ({ page }) => {
  await page.goto("/admin");
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await page.waitForURL("**/admin/login");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("reconnexion avec le mot de passe d'origine (revert vérifié)", async ({
  page,
}) => {
  // Le test précédent a révoqué la session du storageState : on repart d'un
  // contexte sans cookie pour éviter la boucle proxy login ↔ admin.
  await page.context().clearCookies();
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Mot de passe", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/admin");
  await expect(
    page.getByRole("heading", { name: "Administration", exact: true }),
  ).toBeVisible();
  // Session revalidée dans le storageState : le projet « responsive », qui
  // passe après celui-ci, en dépend pour ses passages admin.
  await page.context().storageState({ path: AUTH_FILE });
});
