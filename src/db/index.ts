import "./env";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL manquant — créez .env.local (voir .env.example).");
}

// prepare: false — requis par le pooler Neon (PgBouncer en mode transaction).
// idle_timeout / max_lifetime — recycle les connexions avant que le pooler
// Neon ne les ferme, sinon la première requête sur un socket mort échoue.
const client = postgres(connectionString, {
  prepare: false,
  idle_timeout: 20,
  max_lifetime: 60 * 5,
});

export const db = drizzle(client, { schema });

export { schema };
