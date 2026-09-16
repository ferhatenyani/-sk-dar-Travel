import { config as loadEnv } from "dotenv";

// Charge .env.local pour BETTER_AUTH_URL / ADMIN_* (le serveur lancé par
// webServer lit aussi .env.local — les deux doivent pointer sur :3000).
loadEnv({ path: ".env.local" });

import { defineConfig, type PlaywrightTestConfig } from "@playwright/test";

const AUTH_FILE = "playwright/.auth/admin.json";

const base = {
  baseURL: "http://localhost:3000",
  // Chromium via le Chrome système : pas de téléchargement de navigateur.
  channel: "chrome" as const,
  viewport: { width: 1280, height: 800 },
};

const pwConfig: PlaywrightTestConfig = {
  testDir: "./e2e",
  // Suites séquentielles : les tests admin partagent un état (données E2E).
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  projects: [
    {
      // Connexion une fois + sauvegarde de la session (storageState).
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: { ...base },
    },
    {
      // Visiteur sans session : garde de route + pages de récupération.
      name: "invite",
      testMatch: /public\.spec\.ts/,
      use: { ...base, storageState: { cookies: [], origins: [] } },
    },
    {
      // Vitrine publique : parcours visiteur complet (formulaire inclus).
      // Doit s'exécuter avant « admin », qui vérifie le message de contact.
      name: "vitrine",
      testMatch: /vitrine\.spec\.ts/,
      use: { ...base, storageState: { cookies: [], origins: [] } },
    },
    {
      // Administrateur connecté : dépend du projet setup.
      name: "admin",
      testMatch: /admin\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...base, storageState: AUTH_FILE },
    },
  ],
  webServer: {
    command: "pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 120_000,
  },
};

export default pwConfig;
