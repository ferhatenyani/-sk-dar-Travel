import { expect, test } from "@playwright/test";

/**
 * Parcours SANS session (visiteur non authentifié) :
 * garde de route, pages de récupération de mot de passe, vitrine placeholder.
 */

test.describe.configure({ mode: "serial" });

test("redirection vers /admin/login si non authentifié", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(
    page.getByRole("heading", { name: "Espace administrateur" }),
  ).toBeVisible();
});

test("les pages de récupération restent accessibles sans session", async ({
  page,
}) => {
  await page.goto("/admin/mot-de-passe-oublie");
  await expect(
    page.getByRole("heading", { name: "Mot de passe oublié" }),
  ).toBeVisible();

  await page.goto("/admin/reinitialiser-mot-de-passe");
  await expect(page.getByText(/Lien invalide ou expiré/)).toBeVisible();
});

test("échec de connexion avec un mauvais mot de passe", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL ?? "");
  await page.getByLabel("Mot de passe").fill("mauvais-mot-de-passe");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByText("Email ou mot de passe incorrect.")).toBeVisible();
});

test("mot de passe oublié : demande de lien", async ({ page }) => {
  await page.goto("/admin/mot-de-passe-oublie");
  await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL ?? "");
  await page.getByRole("button", { name: "Recevoir le lien" }).click();
  await expect(page.getByText(/Si un compte existe pour cet e-mail/)).toBeVisible();
});

test("pages publiques : la vitrine reste accessible sans session", async ({
  page,
}) => {
  // Balayage léger : le parcours complet vitrine vit dans vitrine.spec.ts.
  for (const path of ["/", "/a-propos", "/services", "/galerie", "/contact"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});
