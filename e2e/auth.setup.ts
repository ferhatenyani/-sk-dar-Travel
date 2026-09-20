import { expect, test as setup } from "@playwright/test";

const AUTH_FILE = "playwright/.auth/admin.json";

/**
 * Projet « setup » : connecte l'administrateur une seule fois et sauvegarde
 * la session (storageState) réutilisée par le projet « admin ».
 */
setup("connexion administrateur (setup)", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL ?? "");
  await page.getByLabel("Mot de passe", { exact: true }).fill(process.env.ADMIN_PASSWORD ?? "");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/admin");
  await expect(
    page.getByRole("heading", { name: "Administration", exact: true }),
  ).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
