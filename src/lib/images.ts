/**
 * Les images téléversées passent par UploadThing (ufs.sh / utfs.io) : elles
 * sortent déjà compressées en WebP côté client (≤ 0,8 Mo, ≤ 1920 px) — on
 * les sert telles quelles, sans repasser par l'optimiseur `next/image`,
 * dont le téléchargement en amont peut expirer sur ces hôtes (504, aperçus
 * cassés côté admin comme côté vitrine).
 */
export function isUploadedImage(src: string | null | undefined): boolean {
  return Boolean(src && (/\.ufs\.sh\//.test(src) || /\.utfs\.io\//.test(src)));
}
