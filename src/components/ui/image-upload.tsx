"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";

import { cn } from "@/lib/cn";
import { isUploadedImage } from "@/lib/images";
import { uploadImage } from "@/lib/upload-image";
import { IconImage, IconX } from "@/components/ui/icons";

/**
 * Upload d'image : compression WebP côté client (économie de stockage) puis
 * envoi vers le serveur de l'application (`/api/uploads`). Se lie à un
 * <input type="hidden"> pour être lu par une Server Action via FormData.
 */
export function ImageUpload({
  name,
  defaultValue = "",
  label = "Image",
  hint,
}: {
  name: string;
  defaultValue?: string;
  label?: string;
  hint?: string;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const busy = compressing;

  async function onPickFile(file: File) {
    setError(null);
    setCompressing(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/webp",
      });
      // Le contenu est désormais du WebP : le nom suit (sinon le fichier
      // garde l'extension d'origine, trompeuse).
      const webpName = `${file.name.replace(/\.[^.]+$/, "")}.webp`;
      const url = await uploadImage(new File([compressed], webpName, { type: "image/webp" }));
      setUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de traiter cette image.");
      setCompressing(false);
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>

      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="group relative inline-block">
          <Image
            src={url}
            alt="Aperçu de l'image téléversée"
            width={160}
            height={120}
            unoptimized={isUploadedImage(url)}
            className="h-[120px] w-[160px] rounded-lg border border-line object-cover"
          />
          <button
            type="button"
            onClick={() => setUrl("")}
            aria-label="Retirer l'image"
            className="absolute -right-2 -top-2 inline-flex size-7 items-center justify-center rounded-full border border-line bg-surface text-ink-secondary shadow-sm transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <IconX className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex h-[120px] w-[160px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong bg-page text-sm text-ink-muted transition-colors",
            "hover:border-navy-border hover:bg-navy-soft/50 hover:text-navy",
            "disabled:pointer-events-none disabled:opacity-60",
          )}
        >
          <IconImage className="size-6" />
          {busy ? "Traitement…" : "Choisir une image"}
        </button>
      )}

      {busy && (
        <div className="mt-2 h-1 w-40 overflow-hidden rounded-full bg-line">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-navy" />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onPickFile(file);
          e.target.value = "";
        }}
      />

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
      {!error && hint && <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
