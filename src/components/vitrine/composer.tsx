"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass } from "lucide-react";

import { cn } from "@/lib/cn";
import { emitComposerPrefill } from "@/lib/composer-prefill";
import { TripRequestForm } from "./trip-request-form";

type Choice = { slug: string; title: string };

/** Sélections pré-remplies à l'ouverture de la feuille (mobile). */
export type ComposerPrefill = {
  destinations?: string[];
  offers?: string[];
  /** Voyage organisé pré-sélectionné (slug). */
  voyage?: string;
};

type ComposerContextValue = {
  open: (prefill?: ComposerPrefill) => void;
};

const ComposerContext = createContext<ComposerContextValue | null>(null);

/**
 * Action « Composer mon voyage » :
 * - mobile (< sm) : ouvre la feuille basse avec le wizard ;
 * - desktop (sm+) : fait défiler la page jusqu'au formulaire intégré
 *   (`[data-vt-composer]`) ; à défaut, navigue vers l'accueil #contact.
 */
export function useComposer(): ComposerContextValue {
  const ctx = useContext(ComposerContext);
  if (!ctx) throw new Error("useComposer doit être utilisé dans <ComposerProvider>");
  return ctx;
}

/** media query du passage feuille ↔ formulaire intégré (tailwind sm). */
const SHEET_MQ = "(max-width: 639px)";

/**
 * Carte CTA « Composer mon voyage » — remplace le formulaire intégré sur
 * mobile (landing + pages détail) : ouvre la feuille basse.
 */
export function ComposerCard({
  prefill,
  className = "",
}: {
  prefill?: ComposerPrefill;
  className?: string;
}) {
  const { open } = useComposer();
  return (
    <button
      type="button"
      onClick={() => open(prefill)}
      className={cn(
        "group flex w-full items-center gap-4 rounded-3xl border border-ice bg-white p-5 text-left",
        "shadow-[0_20px_48px_-32px_rgba(15,23,42,0.3)] transition-all hover:border-ice-strong active:scale-[0.99] sm:hidden",
        className,
      )}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-night text-citrine">
        <Compass className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold text-night">Composer mon voyage</span>
        <span className="mt-0.5 block text-sm text-night-muted">
          Devis gratuit — réponse sous 24&nbsp;h ouvrées.
        </span>
      </span>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ice/70 text-night transition-all duration-300 group-hover:bg-night group-hover:text-citrine">
        <ArrowRight className="h-4.5 w-4.5" aria-hidden />
      </span>
    </button>
  );
}

/**
 * Bouton déclencheur utilisable depuis un composant serveur : même gabarit
 * visuel que les ButtonLink (variantes primary / outline-light).
 */
export function ComposerTrigger({
  children,
  className = "",
  prefill,
  variant = "primary",
  size = "md",
}: {
  children: ReactNode;
  className?: string;
  prefill?: ComposerPrefill;
  variant?: "primary" | "night" | "outline" | "outline-light";
  size?: "md" | "lg";
}) {
  const { open } = useComposer();
  return (
    <button
      type="button"
      onClick={() => open(prefill)}
      className={cn(TRIGGER_BASE, variantClass(variant), sizeClass(size), className)}
    >
      {children}
    </button>
  );
}

const TRIGGER_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60";

const sizeClass = (size: "md" | "lg") =>
  size === "lg" ? "px-6 py-3 text-[15px]" : "px-5 py-2.5 text-sm";

function variantClass(variant: "primary" | "night" | "outline" | "outline-light") {
  switch (variant) {
    case "night":
      return "bg-night text-white hover:bg-night-soft active:scale-[0.98]";
    case "outline":
      return "border border-ice-strong bg-white text-night hover:border-night-muted hover:bg-ice/40 active:scale-[0.98]";
    case "outline-light":
      return "border border-white/30 bg-white/5 text-white hover:bg-white/15 active:scale-[0.98]";
    default:
      return "bg-citrine text-night shadow-[0_10px_24px_-12px_rgba(250,204,21,0.7)] hover:bg-citrine-hover active:scale-[0.98]";
  }
}

/** Seuil de glissement vers le bas au-delà duquel la feuille se ferme. */
const SWIPE_CLOSE_THRESHOLD = 90;

/**
 * Fournisseur « Composer mon voyage ». Le wizard vit dans le formulaire
 * intégré des pages (desktop) et dans la feuille basse (mobile) — démontée
 * intégralement à la fermeture (aucun résidu, scroll-lock relâché,
 * réouverture remise à zéro).
 */
export function ComposerProvider({
  destinations,
  offers,
  voyages,
  children,
}: {
  destinations: Choice[];
  offers: Choice[];
  /** Voyages organisés publiés (menu « Voyage organisé » du wizard). */
  voyages: Choice[];
  children: ReactNode;
}) {
  const router = useRouter();
  // nonce : force le formulaire de la feuille à repartir de zéro à chaque ouverture.
  const [state, setState] = useState<{ open: boolean; prefill: ComposerPrefill; nonce: number }>({
    open: false,
    prefill: {},
    nonce: 0,
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(SHEET_MQ);
    const sync = () => setIsMobile(mq.matches);
    sync();
    const onChange = () => {
      sync();
      // Passage mobile → desktop la feuille ouverte : fermeture immédiate.
      if (!mq.matches) {
        setState((s) => (s.open ? { ...s, open: false } : s));
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const open = useCallback(
    (prefill: ComposerPrefill = {}) => {
      // Pose le pré-remplissage pour les formulaires déjà montés (événement)
      // et pour le formulaire de la page de destination (sessionStorage).
      emitComposerPrefill(prefill);
      if (!window.matchMedia(SHEET_MQ).matches) {
        // Desktop : le formulaire est dans la page — on y emmène l'utilisateur.
        const form = document.querySelector("[data-vt-composer]");
        if (form) {
          form.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        // Aucun formulaire sur cette page : accueil, puis défilement vers la
        // section contact — sans hash dans l'URL (le retour navigateur ne
        // doit pas retomber sur le formulaire).
        router.push("/");
        const t0 = Date.now();
        const timer = setInterval(() => {
          const section = document.getElementById("contact");
          if (section && window.location.pathname === "/") {
            clearInterval(timer);
            // Signale au composant de restauration de ne pas reprendre la main.
            sessionStorage.setItem("vt-accueil-scroll-skip", "1");
            section.scrollIntoView({ behavior: "smooth", block: "start" });
          } else if (Date.now() - t0 > 5000) {
            clearInterval(timer);
          }
        }, 100);
        return;
      }
      setState((s) => ({ open: true, prefill, nonce: s.nonce + 1 }));
    },
    [router],
  );

  const close = useCallback(() => {
    setState((s) => (s.open ? { ...s, open: false } : s));
  }, []);

  // Verrou du défilement + fermeture au clavier + focus sur le 1er champ.
  useEffect(() => {
    if (!state.open) return;
    document.body.style.overflow = "hidden";
    // Laisse le formulaire monter avant de déplacer le focus.
    const raf = requestAnimationFrame(() => {
      document.getElementById("vt-modal-fullName")?.focus();
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, [state.open, close]);

  /* ——— Glisser vers le bas pour fermer (feuille mobile) ——— */
  // La décision de fermeture passe par des refs : les refs reflètent
  // immédiatement le dernier move, sans dépendre du batching React.
  const dragStart = useRef<number | null>(null);
  const dragLast = useRef(0);
  const [dragY, setDragY] = useState<number | null>(null);

  const onHandleDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragStart.current = e.clientY;
    dragLast.current = 0;
    setDragY(0);
    // Capture : les moves/up suivants arrivent ici même si le curseur
    // quitte la poignée (le contenu défile sous le doigt).
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onHandleMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStart.current == null) return;
    dragLast.current = Math.max(0, e.clientY - dragStart.current);
    setDragY(dragLast.current);
  };
  const onHandleUp = () => {
    if (dragStart.current == null) return;
    const exceeded = dragLast.current > SWIPE_CLOSE_THRESHOLD;
    dragStart.current = null;
    if (exceeded) close();
    setDragY(null);
  };

  return (
    <ComposerContext.Provider value={{ open }}>
      {children}

      {state.open && isMobile ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Composer mon voyage"
          className="fixed inset-0 z-[80]"
        >
          {/* Fond : clic = fermeture */}
          <button
            type="button"
            aria-label="Fermer le panneau"
            onClick={close}
            className="absolute inset-0 h-full w-full cursor-default bg-night/55 backdrop-blur-sm"
          />

          {/* Feuille basse — démontée à la fermeture */}
          <div
            className={cn(
              "vt-sheet absolute inset-x-0 bottom-0 flex max-h-[min(92dvh,64rem)] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-24px_64px_-24px_rgba(15,23,42,0.5)]",
            )}
          >
            {/* Transformation de glisse sur un wrapper interne : l'animation
                d'entrée (fill-mode both) serait prioritaire sur un style
                inline posé ici même. */}
            <div
              className="flex min-h-0 flex-1 flex-col"
              style={
                dragY != null
                  ? { transform: `translateY(${dragY}px)`, transition: "none" }
                  : undefined
              }
            >
              {/* Poignée : glisser vers le bas = fermer */}
              <div
                data-sheet-handle
                onPointerDown={onHandleDown}
                onPointerMove={onHandleMove}
                onPointerUp={onHandleUp}
                onPointerCancel={onHandleUp}
                className="shrink-0 cursor-grab touch-none bg-white pt-2.5 pb-1 active:cursor-grabbing"
              >
                <span
                  aria-hidden
                  className="mx-auto block h-1.5 w-10 rounded-full bg-ice-strong"
                />
              </div>

              {/* Scroll interne natif : data-lenis-prevent rend la molette et
                  le tactile à ce conteneur (Lenis ne les intercepte plus). */}
              <div
                data-lenis-prevent
                className="flex-1 touch-pan-y overflow-y-auto overscroll-contain p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
              >
                <TripRequestForm
                  key={state.nonce}
                  destinations={destinations}
                  offers={offers}
                  voyages={voyages}
                  defaultDestinations={state.prefill.destinations}
                  defaultOffers={state.prefill.offers}
                  defaultVoyage={state.prefill.voyage}
                  idPrefix="vt-modal"
                  onClose={close}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </ComposerContext.Provider>
  );
}
