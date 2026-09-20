"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, Users, X } from "lucide-react";

import { cn } from "@/lib/cn";
import { voyageDatesLabel, voyageDurationLabel, voyageProgramLines } from "@/lib/voyages";
import type { VoyagePublic } from "@/lib/voyages";
import { useComposer } from "./composer";

/**
 * Modale de détail d'un voyage organisé (page listing) : photos, prix, dates,
 * programme jour par jour, inclus / non inclus. La CTA « Sélectionner ce
 * voyage » ouvre le wizard « Composer mon voyage » avec le voyage
 * pré-sélectionné (feuille basse sur mobile, accueil #contact sur desktop).
 */
export function VoyageModal({
  voyage,
  onClose,
}: {
  voyage: VoyagePublic;
  onClose: () => void;
}) {
  const { open } = useComposer();
  const closeRef = useRef<HTMLButtonElement>(null);
  const images = [voyage.imageUrl, ...voyage.galleryImages].filter(Boolean);
  const [activeImage, setActiveImage] = useState(0);
  const cover = images[activeImage] ?? "";
  const dates = voyageDatesLabel(voyage.departureDate, voyage.returnDate);
  const duration = voyageDurationLabel(voyage.departureDate, voyage.returnDate);
  const program = voyageProgramLines(voyage.program);

  // Verrou du défilement + fermeture au clavier + focus sur la croix.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => closeRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Voyage organisé : ${voyage.title}`}
      className="fixed inset-0 z-[80] overflow-y-auto"
    >
      {/* Fond : clic = fermeture */}
      <button
        type="button"
        aria-label="Fermer le détail du voyage"
        onClick={onClose}
        className="fixed inset-0 h-full w-full cursor-default bg-night/55 backdrop-blur-sm"
      />

      {/* Panneau : pleine largeur (bord à bord) sur mobile, centré sur sm+ */}
      <div className="relative mx-auto my-3 w-[calc(100%-1.5rem)] max-w-2xl sm:my-[6dvh]">
        <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_24px_64px_-24px_rgba(15,23,42,0.5)]">
          <div
            data-lenis-prevent
            className="max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain sm:max-h-[82dvh]"
          >
            {/* ——— Photo de couverture (cliquable depuis la galerie) ——— */}
            <div className="relative aspect-[16/10] bg-ice">
              {cover ? (
                <Image
                  src={cover}
                  alt={voyage.title}
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, 640px"
                  className="object-cover"
                />
              ) : (
                <span className="grid h-full w-full place-items-center bg-cobalt-soft">
                  <CalendarDays className="h-10 w-10 text-cobalt/50" strokeWidth={1.5} />
                </span>
              )}
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="absolute top-3 right-3 grid h-10 w-10 place-items-center rounded-full border border-white/30 bg-night/40 text-white backdrop-blur-md transition-colors hover:bg-night/70 focus-visible:outline-none focus-visible:outline-offset-2"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Galerie : une seule vignette = pas de sélection */}
            {images.length > 1 ? (
              <div className="vt-no-scrollbar flex gap-2 overflow-x-auto px-5 pt-4 sm:px-8">
                {images.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`Photo ${i + 1} de ${voyage.title}`}
                    aria-pressed={i === activeImage}
                    className={cn(
                      "relative h-14 w-20 shrink-0 overflow-hidden rounded-lg transition-all",
                      i === activeImage
                        ? "ring-2 ring-cobalt ring-offset-2"
                        : "opacity-75 hover:opacity-100",
                    )}
                  >
                    <Image src={url} alt="" fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            ) : null}

            {/* ——— Titre, prix, dates ——— */}
            <div className="px-5 pt-4 sm:px-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-ice bg-white px-3 py-1.5 text-xs font-medium text-night-soft">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                  {dates ?? "Dates à définir avec votre conseiller"}
                </span>
                {duration ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-ice bg-white px-3 py-1.5 text-xs font-medium text-night-soft">
                    <Users className="h-3.5 w-3.5" aria-hidden />
                    {duration}
                  </span>
                ) : null}
                <span
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold",
                    voyage.price ? "bg-cobalt-soft text-cobalt" : "bg-ice text-night-soft",
                  )}
                >
                  {voyage.price || "Sur devis"}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-night text-balance sm:text-[28px]">
                {voyage.title}
              </h2>
              {voyage.description ? (
                <p className="mt-2 text-[15px] leading-relaxed text-night-muted">
                  {voyage.description}
                </p>
              ) : null}
            </div>

            {/* ——— Programme jour par jour ——— */}
            {program.length > 0 ? (
              <div className="px-5 pt-6 sm:px-8">
                <h3 className="text-sm font-bold tracking-[0.14em] text-night uppercase">
                  Programme
                </h3>
                <ol className="mt-3 border-t border-ice">
                  {program.map((line, i) => (
                    <li
                      key={i}
                      className="flex gap-3 border-b border-ice py-3 text-sm leading-relaxed text-night-soft"
                    >
                      <span className="font-mono text-xs font-bold text-cobalt tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {line}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {/* ——— Inclus / non inclus ——— */}
            {voyage.included.length > 0 || voyage.excluded.length > 0 ? (
              <div className="grid gap-6 px-5 pt-6 sm:grid-cols-2 sm:px-8">
                {voyage.included.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-bold tracking-[0.14em] text-night uppercase">
                      Inclus
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {voyage.included.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-night-soft">
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cobalt-soft text-cobalt">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {voyage.excluded.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-bold tracking-[0.14em] text-night uppercase">
                      Non inclus
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {voyage.excluded.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-night-muted">
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ice text-night-muted">
                            <X className="h-3 w-3" strokeWidth={3} />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* ——— CTA : ouvre le wizard avec le voyage pré-sélectionné ——— */}
            <div className="sticky bottom-0 mt-6 border-t border-ice bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  open({ voyage: voyage.slug });
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-citrine px-7 py-3.5 text-[15px] font-semibold text-night shadow-[0_10px_24px_-12px_rgba(250,204,21,0.7)] transition-all hover:bg-citrine-hover active:scale-[0.98]"
              >
                Sélectionner ce voyage
              </button>
              <p className="mt-2 text-center text-xs text-night-muted">
                Le formulaire s&apos;ouvre avec ce voyage pré-rempli — devis gratuit sous 24&nbsp;h ouvrées.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
