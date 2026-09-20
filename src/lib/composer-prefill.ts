import type { ComposerPrefill } from "@/components/vitrine/composer";

/**
 * Transmission du pré-remplissage du wizard « Composer mon voyage ».
 *
 * - Mobile (feuille basse) : le formulaire est monté à l'ouverture et reçoit
 *   le pré-remplissage en props — ce module sert de filet de secours.
 * - Desktop, formulaire dans la page : l'événement `vt-composer-prefill` est
 *   appliqué immédiatement par le formulaire monté (l'écouteur pose
 *   `lastEventHandled`) et la copie sessionStorage est retirée.
 * - Desktop, formulaire sur une autre page (ex. modale voyage → accueil
 *   #contact) : personne n'écoute — la copie sessionStorage survit à la
 *   navigation et est consommée au montage du formulaire.
 */
const PREFILL_KEY = "vt-composer-prefill";
const PREFILL_EVENT = "vt-composer-prefill";

let lastEventHandled = false;

/** Pose le pré-remplissage : événement pour la page courante + copie sessionStorage. */
export function emitComposerPrefill(prefill: ComposerPrefill): void {
  const hasContent = Boolean(
    prefill.destinations?.length || prefill.offers?.length || prefill.voyage,
  );
  if (!hasContent) return;
  try {
    sessionStorage.setItem(PREFILL_KEY, JSON.stringify(prefill));
  } catch {
    // sessionStorage indisponible (navigation privée) : l'événement suffit.
  }
  lastEventHandled = false;
  // dispatchEvent est synchrone : les écouteurs ont fini avant la ligne suivante.
  window.dispatchEvent(new CustomEvent(PREFILL_EVENT, { detail: prefill }));
  if (lastEventHandled) {
    // Un formulaire de la page a appliqué le pré-remplissage : aucune copie
    // en attente qui pourrait contaminer une navigation ultérieure.
    try {
      sessionStorage.removeItem(PREFILL_KEY);
    } catch {
      // ignore
    }
  }
}

/** Consomme le pré-remplissage en attente (posé avant une navigation), une seule fois. */
export function takeComposerPrefill(): ComposerPrefill | null {
  try {
    const raw = sessionStorage.getItem(PREFILL_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PREFILL_KEY);
    const prefill = JSON.parse(raw) as ComposerPrefill;
    return typeof prefill === "object" && prefill !== null ? prefill : null;
  } catch {
    return null;
  }
}

/** Écoute les pré-remplissages posés sur la page courante (formulaire déjà monté). */
export function onComposerPrefill(
  handler: (prefill: ComposerPrefill) => void,
): () => void {
  const listener = (event: Event) => {
    lastEventHandled = true;
    handler((event as CustomEvent<ComposerPrefill>).detail);
  };
  window.addEventListener(PREFILL_EVENT, listener);
  return () => window.removeEventListener(PREFILL_EVENT, listener);
}
