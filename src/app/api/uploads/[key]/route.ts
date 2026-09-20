import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

/** Types servis, avec l'en-tête Content-Type correspondant. */
const CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
};

/**
 * Restitution des images téléversées : `/api/uploads/<clé>` lit le disque à
 * chaque requête — volontairement dynamique, car `next start` ne sert pas
 * les fichiers ajoutés dans `public/` après le démarrage (les uploads d'un
 * run resteraient sinon en 404 jusqu'au redémarrage).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;

  // Clé stricte : aucun séparateur de chemin, extension connue.
  const match = /^([a-z0-9-]+)\.(webp|png|jpg|gif)$/.exec(key);
  if (!match) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const ext = match[2];
  try {
    const body = await readFile(path.join(process.cwd(), "public", "uploads", key));
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext],
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }
}
