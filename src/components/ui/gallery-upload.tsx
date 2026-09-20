"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";

import { cn } from "@/lib/cn";
import { useUploadThing } from "@/lib/uploadthing";
import { IconImage, IconX } from "@/components/ui/icons";

/**
 * Upload multi-images (galerie d'un voyage organisé) : même pipeline que
 * `ImageUpload` — compression WebP côté client puis envoi UploadThing, un
 * fichier à la fois. Se lie à un <input type="hidden"> (une URL par ligne)
 * lu par une Server Action via FormData.
 */
export function GalleryUpload({
  name,
  defaultValue = [],
  max = 6,
  label = "Galerie",
  hint,
}: {
  name: string;
  defaultValue?: string[];
  max?: number;
  label?: string;
  hint?: string;
}) {
  const [urls, setUrls] = useState<string[]>(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing("imageUploader");
  const busy = processing || isUploading;
  const atMax = urls.length >= max;

  async function onPickFiles(files: FileList) {
    setError(null);
    setProcessing(true);
    try {
      const room = max - urls.length;
      const picked = Array.from(files).slice(0, Math.max(0, room));
      for (const file of picked) {
        // Mêmes réglages que ImageUpload : 0,8 Mo / 1920 px / WebP.
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/webp",
        });
        const res = await startUpload([compressed]);
        const uploaded = res?.[0];
        const url = uploaded?.ufsUrl ?? uploaded?.serverData?.url ?? "";
        if (!url) {
          setError("Upload terminé mais aucune URL reçue.");
          break;
        }
        setUrls((prev) => (prev.length >= max ? prev : [...prev, url]));
      }
    } catch {
      setError("Impossible de traiter ces images.");
    }
    setProcessing(false);
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}{" "}
        <span className="font-normal text-ink-muted">
          ({urls.length}/{max})
        </span>
      </span>

      <input type="hidden" name={name} value={urls.join("\n")} />

      <div className="flex flex-wrap gap-2">
        {urls.map((url, index) => (
          <div key={url} className="group relative">
            <Image
              src={url}
              alt={`Photo ${index + 1} de la galerie`}
              width={160}
              height={120}
              className="h-[120px] w-[160px] rounded-lg border border-line object-cover"
            />
            <button
              type="button"
              onClick={() => setUrls((prev) => prev.filter((u) => u !== url))}
              aria-label={`Retirer la photo ${index + 1}`}
              className="absolute -right-2 -top-2 inline-flex size-7 items-center justify-center rounded-full border border-line bg-surface text-ink-secondary shadow-sm transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <IconX className="size-4" />
            </button>
          </div>
        ))}

        {!atMax ? (
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
            {busy ? "Traitement…" : "Ajouter des photos"}
          </button>
        ) : null}
      </div>

      {busy && (
        <div className="mt-2 h-1 w-40 overflow-hidden rounded-full bg-line">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-navy" />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void onPickFiles(e.target.files);
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
