import { expect, test, type Page } from "@playwright/test";

/**
 * Parcours VISITEUR sur la vitrine publique (sans session admin) :
 * accueil (hero pleine page sous la barre de nav), navigation, galerie,
 * formulaire de contact (envoi e-mail, sans stockage), responsive mobile
 * et bases SEO.
 */

test.describe.configure({ mode: "serial" });

const CONTACT_NAME = "E2E Vitrine Contact";

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

test("accueil : hero pleine page, destinations, services, WhatsApp, images", async ({
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

  // CTA principal WhatsApp + bouton flottant
  await expect(
    page.getByRole("link", { name: "Discuter avec Üsküdar Travel sur WhatsApp" }),
  ).toBeVisible();
  await expect(
    page.locator('a[href^="https://wa.me/213770505715"]').first(),
  ).toBeVisible();

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

  // Les 6 services publiés, chacun lié à WhatsApp
  await expect(page.locator('a[aria-label^="Demander"]')).toHaveCount(6);

  await scrollThroughPage(page);
  await assertNoBrokenImages(page);
  await assertNoHorizontalOverflow(page);
});

test("navigation : les pages publiques affichent leurs contenus", async ({
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

  // Ancre d'une section (lien du panneau hero)
  await page.goto("/galerie#turquie");
  await expect(page.getByRole("heading", { name: "Turquie" })).toBeVisible();

  // Services
  await header.getByRole("link", { name: "Services" }).click();
  await expect(page).toHaveURL(/\/services$/);
  await expect(page.locator('a[aria-label^="Demander"]')).toHaveCount(6);
  await expect(page.getByText("1. On discute")).toBeVisible();

  // À propos : texte officiel du brief
  await header.getByRole("link", { name: "À propos" }).click();
  await expect(page.getByText(/agence de voyage située à Sétif/)).toBeVisible();

  // Contact : formulaire + coordonnées en bas de page d'accueil (section
  // #contact — plus de page dédiée)
  await page.goto("/#contact");
  await expect(page.getByRole("heading", { name: /devis gratuit/ })).toBeVisible();
  await expect(page.locator('a[href^="tel:"]').first()).toBeVisible();
  await expect(page.locator("#vt-name")).toBeVisible();
});

test("contact : validation serveur puis envoi réussi", async ({ page }) => {
  await page.goto("/#contact");

  // Soumission à vide (noValidate) → erreurs de champ renvoyées par l'API
  await page.getByRole("button", { name: /Envoyer ma demande/ }).click();
  await expect(page.getByText("Le nom est requis.")).toBeVisible();
  await expect(page.getByText("Adresse e-mail invalide.")).toBeVisible();

  // Envoi valide → écran de succès ; la demande part par e-mail
  // (notification), il n'y a plus de stockage côté admin.
  await page.locator("#vt-name").fill(CONTACT_NAME);
  await page.locator("#vt-email").fill("vitrine@e2e.dz");
  await page.locator("#vt-phone").fill("0555999888");
  await page
    .locator("#vt-message")
    .fill(
      "Bonjour, je souhaite un devis pour un séjour en Turquie pour 4 personnes (test E2E vitrine).",
    );
  await page.getByRole("button", { name: /Envoyer ma demande/ }).click();
  await expect(page.getByText("Message envoyé !")).toBeVisible();
});

test("mobile : menu, hero et galerie sans débordement", async ({ page }) => {
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

  expect((await page.request.get("/robots.txt")).status()).toBe(200);
  expect((await page.request.get("/sitemap.xml")).status()).toBe(200);
});
