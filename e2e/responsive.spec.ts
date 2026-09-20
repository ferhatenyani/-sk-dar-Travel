import { expect, test, type Page } from "@playwright/test";

/**
 * MATRICE RESPONSIVE — balayage systématique des pages publiques et admin
 * sur une gamme de viewports : standards (mobile → 4K) et bornes sur mesure
 * utilisées par le code (min-[400px], min-[480px], sm/lg, et la médiatype
 * custom max-height:520px du hero en paysage).
 *
 * Chaque passage vérifie : aucun débordement horizontal, header visible,
 * zéro image cassée (pages publiques) et présence du CTA « Composer ».
 */

test.describe.configure({ mode: "serial" });

type VP = { width: number; height: number; label: string };

/** Viewports principaux : balayage de toutes les pages. */
const KEY_VIEWPORTS: VP[] = [
  { width: 320, height: 700, label: "mobile XL" },
  { width: 390, height: 844, label: "iPhone" },
  { width: 768, height: 1024, label: "tablette" },
  { width: 1024, height: 768, label: "laptop étroit" },
  { width: 1440, height: 900, label: "desktop" },
];

/** Bornes custom : exactement sur les seuils du code + paysages bas. */
const BOUNDARY_VIEWPORTS: VP[] = [
  { width: 399, height: 850, label: "borne min-[400px] −1" },
  { width: 400, height: 850, label: "borne min-[400px]" },
  { width: 479, height: 900, label: "borne min-[480px] −1" },
  { width: 480, height: 900, label: "borne min-[480px]" },
  { width: 639, height: 950, label: "borne sm −1" },
  { width: 640, height: 950, label: "borne sm" },
  { width: 1023, height: 800, label: "borne lg −1" },
  { width: 1920, height: 1080, label: "full HD" },
  // Paysage téléphone : déclenche @media(max-height:520px) dans le hero.
  { width: 844, height: 390, label: "paysage max-height 520" },
  { width: 667, height: 375, label: "paysage compact" },
];

const PUBLIC_PAGES = [
  "/",
  "/services",
  "/services/voyages-organises",
  "/voyages-organises",
  "/voyages-organises?voyage=cappadoce-istanbul-8-jours",
  "/destinations/turquie",
  "/galerie",
  "/a-propos",
];

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `débordement horizontal de ${overflow}px`).toBeLessThanOrEqual(1);
}

for (const vp of KEY_VIEWPORTS) {
  test.describe(`matrice ${vp.width}×${vp.height} (${vp.label})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const path of PUBLIC_PAGES) {
      test(`vitrine ${path} : layout et images`, async ({ page }) => {
        await page.goto(path);
        await assertNoHorizontalOverflow(page);
        await expect(page.locator("header").first()).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Composer mon voyage" }).first(),
        ).toBeVisible();

        // Aucune image cassée (hors admin, où il n'y a pas de photos de contenu)
        const broken = await page.evaluate(() =>
          Array.from(document.querySelectorAll("img"))
            .filter((img) => img.complete && img.naturalWidth === 0)
            .map((img) => img.getAttribute("src") ?? "?"),
        );
        expect(broken, `images cassées : ${broken.join(", ")}`).toEqual([]);
      });
    }

    test("admin : liste des demandes", async ({ page }) => {
      await page.goto("/admin/demandes");
      await expect(
        page.getByRole("heading", { name: "Demandes de voyage" }),
      ).toBeVisible();
      await assertNoHorizontalOverflow(page);
    });
  });
}

for (const vp of BOUNDARY_VIEWPORTS) {
  test.describe(`bornes ${vp.width}×${vp.height} (${vp.label})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("accueil : aucun débordement", async ({ page }) => {
      await page.goto("/");
      await assertNoHorizontalOverflow(page);
    });

    test("détail destination : aucun débordement", async ({ page }) => {
      await page.goto("/destinations/turquie");
      await assertNoHorizontalOverflow(page);
    });
  });
}

test.describe("panneau composer : smoke mobile + paysage", () => {
  for (const vp of [
    { width: 320, height: 700, label: "mobile XL" },
    { width: 390, height: 844, label: "iPhone" },
  ]) {
    test.describe(`panneau ${vp.width}×${vp.height}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test("feuille basse utilisable", async ({ page }) => {
        await page.goto("/");
        await page
          .getByRole("region", { name: "Destinations à la une" })
          .getByRole("button", { name: /Composer mon voyage/ })
          .click();

        const panel = page.getByRole("dialog", { name: "Composer mon voyage" });
        await expect(panel).toBeVisible();
        await expect(panel.locator("#vt-modal-fullName")).toBeVisible();
        await assertNoHorizontalOverflow(page);

        await panel.getByRole("button", { name: "Fermer", exact: true }).click();
        await expect(panel).toHaveCount(0);
        // Scroll-lock du body relâché après démontage
        await expect
          .poll(() => page.evaluate(() => document.body.style.overflow))
          .toBe("");
      });

      test("feuille : scroll interne réel (molette)", async ({ page }) => {
        await page.goto("/");
        await page
          .getByRole("region", { name: "Destinations à la une" })
          .getByRole("button", { name: /Composer mon voyage/ })
          .click();

        const panel = page.getByRole("dialog", { name: "Composer mon voyage" });
        await expect(panel).toBeVisible();

        // Étape 2 (plus haute que la feuille) pour avoir de la matière à défiler
        await panel.locator("#vt-modal-fullName").fill("E2E Scroll");
        await panel.locator("#vt-modal-phone").fill("0555000011");
        await panel.locator("#vt-modal-email").fill("scroll@e2e.dz");
        await panel.getByRole("button", { name: "Suivant", exact: true }).click();
        await page.waitForFunction(
          () =>
            Promise.all(document.getAnimations().map((a) => a.finished)).then(
              () => true,
            ),
          { timeout: 10_000 },
        );

        // La molette au-dessus du formulaire doit faire défiler le contenu
        // interne (data-lenis-prevent), pas la page derrière.
        await panel.locator("#vt-modal-departureCity").hover();
        const before = await panel
          .locator("[data-lenis-prevent]")
          .evaluate((el) => el.scrollTop);
        await page.mouse.wheel(0, 400);
        await page.waitForTimeout(400);
        const after = await panel
          .locator("[data-lenis-prevent]")
          .evaluate((el) => el.scrollTop);
        expect(after).toBeGreaterThan(before);
      });
    });
  }

  test("paysage 844×390 : le CTA fait défiler vers le formulaire intégré", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto("/");
    await page
      .getByRole("region", { name: "Destinations à la une" })
      .getByRole("button", { name: /Composer mon voyage/ })
      .click();
    // ≥ sm : plus de feuille — le bouton emmène au formulaire de la page
    await expect(page.locator("#vt-form-fullName")).toBeInViewport();
    await expect(page.getByRole("dialog", { name: "Composer mon voyage" })).toHaveCount(0);
  });

  test("feuille basse (390×844) : glisser vers le bas ferme proprement", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page
      .getByRole("region", { name: "Destinations à la une" })
      .getByRole("button", { name: /Composer mon voyage/ })
      .click();

    const panel = page.getByRole("dialog", { name: "Composer mon voyage" });
    await expect(panel).toBeVisible();

    // Glissement vers le bas depuis la poignée (> seuil 90 px) → fermeture.
    // Attendre la fin de l'animation d'entrée : pendant la transition, la
    // poignée est encore translatée et le geste partirait à côté.
    await page.waitForFunction(
      () =>
        Promise.all(document.getAnimations().map((a) => a.finished)).then(
          () => true,
        ),
      { timeout: 10_000 },
    );
    const handle = panel.locator("[data-sheet-handle]");
    const box = await handle.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      box!.x + box!.width / 2,
      box!.y + box!.height / 2 + 150,
      { steps: 6 },
    );
    await page.mouse.up();

    await expect(panel).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .toBe("");

    // Re-clic : réouverture propre (wizard remis à zéro)
    await page
      .getByRole("region", { name: "Destinations à la une" })
      .getByRole("button", { name: /Composer mon voyage/ })
      .click();
    await expect(panel).toBeVisible();
    await expect(panel.locator("#vt-modal-fullName")).toHaveValue("");
    await panel.getByRole("button", { name: "Fermer", exact: true }).click();
    await expect(panel).toHaveCount(0);
  });
});
