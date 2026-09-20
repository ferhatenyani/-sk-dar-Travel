"use client";

import Image from "next/image";
import { isUploadedImage } from "@/lib/images";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

import { cn } from "@/lib/cn";
import { useComposer } from "./composer";

export type HeroSlide = {
  /** Clé stable. */
  slug: string;
  /** Libellé du point de pagination (nom de destination). */
  label: string;
  headline: string;
  /** Paragraphe d'accompagnement (diapositive d'accueil seulement). */
  text?: string;
  imageUrl: string;
  /** Destination pré-cochée à l'ouverture du panneau (hors accueil). */
  destinationSlug?: string;
};

/** Durée d'une diapositive (Ken Burns et chrono de défilement auto). */
const AUTO_MS = 6500;
const SWIPE_THRESHOLD = 60;

/** Accent coloré de la diapositive courante, repris au survol du CTA. */
const ACCENTS: Record<string, string> = {
  accueil: "#facc15",
  algerie: "#10b981",
  turquie: "#2563eb",
  tunisie: "#0ea5e9",
  egypte: "#d97706",
  malaisie: "#8b5cf6",
};
const FALLBACK_ACCENT = "#facc15";

/**
 * Carrousel du hero : les destinations défilent automatiquement (fondu +
 * dérive directionnelle + Ken Burns) à l'intérieur de la carte inspi3.
 *
 * Le défilement auto n'est interrompu que par le focus clavier, un onglet
 * masqué (rAF suspendu), prefers-reduced-motion et le bouton pause — le
 * survol ne met PAS en pause (la carte occupant tout l'écran, le curseur y
 * passe son temps). Pagination : points simples à gauche, pause + flèches
 * à droite, dans le flux du contenu (aucun recouvrement possible).
 *
 * Mobile d'abord : balayage horizontal (le geste principal), boutons de
 * 44px affinés vers le bas à sm:, padding respectant la barre de geste ;
 * les flèches (inutiles sur tactile) sont masquées < sm.
 */
export function HeroCarousel({
  slides,
  className = "",
}: {
  slides: HeroSlide[];
  className?: string;
}) {
  const { open } = useComposer();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [kbFocus, setKbFocus] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  const pointerX = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const paused = reduced || kbFocus || userPaused;

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    let raf = 0;
    let elapsed = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // dt borné : au retour d'un onglet masqué le rAF a été suspendu.
      elapsed += Math.min(now - last, 100);
      last = now;
      if (elapsed >= AUTO_MS) {
        setDir(1);
        setIndex((i) => (i + 1) % slides.length);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, slides.length, index]);

  /** Plus court chemin circulaire sauf direction explicite (flèches,
   * balayage). */
  const goTo = (target: number, explicitDir?: 1 | -1) => {
    const n = slides.length;
    if (n <= 1) return;
    const wrapped = ((target % n) + n) % n;
    if (wrapped === index) return;
    if (explicitDir) {
      setDir(explicitDir);
    } else {
      const forward = (wrapped - index + n) % n;
      const backward = (index - wrapped + n) % n;
      setDir(forward <= backward ? 1 : -1);
    }
    setIndex(wrapped);
  };

  // Balayage horizontal (seuil) sans intercepter le défilement vertical :
  // touch-pan-y laisse passer le scroll, les liens/boutons sont exclus.
  const onPointerDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest("a,button")) return;
    pointerX.current = e.clientX;
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    if (pointerX.current == null) return;
    const dx = e.clientX - pointerX.current;
    pointerX.current = null;
    if (dx <= -SWIPE_THRESHOLD) goTo(index + 1, 1);
    else if (dx >= SWIPE_THRESHOLD) goTo(index - 1, -1);
  };

  // Le focus clavier met en pause ; pas le focus posé par un clic.
  const onFocus = (e: ReactFocusEvent) => {
    if (e.target.matches(":focus-visible")) setKbFocus(true);
  };
  const onBlur = (e: ReactFocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setKbFocus(false);
  };

  const active = slides[index];
  if (!active) return null;
  const accent = ACCENTS[active.slug] ?? FALLBACK_ACCENT;

  return (
    <div
      role="region"
      aria-roledescription="carrousel"
      aria-label="Destinations à la une"
      className={cn(
        "relative h-[76svh] max-h-[800px] min-h-[min(540px,86svh)] w-full touch-pan-y select-none overflow-hidden rounded-[16px] sm:rounded-[20px] lg:h-[min(86svh,840px)] lg:min-h-[min(620px,86svh)]",
        className,
      )}
      style={
        {
          "--vt-drift": dir > 0 ? "3%" : "-3%",
          "--vt-hero-ms": `${AUTO_MS}ms`,
          "--vt-accent": accent,
        } as CSSProperties
      }
      onFocus={onFocus}
      onBlur={onBlur}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        pointerX.current = null;
      }}
    >
      {/* Diapositives photo : la sortie reste en place sous l'entrante
          (fondu CSS), l'arrivée est animée en CSS (dérive + Ken Burns). */}
      {slides.map((s, i) => (
        <div
          key={s.slug}
          aria-hidden={i !== index}
          className={cn("vt-hero-slide absolute inset-0", i === index && "is-active")}
        >
          <Image
            src={s.imageUrl}
            unoptimized={isUploadedImage(s.imageUrl)}
            alt={
              i === 0
                ? "Paysage de destination proposé par Üsküdar Travel"
                : `Destination ${s.label}`
            }
            fill
            priority={i === 0}
            sizes="100vw"
            draggable={false}
            className="vt-hero-img object-cover"
          />
        </div>
      ))}

      {/* Voile : assombrit le bas pour la lisibilité du contenu */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night/90 via-night/25 to-night/10"
      />

      {/* Contenu : titre (révélation masquée) et texte réanimés à chaque
          diapositive ; les CTA persistent (pas de perte de focus) et leur
          href suit la destination affichée. */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-8 sm:pb-8 lg:px-12 lg:pb-10">
        <div className="max-w-2xl">
          <div className="overflow-hidden">
            <h1 className="text-balance text-[34px] font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[56px]">
              <span key={index} className="vt-hero-mask inline-block">
                {active.headline}
              </span>
            </h1>
          </div>
          {active.text ? (
            <p
              key={`text-${index}`}
              className="vt-hero-fade mt-3 line-clamp-3 max-w-md text-[13px] leading-relaxed text-white/75 sm:mt-4 sm:text-[15px]"
            >
              {active.text}
            </p>
          ) : null}
          {/* CTA unique : le même wizard partout (pré-coche la destination
              affichée). Un second bouton « devis » ferait doublon. */}
          <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-7 sm:gap-4">
            <button
              type="button"
              onClick={() =>
                open(
                  active.destinationSlug
                    ? { destinations: [active.destinationSlug] }
                    : undefined,
                )
              }
              className="vt-hero-cta group inline-flex items-center gap-3 rounded-full bg-white py-1.5 pl-6 pr-1.5 text-sm font-semibold text-night shadow-[0_18px_40px_-16px_rgba(15,23,42,0.65)] transition-all duration-200 hover:bg-ice active:scale-[0.98]"
            >
              Composer mon voyage
              <span className="vt-hero-cta-circle grid h-9 w-9 place-items-center rounded-full bg-night text-white transition-all duration-300 group-hover:rotate-45">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </button>
          </div>
        </div>

        {/* Rangée de contrôle dans le flux : points à gauche, pause et
            flèches à droite — aucun recouvrement du contenu possible. */}
        {slides.length > 1 && (
          <div className="mt-3 flex items-center justify-between gap-3 sm:mt-4">
            {/* Points simples : le point actif s'allonge ; zone cliquable
                élargie (p-2) pour le tactile. */}
            <div className="-m-2 flex items-center p-2">
              {slides.map((s, i) => (
                <button
                  key={s.slug}
                  type="button"
                  aria-current={i === index ? "true" : undefined}
                  aria-label={
                    s.slug === "accueil"
                      ? "Aller à l'accueil"
                      : `Aller à la destination ${s.label}`
                  }
                  onClick={() => goTo(i)}
                  className="group p-1.5"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "block h-1.5 rounded-full transition-all duration-300",
                      i === index
                        ? "w-6 bg-white"
                        : "w-1.5 bg-white/50 group-hover:bg-white/90",
                    )}
                  />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Pause / reprise du défilement auto (accessible au clavier
                  et sur tactile, où il n'y a pas de survol). */}
              <button
                type="button"
                onClick={() => setUserPaused((v) => !v)}
                aria-label={
                  userPaused
                    ? "Reprendre le défilement automatique"
                    : "Mettre le défilement automatique en pause"
                }
                className="grid h-11 w-11 place-items-center rounded-full bg-white/85 text-night shadow-lg ring-1 ring-night/5 backdrop-blur-sm transition-colors hover:bg-white sm:h-10 sm:w-10"
              >
                {userPaused ? (
                  <Play className="h-4.5 w-4.5" />
                ) : (
                  <Pause className="h-4.5 w-4.5" />
                )}
              </button>
              {/* Flèches : desktop à pointeur fin seulement — sur tactile
                  le balayage et les points suffisent (et le survol n'existe
                  pas), et un téléphone en paysage a la largeur sm. */}
              <button
                type="button"
                onClick={() => goTo(index - 1, -1)}
                aria-label="Destination précédente"
                className="hidden h-10 w-10 place-items-center rounded-full bg-white/85 text-night shadow-lg ring-1 ring-night/5 backdrop-blur-sm transition-colors hover:bg-white sm:grid [@media(pointer:coarse)]:hidden"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1, 1)}
                aria-label="Destination suivante"
                className="hidden h-10 w-10 place-items-center rounded-full bg-white/85 text-night shadow-lg ring-1 ring-night/5 backdrop-blur-sm transition-colors hover:bg-white sm:grid [@media(pointer:coarse)]:hidden"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
