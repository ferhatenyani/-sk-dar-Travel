"use client";

/**
 * Envoi d'une image vers la route `/api/uploads` (stockage sur le serveur de
 * l'application). L'image arrive déjà compressée en WebP côté client — voir
 * ImageUpload / GalleryUpload.
 */
export async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body });
  if (res.status === 401) {
    throw new Error("Session expirée — reconnectez-vous.");
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Échec de l'upload. Réessayez.");
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}
