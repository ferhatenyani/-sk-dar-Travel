/**
 * Options partagées du formulaire « Composer mon voyage » : valeurs
 * canoniques stockées en base + libellés affichés. Importable côté serveur
 * (validation zod) comme côté client (selects).
 */

export type Option = { value: string; label: string };

/** Type de voyage demandé. */
export const TRIP_TYPES: Option[] = [
  { value: "organise", label: "Voyage organisé (groupe)" },
  { value: "sur-mesure", label: "Voyage sur-mesure" },
  { value: "noces", label: "Voyage de noces" },
  { value: "famille", label: "Séjour en famille" },
  { value: "aventure", label: "Aventure / découverte" },
  { value: "affaires", label: "Professionnel" },
  { value: "culturel", label: "Culturel & patrimoine" },
  { value: "autre", label: "Autre" },
];

/** Budget estimatif par personne, en dinars algériens. */
export const BUDGET_RANGES: Option[] = [
  { value: "lt-50k", label: "Moins de 50 000 DA" },
  { value: "50k-100k", label: "50 000 à 100 000 DA" },
  { value: "100k-200k", label: "100 000 à 200 000 DA" },
  { value: "gt-200k", label: "Plus de 200 000 DA" },
  { value: "inconnu", label: "Je ne sais pas encore" },
];

/** Hébergement souhaité. */
export const ACCOMMODATIONS: Option[] = [
  { value: "hotel-3", label: "Hôtel 3★" },
  { value: "hotel-4", label: "Hôtel 4★" },
  { value: "hotel-5", label: "Hôtel 5★" },
  { value: "riad", label: "Riad / maison d'hôtes" },
  { value: "resort", label: "Resort tout inclus" },
  { value: "peu-importe", label: "Peu importe" },
];

/** Destination « je ne sais pas encore » du formulaire (hors galerie). */
export const OTHER_DESTINATION = "autre";

/** Valeurs autorisées pour la validation serveur. */
export const TRIP_TYPE_VALUES = TRIP_TYPES.map((o) => o.value);
export const BUDGET_VALUES = BUDGET_RANGES.map((o) => o.value);
export const ACCOMMODATION_VALUES = ACCOMMODATIONS.map((o) => o.value);

export function labelOf(options: Option[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
