import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import postgres from "postgres";

// One-off : aligne la base sur le nouveau schéma sans drizzle-kit push
// (le push interactif exige un TTY). Idempotent.
async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

  const before = await sql`
    select table_name from information_schema.tables where table_schema = 'public'
  `;
  console.log("Tables avant :", before.map((t) => t.table_name).join(", "));

  await sql`
    CREATE TABLE IF NOT EXISTS trip_requests (
      id serial PRIMARY KEY,
      full_name text NOT NULL,
      phone text NOT NULL,
      email text NOT NULL,
      destinations text[] NOT NULL DEFAULT '{}'::text[],
      offers text[] NOT NULL DEFAULT '{}'::text[],
      offer_titles text[] NOT NULL DEFAULT '{}'::text[],
      departure_city text NOT NULL,
      departure_date date NOT NULL,
      return_date date,
      adults integer NOT NULL DEFAULT 1,
      children integer NOT NULL DEFAULT 0,
      trip_type text NOT NULL,
      budget text NOT NULL,
      accommodation text NOT NULL,
      notes text,
      status text NOT NULL DEFAULT 'nouvelle',
      admin_note text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  // Multi-offres : l'ancien single (offer_slug / offer_title) est copié en
  // tableau avant suppression — les demandes existantes restent lisibles.
  await sql`ALTER TABLE trip_requests ADD COLUMN IF NOT EXISTS offers text[] NOT NULL DEFAULT '{}'::text[]`;
  await sql`ALTER TABLE trip_requests ADD COLUMN IF NOT EXISTS offer_titles text[] NOT NULL DEFAULT '{}'::text[]`;
  await sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'trip_requests' AND column_name = 'offer_slug'
      ) THEN
        UPDATE trip_requests
        SET offers = ARRAY[offer_slug], offer_titles = ARRAY[offer_title]
        WHERE offer_slug IS NOT NULL;
      END IF;
    END $$;
  `;
  await sql`ALTER TABLE trip_requests DROP COLUMN IF EXISTS offer_slug`;
  await sql`ALTER TABLE trip_requests DROP COLUMN IF EXISTS offer_title`;

  await sql`ALTER TABLE site_settings DROP COLUMN IF EXISTS whatsapp_number`;
  await sql`ALTER TABLE site_settings DROP COLUMN IF EXISTS email`;

  // Reste de l'ancien formulaire de contact / module « messages », supprimés du code.
  await sql`DROP TABLE IF EXISTS messages CASCADE`;
  await sql`DROP TABLE IF EXISTS contact_messages CASCADE`;

  const after = await sql`
    select table_name from information_schema.tables where table_schema = 'public'
  `;
  console.log("Tables après :", after.map((t) => t.table_name).join(", "));

  await sql.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
