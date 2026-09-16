import { config } from "dotenv";

// Charge .env.local (puis .env en secours). Next.js lit ces fichiers nativement ;
// ce module ne sert que pour les scripts hors Next (seed, drizzle-kit, tsx).
// À importer EN PREMIER dans tout script qui lit DATABASE_URL.
config({ path: ".env.local" });
config({ path: ".env" });
