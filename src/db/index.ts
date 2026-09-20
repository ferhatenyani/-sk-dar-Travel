import "./env";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL manquant — créez .env.local (voir .env.example).");
}

// Singleton global : sans lui, le HMR de Turbopack recrée un pool à chaque
// rechargement de module et épuise les connexions Neon (erreurs « Failed
// query » en dev). En production le module n'est évalué qu'une fois.
const globalForDb = globalThis as unknown as {
  __uskludarPostgres?: postgres.Sql;
};

// prepare: false — requis par le pooler Neon (PgBouncer en mode transaction).
// max réduit / idle_timeout / connect_timeout / max_lifetime — pool maîtrisé
// et connexions recyclées avant que le pooler Neon ne les ferme, sinon la
// première requête sur un socket mort échoue.
const client =
  globalForDb.__uskludarPostgres ??
  postgres(connectionString, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 15,
    max_lifetime: 60 * 5,
  });
if (process.env.NODE_ENV !== "production") {
  globalForDb.__uskludarPostgres = client;
}

export const db = drizzle(client, { schema });

export { schema };
