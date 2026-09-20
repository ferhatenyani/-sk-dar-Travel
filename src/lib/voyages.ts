import type { Voyage } from "@/db/schema";

/**
 * Voyage organisé tel qu'affiché côté vitrine (accueil, page listing, modale,
 * menu du formulaire). Les dates restent en ISO (AAAA-MM-JJ) — ce sont des
 * dates calendaires, aucun fuseau à gérer.
 */
export type VoyagePublic = Pick<
  Voyage,
  | "slug"
  | "title"
  | "description"
  | "price"
  | "imageUrl"
  | "galleryImages"
  | "departureDate"
  | "returnDate"
  | "program"
  | "included"
  | "excluded"
>;

const FULL_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const SHORT_FMT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

const isIsoDate = (v: string | null | undefined): v is string =>
  Boolean(v && /^\d{4}-\d{2}-\d{2}$/.test(v));

/** « Du 12 mars au 20 mars 2026 » — null si aucune date exploitable. */
export function voyageDatesLabel(
  departureDate: string | null,
  returnDate: string | null,
): string | null {
  if (!isIsoDate(departureDate)) return null;
  const departure = FULL_FMT.format(new Date(`${departureDate}T12:00:00`));
  if (isIsoDate(returnDate) && returnDate > departureDate) {
    const returnLbl = FULL_FMT.format(new Date(`${returnDate}T12:00:00`));
    // Même mois et même année : « du 12 au 20 mars 2026 ».
    if (departureDate.slice(0, 7) === returnDate.slice(0, 7)) {
      const day = String(Number(returnDate.slice(8, 10)));
      const monthYear = returnLbl.split(" ").slice(1).join(" ");
      return `Du ${departure.split(" ")[0]} au ${day} ${monthYear}`;
    }
    return `Du ${departure} au ${returnLbl}`;
  }
  return `Départ le ${departure}`;
}

/** « 9 jours / 8 nuits » (dates en ISO, retour strictement après le départ). */
export function voyageDurationLabel(
  departureDate: string | null,
  returnDate: string | null,
): string | null {
  if (!isIsoDate(departureDate) || !isIsoDate(returnDate)) return null;
  if (returnDate <= departureDate) return null;
  const ms = new Date(`${returnDate}T12:00:00`).getTime() - new Date(`${departureDate}T12:00:00`).getTime();
  const nights = Math.round(ms / 86_400_000);
  return `${nights + 1} jour${nights + 1 > 1 ? "s" : ""} / ${nights} nuit${nights > 1 ? "s" : ""}`;
}

/** Durée courte pour les cartes (« 8 j / 7 nuits »), sinon date de départ. */
export function voyageCardMeta(
  departureDate: string | null,
  returnDate: string | null,
): string | null {
  const duration = voyageDurationLabel(departureDate, returnDate);
  if (duration) return duration.replace("jours", "j").replace("nuits", "n");
  if (!isIsoDate(departureDate)) return null;
  return SHORT_FMT.format(new Date(`${departureDate}T12:00:00`));
}

/** Programme jour par jour : une entrée par ligne non vide. */
export function voyageProgramLines(program: string): string[] {
  return program
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
