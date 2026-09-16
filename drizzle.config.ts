import { config } from "dotenv";

// Charge .env.local (puis .env en secours) : drizzle-kit / tsx ne lisent pas
// automatiquement les fichiers d'env de Next.js.
config({ path: ".env.local" });
config({ path: ".env" });

import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL manquant — créez .env.local (voir .env.example).");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
