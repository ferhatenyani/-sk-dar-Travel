import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const MAX_SIZE = 2_000_000; // 2 Mo (les images sortent compressées ≤ 0,8 Mo)

const EXTENSIONS: Record<string, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
};

/**
 * Réception des images téléversées (couvertures, galeries, logo…) : écriture
 * sur le disque du serveur dans `public/uploads`, servies ensuite par
 * l'application elle-même (même origine). UploadThing retiré : son CDN de
 * restitution (ufs.sh / utfs.io) était inaccessible depuis le réseau de
 * l'agence, laissant des images cassées malgré des envois réussis.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const received = form.get("file");
    if (received instanceof File) file = received;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (!file) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Seules les images sont acceptées." },
      { status: 400 },
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Image trop volumineuse (2 Mo max après compression)." },
      { status: 400 },
    );
  }

  const ext = EXTENSIONS[file.type] ?? "webp";
  const key = `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, key), Buffer.from(await file.arrayBuffer()));

  // Servie par la route dynamique /api/uploads/[key] : `next start` ne sert
  // pas les fichiers ajoutés dans public/ après le démarrage.
  return NextResponse.json({ url: `/api/uploads/${key}` });
}
