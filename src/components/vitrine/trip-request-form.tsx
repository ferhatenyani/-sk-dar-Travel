"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  CircleHelp,
  Heart,
  Home,
  Hotel,
  Landmark,
  Loader2,
  Minus,
  Mountain,
  Palmtree,
  Plus,
  Route,
  Send,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { Dropdown } from "@/components/ui/dropdown";
import {
  onComposerPrefill,
  takeComposerPrefill,
} from "@/lib/composer-prefill";
import type { ComposerPrefill } from "./composer";
import {
  ACCOMMODATIONS,
  BUDGET_RANGES,
  labelOf,
  OTHER_DESTINATION,
  TRIP_TYPES,
} from "@/lib/trip-options";
import { RangeCalendar, type DateRange } from "./range-calendar";

type Choice = { slug: string; title: string };

type FieldErrors = Partial<
  Record<
    | "fullName"
    | "phone"
    | "email"
    | "destinations"
    | "offers"
    | "voyage"
    | "departureCity"
    | "departureDate"
    | "returnDate"
    | "tripType"
    | "budget"
    | "accommodation"
    | "notes"
    | "form",
    string
  >
>;

/** Étapes du wizard : libellé (progression), titre, sous-titre, desc latéral. */
const STEPS = [
  {
    label: "Vous",
    title: "Vos coordonnées",
    sub: "Qui vous êtes et comment vous joindre — c'est tout ce qu'il nous faut pour commencer.",
    desc: "Nom, téléphone, e-mail",
  },
  {
    label: "Le voyage",
    title: "Votre voyage",
    sub: "Destinations, dates et voyageurs : tracez l'itinéraire de départ.",
    desc: "Destination, dates, voyageurs",
  },
  {
    label: "Options",
    title: "Options & envoi",
    sub: "Type de séjour, budget, hébergement — vérifiez le récapitulatif et envoyez.",
    desc: "Budget, hébergement, envoi",
  },
];

/** Erreur de champ → étape du wizard (les retours serveur remontent au bon écran). */
const FIELD_STEP: Record<string, number> = {
  fullName: 0,
  phone: 0,
  email: 0,
  destinations: 1,
  offers: 1,
  voyage: 1,
  departureCity: 1,
  departureDate: 1,
  returnDate: 1,
  adults: 1,
  children: 1,
  tripType: 2,
  budget: 2,
  accommodation: 2,
  notes: 2,
};

/** Icônes + libellés courts des cartes « type de voyage » (valeurs canoniques). */
const TRIP_TYPE_CARDS: Record<string, { icon: LucideIcon; short: string }> = {
  organise: { icon: Users, short: "Voyage organisé" },
  "sur-mesure": { icon: Route, short: "Sur-mesure" },
  noces: { icon: Heart, short: "Voyage de noces" },
  famille: { icon: Baby, short: "En famille" },
  aventure: { icon: Mountain, short: "Aventure" },
  affaires: { icon: Briefcase, short: "Professionnel" },
  culturel: { icon: Landmark, short: "Culturel" },
  autre: { icon: CircleHelp, short: "Autre" },
};

/** Icônes des cartes « hébergement ». */
const ACCOMMODATION_CARDS: Record<string, LucideIcon> = {
  "hotel-3": Hotel,
  "hotel-4": Building2,
  "hotel-5": Star,
  riad: Home,
  resort: Palmtree,
  "peu-importe": CircleHelp,
};

function todayIso(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

const DAY_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});
const fmtDay = (iso: string) => DAY_FMT.format(new Date(`${iso}T12:00:00`));

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-danger">{message}</p>;
}

/** 16 px partout : iOS zoome automatiquement tout focus dans un champ < 16 px. */
const fieldCls = (error?: string) =>
  cn(
    "w-full rounded-xl border bg-white px-4 py-3 text-base text-night placeholder:text-night-faint transition-colors focus:border-cobalt focus:outline-none",
    error ? "border-danger" : "border-ice",
  );

const labelCls = "block text-sm font-semibold text-night";
const optionalHint = <span className="font-normal text-night-muted"> (optionnel)</span>;

/** Puce à coche. `tone` : nuit (destinations) ou cobalt (offres). */
function ChipToggle({
  active,
  onClick,
  tone,
  children,
}: {
  active: boolean;
  onClick: () => void;
  tone: "night" | "cobalt";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.97]",
        active
          ? tone === "night"
            ? "border-night bg-night text-white shadow-[0_8px_18px_-10px_rgba(15,23,42,0.8)]"
            : "border-cobalt bg-cobalt text-white shadow-[0_8px_18px_-10px_rgba(37,99,235,0.8)]"
          : "border-ice-strong bg-white text-night-soft hover:border-night-faint hover:text-night",
      )}
    >
      {active ? (
        <Check
          aria-hidden
          className={cn("h-4 w-4", tone === "night" ? "text-citrine" : "text-white")}
          strokeWidth={3}
        />
      ) : null}
      {children}
    </button>
  );
}

/** Carte-icône cliquable (1 carte = 1 option, état sélectionné cobalt). */
function IconCard({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-center text-[13px] leading-tight font-semibold transition-all active:scale-[0.97]",
        active
          ? "border-cobalt bg-cobalt text-white shadow-[0_10px_22px_-12px_rgba(37,99,235,0.9)]"
          : "border-ice-strong bg-white text-night-soft hover:border-night-faint hover:text-night",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      {children}
    </button>
  );
}

/**
 * Formulaire « Composer mon voyage » — wizard 3 étapes clair et aéré :
 * stepper latéral numéroté (desktop), progression compacte (mobile),
 * grands titres d'étape, voyageurs en carte groupée. L'identité
 * boarding-pass reste en touche sur le récapitulatif nuit (mono + code-barres)
 * et la ligne d'itinéraire Départ ✈ Retour. Aucun contrôle natif.
 *
 * Utilisé dans la section contact, sur les pages détail (desktop) et dans la
 * feuille basse (mobile). `onClose` : croix de fermeture (feuille seule).
 */
export function TripRequestForm({
  destinations,
  offers,
  voyages = [],
  defaultDestinations = [],
  defaultOffers = [],
  defaultVoyage = "",
  idPrefix = "vt-form",
  onClose,
}: {
  /** Destinations publiées (sections galerie). */
  destinations: Choice[];
  /** Offres publiées (services). */
  offers: Choice[];
  /** Voyages organisés publiés (menu « Voyage organisé »). */
  voyages?: Choice[];
  /** Sélections pré-remplies (arrivée depuis une page détail / le hero). */
  defaultDestinations?: string[];
  defaultOffers?: string[];
  /** Voyage organisé pré-sélectionné (slug). */
  defaultVoyage?: string;
  /** Préfixe des id : deux formulaires peuvent coexister (page + feuille). */
  idPrefix?: string;
  /** Fermeture de la feuille (affiche la croix). */
  onClose?: () => void;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;

  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<FieldErrors>({});

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(defaultDestinations);
  const [selectedOffers, setSelectedOffers] = useState<string[]>(defaultOffers);
  const [voyage, setVoyage] = useState(defaultVoyage);
  const [departureCity, setDepartureCity] = useState("");
  const [range, setRange] = useState<DateRange | null>(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [tripType, setTripType] = useState("");
  const [budget, setBudget] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [notes, setNotes] = useState("");

  // Référence « boarding pass » (générée côté client après montage : aucune
  // discordance d'hydratation, le placeholder s'affiche au premier paint).
  const [reference, setReference] = useState("······");

  /** Application d'un pré-remplissage (destinations, offres, voyage). */
  const applyPrefill = useCallback((prefill: ComposerPrefill) => {
    if (prefill.destinations?.length) setSelectedDestinations(prefill.destinations);
    if (prefill.offers?.length) setSelectedOffers(prefill.offers);
    if (prefill.voyage !== undefined) setVoyage(prefill.voyage);
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setReference(`VT-${Date.now().toString(36).slice(-6).toUpperCase()}`);
      // Pré-remplissage posé avant une navigation vers cette page (modale
      // voyage → accueil #contact…) : consommé une seule fois, après montage.
      const pending = takeComposerPrefill();
      if (pending) applyPrefill(pending);
    });
    return () => cancelAnimationFrame(raf);
  }, [applyPrefill]);

  // Pré-remplissage posé alors que le formulaire est déjà monté (desktop :
  // bouton du hero, carte destination du carrousel, modale voyage…).
  useEffect(() => onComposerPrefill(applyPrefill), [applyPrefill]);

  const headingRef = useRef<HTMLHeadingElement>(null);

  /** Clé du champ en erreur à amener dans le viewport (jamais d'échec silencieux). */
  const scrollErrorKeyRef = useRef<string | null>(null);

  // Amène le premier champ en erreur dans le viewport, une fois l'étape rendue.
  useEffect(() => {
    const key = scrollErrorKeyRef.current;
    if (!key) return;
    const anchors: Record<string, string> = {
      fullName: `#${id("fullName")}`,
      phone: `#${id("phone")}`,
      email: `#${id("email")}`,
      destinations: `#${id("destinations")}-label`,
      offers: `#${id("offers")}-label`,
      voyage: `#${id("voyage")}-label`,
      departureCity: `#${id("departureCity")}`,
      departureDate: `#${id("dates")}-label`,
      returnDate: `#${id("dates")}-label`,
      tripType: `#${id("tripType")}-label`,
      budget: `#${id("budget")}-label`,
      accommodation: `#${id("accommodation")}-label`,
      notes: `#${id("notes")}`,
    };
    const anchor = anchors[key];
    const el = anchor ? document.querySelector(anchor) : null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      scrollErrorKeyRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors, step]);

  // Changement d'étape : le titre de l'étape prend le focus (lecteurs
  // d'écran) — jamais au montage (aucun vol de focus au chargement).
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const clearError = (key: keyof FieldErrors) =>
    setErrors((e) => {
      if (!(key in e)) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });

  const toggleDestination = (slug: string) => {
    clearError("destinations");
    setSelectedDestinations((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };
  const toggleOffer = (slug: string) =>
    setSelectedOffers((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );

  /** Validation client par étape (mêmes messages que la validation zod). */
  function validate(current: number): FieldErrors {
    const errs: FieldErrors = {};
    if (current === 0) {
      if (fullName.trim().length < 2) errs.fullName = "Le nom complet est requis.";
      if (phone.trim().length < 6) errs.phone = "Le numéro de téléphone est requis.";
      else if (!/^[+0-9 ()./-]+$/.test(phone.trim()))
        errs.phone = "Le téléphone ne peut contenir que des chiffres et + ( ) - .";
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = "Adresse e-mail invalide.";
    }
    if (current === 1) {
      if (selectedDestinations.length === 0)
        errs.destinations = "Choisissez au moins une destination.";
      if (departureCity.trim().length < 2)
        errs.departureCity = "La ville de départ est requise.";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(range?.from ?? ""))
        errs.departureDate = "Choisissez une date de départ.";
      else if ((range?.from ?? "") < todayIso())
        errs.departureDate = "La date de départ doit être future.";
      if (range?.to && range.to <= range.from)
        errs.returnDate = "Le retour doit être après le départ.";
    }
    if (current === 2) {
      if (!tripType) errs.tripType = "Choisissez un type de voyage.";
      if (!budget) errs.budget = "Choisissez une fourchette de budget.";
      if (!accommodation) errs.accommodation = "Choisissez un hébergement.";
    }
    return errs;
  }

  function goNext() {
    const errs = validate(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Ramène l'utilisateur au premier champ fautif (sinon l'erreur passe
      // inaperçue quand le bouton est en bas du formulaire).
      scrollErrorKeyRef.current = Object.keys(errs)[0];
      return;
    }
    setErrors({});
    setStep((s) => Math.min(2, s + 1));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errs = validate(2);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      scrollErrorKeyRef.current = Object.keys(errs)[0];
      return;
    }

    const honeypot = new FormData(event.currentTarget).get("website");

    setStatus("sending");
    setErrors({});
    try {
      const res = await fetch("/api/demandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          destinations: selectedDestinations,
          offers: selectedOffers,
          voyage,
          departureCity,
          departureDate: range?.from ?? "",
          returnDate: range?.to ?? "",
          adults,
          children,
          tripType,
          budget,
          accommodation,
          notes,
          website: honeypot,
        }),
      });

      if (res.ok) {
        setStatus("sent");
        return;
      }

      const body = (await res.json().catch(() => null)) as {
        fieldErrors?: Record<string, string>;
      } | null;
      const serverErrors = body?.fieldErrors ?? {};
      const knownKeys = Object.keys(serverErrors).filter((k) => k in FIELD_STEP);
      const unknownKeys = Object.keys(serverErrors).filter((k) => !(k in FIELD_STEP));
      setErrors({
        ...serverErrors,
        form: !body?.fieldErrors
          ? "Une erreur est survenue. Réessayez dans quelques instants."
          : unknownKeys.length > 0 && knownKeys.length === 0
            ? "Certaines informations sont invalides. Vérifiez votre saisie puis réessayez."
            : undefined,
      });
      // Une erreur serveur sur une étape antérieure : on y ramène l'utilisateur.
      if (knownKeys.length > 0) {
        setStep(FIELD_STEP[knownKeys[0]]);
        scrollErrorKeyRef.current = knownKeys[0];
      }
      setStatus("error");
    } catch {
      setErrors({ form: "Impossible d'envoyer la demande. Vérifiez votre connexion." });
      setStatus("error");
    }
  }

  function reset() {
    setStep(0);
    setStatus("idle");
    setErrors({});
    setFullName("");
    setPhone("");
    setEmail("");
    setSelectedDestinations(defaultDestinations);
    setSelectedOffers(defaultOffers);
    setVoyage(defaultVoyage);
    setDepartureCity("");
    setRange(null);
    setAdults(2);
    setChildren(0);
    setTripType("");
    setBudget("");
    setAccommodation("");
    setNotes("");
    setReference(`VT-${Date.now().toString(36).slice(-6).toUpperCase()}`);
  }

  /* ——— Écran de succès ——— */
  if (status === "sent") {
    return (
      <div
        data-vt-composer
        className="scroll-mt-24 rounded-[28px] border border-ice bg-white p-8 text-center shadow-[0_24px_56px_-32px_rgba(15,23,42,0.25)]"
      >
        <div className="mx-auto max-w-sm" role="status">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-cobalt-soft text-cobalt">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h3 className="mt-5 text-2xl font-bold tracking-tight text-night">
            Demande envoyée !
          </h3>
          <p className="mt-2 text-[15px] leading-relaxed text-night-muted">
            Merci ! Votre demande est bien enregistrée : un conseiller vous
            recontacte sous 24&nbsp;h ouvrées avec un premier devis.
          </p>
          {reference !== "······" ? (
            <p className="mt-4 inline-block rounded-full border border-ice px-4 py-1.5 font-mono text-xs font-semibold text-night-soft">
              Référence {reference}
            </p>
          ) : null}
          <div className="mt-6">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full bg-night px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-night-soft"
            >
              Composer un autre voyage
            </button>
          </div>
        </div>
      </div>
    );
  }

  const destinationTitle = (slug: string) =>
    destinations.find((d) => d.slug === slug)?.title ??
    (slug === OTHER_DESTINATION ? "À définir" : slug);
  const rangeLabel = range
    ? range.to
      ? `${fmtDay(range.from)} → ${fmtDay(range.to)} ${range.to.slice(0, 4)}`
      : `${fmtDay(range.from)} → …`
    : null;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      data-vt-composer
      className="scroll-mt-24 overflow-visible rounded-[28px] border border-ice bg-white shadow-[0_24px_56px_-32px_rgba(15,23,42,0.25)]"
    >
      <div className="lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
        {/* ——— Stepper latéral (desktop) ——— */}
        <aside
          aria-label="Progression du formulaire"
          className="hidden flex-col gap-2 rounded-l-[28px] border-r border-ice bg-page/80 p-5 lg:flex"
        >
          {STEPS.map((s, i) => {
            const done = i < step;
            const current = i === step;
            const circle = (
              <span
                aria-hidden
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full font-mono text-sm font-bold transition-colors",
                  done && "bg-cobalt text-white",
                  current && "bg-night text-white",
                  !done && !current && "border border-ice-strong bg-white text-night-faint",
                )}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </span>
            );
            const label = (
              <span className="min-w-0 pt-1">
                <span
                  className={cn(
                    "block text-sm font-bold",
                    current ? "text-night" : done ? "text-night-soft" : "text-night-muted",
                  )}
                >
                  {s.label}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-night-muted">
                  {s.desc}
                </span>
              </span>
            );
            return (
              <div key={s.label} className="flex gap-1">
                <div className="flex flex-col items-center">
                  {circle}
                  {i < STEPS.length - 1 ? (
                    <span aria-hidden className="mt-1 w-px flex-1 bg-ice-strong/70" />
                  ) : null}
                </div>
                {done ? (
                  <button
                    type="button"
                    onClick={() => setStep(i)}
                    aria-label={`Revenir à l'étape ${i + 1} : ${s.label}`}
                    className="-m-1 flex flex-1 items-start gap-3 rounded-2xl p-1 text-left transition-colors hover:bg-ice/50"
                  >
                    {label}
                  </button>
                ) : (
                  <div
                    aria-current={current ? "step" : undefined}
                    className="flex flex-1 items-start gap-3 p-1"
                  >
                    {label}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        {/* ——— Contenu de l'étape ——— */}
        <div className="min-w-0 p-5 sm:p-8 lg:p-10">
          {/* Progression compacte (mobile / tablette) */}
          <div className="mb-6 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[11px] font-bold tracking-[0.18em] text-cobalt uppercase">
                Étape {step + 1}/3 · {STEPS[step].label}
              </p>
              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fermer"
                  className="grid h-9 w-9 place-items-center rounded-full border border-ice bg-white text-night transition-colors hover:bg-ice/60"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <div className="mt-2.5 flex gap-1.5" aria-hidden>
              {STEPS.map((s, i) => (
                <span
                  key={s.label}
                  className={cn(
                    "h-1 flex-1 rounded-full",
                    i < step && "bg-cobalt",
                    i === step && "bg-night",
                    i > step && "bg-ice",
                  )}
                />
              ))}
            </div>
          </div>

          <p className="hidden font-mono text-[11px] font-bold tracking-[0.18em] text-cobalt uppercase lg:block">
            Étape {step + 1} sur 3
          </p>

          <h3
            ref={headingRef}
            tabIndex={-1}
            className={cn(
              "text-2xl font-bold tracking-tight text-night focus:outline-none sm:text-[28px]",
              "lg:mt-1",
            )}
          >
            {STEPS[step].title}
          </h3>
          <p className="mt-1.5 max-w-lg text-[15px] leading-relaxed text-night-muted">
            {STEPS[step].sub}
          </p>

          <div className="mt-6 border-t border-ice pt-6">
            <div className="vt-ticket-step" key={step}>
              {step === 0 ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor={id("fullName")} className={labelCls}>
                      Nom complet <span className="text-cobalt">*</span>
                    </label>
                    <input
                      id={id("fullName")}
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Votre nom et prénom"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        clearError("fullName");
                      }}
                      aria-invalid={Boolean(errors.fullName)}
                      className={cn(fieldCls(errors.fullName), "mt-1.5")}
                    />
                    <FieldError message={errors.fullName} />
                  </div>

                  <div>
                    <label htmlFor={id("phone")} className={labelCls}>
                      Téléphone <span className="text-cobalt">*</span>
                    </label>
                    <input
                      id={id("phone")}
                      type="tel"
                      required
                      autoComplete="tel"
                      placeholder="Ex. 0555 12 34 56"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        clearError("phone");
                      }}
                      aria-invalid={Boolean(errors.phone)}
                      className={cn(fieldCls(errors.phone), "mt-1.5")}
                    />
                    <FieldError message={errors.phone} />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor={id("email")} className={labelCls}>
                      E-mail <span className="text-cobalt">*</span>
                    </label>
                    <input
                      id={id("email")}
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="vous@exemple.com — pour recevoir le devis"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearError("email");
                      }}
                      aria-invalid={Boolean(errors.email)}
                      className={cn(fieldCls(errors.email), "mt-1.5")}
                    />
                    <FieldError message={errors.email} />
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-6">
                  <div>
                    <span id={`${id("destinations")}-label`} className={labelCls}>
                      Destinations <span className="text-cobalt">*</span>
                    </span>
                    <div
                      role="group"
                      aria-labelledby={`${id("destinations")}-label`}
                      className="mt-2.5 flex flex-wrap gap-2"
                    >
                      {destinations.map((d) => (
                        <ChipToggle
                          key={d.slug}
                          tone="night"
                          active={selectedDestinations.includes(d.slug)}
                          onClick={() => toggleDestination(d.slug)}
                        >
                          {d.title}
                        </ChipToggle>
                      ))}
                      <ChipToggle
                        tone="night"
                        active={selectedDestinations.includes(OTHER_DESTINATION)}
                        onClick={() => toggleDestination(OTHER_DESTINATION)}
                      >
                        Je ne sais pas encore
                      </ChipToggle>
                    </div>
                    <FieldError message={errors.destinations} />
                  </div>

                  {/* Départs organisés : sélection unique, optionnelle */}
                  {voyages.length > 0 ? (
                    <div>
                      <span id={`${id("voyage")}-label`} className={labelCls}>
                        Voyage organisé{optionalHint}
                      </span>
                      <p className="mt-0.5 text-xs text-night-muted">
                        Un départ en groupe déjà programmé ? Sélectionnez-le,
                        sinon laissez vide.
                      </p>
                      <Dropdown
                        id={id("voyage")}
                        ariaLabel="Voyage organisé"
                        tone="vitrine"
                        placeholder="Aucun voyage organisé"
                        value={voyage}
                        onChange={setVoyage}
                        options={[
                          { value: "", label: "Aucun voyage organisé" },
                          ...voyages.map((v) => ({ value: v.slug, label: v.title })),
                        ]}
                        className="mt-2.5"
                      />
                    </div>
                  ) : null}

                  {offers.length > 0 ? (
                    <div>
                      <span id={`${id("offers")}-label`} className={labelCls}>
                        Offres concernées{optionalHint}
                      </span>
                      <p className="mt-0.5 text-xs text-night-muted">
                        Plusieurs choix possibles.
                      </p>
                      <div
                        role="group"
                        aria-labelledby={`${id("offers")}-label`}
                        className="mt-2.5 flex flex-wrap gap-2"
                      >
                        {offers.map((o) => (
                          <ChipToggle
                            key={o.slug}
                            tone="cobalt"
                            active={selectedOffers.includes(o.slug)}
                            onClick={() => toggleOffer(o.slug)}
                          >
                            {o.title}
                          </ChipToggle>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <span id={`${id("dates")}-label`} className={labelCls}>
                      Dates <span className="text-cobalt">*</span>
                    </span>
                    <RangeCalendar
                      idPrefix={id("dates")}
                      value={range}
                      invalid={Boolean(errors.departureDate || errors.returnDate)}
                      onChange={(v) => {
                        setRange(v);
                        clearError("departureDate");
                        clearError("returnDate");
                      }}
                      className="mt-1.5"
                    />
                    <FieldError message={errors.departureDate ?? errors.returnDate} />
                  </div>

                  <div>
                    <label htmlFor={id("departureCity")} className={labelCls}>
                      Ville de départ <span className="text-cobalt">*</span>
                    </label>
                    <input
                      id={id("departureCity")}
                      type="text"
                      required
                      autoComplete="address-level2"
                      placeholder="Ex. Sétif, Alger…"
                      value={departureCity}
                      onChange={(e) => {
                        setDepartureCity(e.target.value);
                        clearError("departureCity");
                      }}
                      aria-invalid={Boolean(errors.departureCity)}
                      className={cn(fieldCls(errors.departureCity), "mt-1.5")}
                    />
                    <FieldError message={errors.departureCity} />
                  </div>

                  {/* Voyageurs : carte groupée, contrôles alignés à droite */}
                  <fieldset className="rounded-2xl border border-ice">
                    <legend className="sr-only">Voyageurs</legend>
                    <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
                      <span className="min-w-0">
                        <span id={id("adults")} className="block text-sm font-semibold text-night">
                          Adultes <span className="text-cobalt">*</span>
                        </span>
                        <span className="mt-0.5 block text-xs text-night-muted">
                          18 ans et plus
                        </span>
                      </span>
                      <div className="flex shrink-0 items-center gap-4">
                        <button
                          type="button"
                          aria-label="Retirer un adulte"
                          aria-describedby={id("adults")}
                          onClick={() => setAdults((v) => Math.max(1, v - 1))}
                          disabled={adults <= 1}
                          className="grid h-11 w-11 place-items-center rounded-full border border-ice-strong bg-white text-night transition-colors hover:bg-ice/60 disabled:opacity-40"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span
                          aria-live="polite"
                          className="w-8 text-center text-lg font-bold text-night tabular-nums"
                        >
                          {adults}
                        </span>
                        <button
                          type="button"
                          aria-label="Ajouter un adulte"
                          aria-describedby={id("adults")}
                          onClick={() => setAdults((v) => Math.min(30, v + 1))}
                          disabled={adults >= 30}
                          className="grid h-11 w-11 place-items-center rounded-full border border-ice-strong bg-white text-night transition-colors hover:bg-ice/60 disabled:opacity-40"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="border-t border-ice" />
                    <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
                      <span className="min-w-0">
                        <span id={id("children")} className="block text-sm font-semibold text-night">
                          Enfants{optionalHint}
                        </span>
                        <span className="mt-0.5 block text-xs text-night-muted">
                          Moins de 18 ans
                        </span>
                      </span>
                      <div className="flex shrink-0 items-center gap-4">
                        <button
                          type="button"
                          aria-label="Retirer un enfant"
                          aria-describedby={id("children")}
                          onClick={() => setChildren((v) => Math.max(0, v - 1))}
                          disabled={children <= 0}
                          className="grid h-11 w-11 place-items-center rounded-full border border-ice-strong bg-white text-night transition-colors hover:bg-ice/60 disabled:opacity-40"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span
                          aria-live="polite"
                          className="w-8 text-center text-lg font-bold text-night tabular-nums"
                        >
                          {children}
                        </span>
                        <button
                          type="button"
                          aria-label="Ajouter un enfant"
                          aria-describedby={id("children")}
                          onClick={() => setChildren((v) => Math.min(30, v + 1))}
                          disabled={children >= 30}
                          className="grid h-11 w-11 place-items-center rounded-full border border-ice-strong bg-white text-night transition-colors hover:bg-ice/60 disabled:opacity-40"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </fieldset>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-6">
                  <div>
                    <span id={`${id("tripType")}-label`} className={labelCls}>
                      Type de voyage <span className="text-cobalt">*</span>
                    </span>
                    <div
                      role="group"
                      aria-labelledby={`${id("tripType")}-label`}
                      className="mt-2.5 grid grid-cols-2 gap-2.5 min-[480px]:grid-cols-4"
                    >
                      {TRIP_TYPES.map((o) => {
                        const card = TRIP_TYPE_CARDS[o.value] ?? { icon: Sparkles, short: o.label };
                        const Icon = card.icon;
                        return (
                          <IconCard
                            key={o.value}
                            icon={Icon}
                            active={tripType === o.value}
                            onClick={() => {
                              setTripType(o.value);
                              clearError("tripType");
                            }}
                          >
                            {card.short}
                          </IconCard>
                        );
                      })}
                    </div>
                    <FieldError message={errors.tripType} />
                  </div>

                  {/* Budget et hébergement : chacun pleine largeur — les
                      6 cartes d'hébergement tiennent sur une ligne en sm+ */}
                  <div>
                    <span id={`${id("budget")}-label`} className={labelCls}>
                      Budget / personne <span className="text-cobalt">*</span>
                    </span>
                    <Dropdown
                      id={id("budget")}
                      ariaLabel="Budget / personne"
                      tone="vitrine"
                      placeholder="Choisir une fourchette…"
                      value={budget}
                      onChange={(v) => {
                        setBudget(v);
                        clearError("budget");
                      }}
                      options={BUDGET_RANGES.map((o) => ({ value: o.value, label: o.label }))}
                      invalid={Boolean(errors.budget)}
                      className="mt-1.5"
                    />
                    <FieldError message={errors.budget} />
                  </div>

                  <div>
                    <span id={`${id("accommodation")}-label`} className={labelCls}>
                      Hébergement <span className="text-cobalt">*</span>
                    </span>
                    <div
                      role="group"
                      aria-labelledby={`${id("accommodation")}-label`}
                      className="mt-2.5 grid grid-cols-3 gap-2.5 sm:grid-cols-6"
                    >
                      {ACCOMMODATIONS.map((o) => {
                        const Icon = ACCOMMODATION_CARDS[o.value] ?? CircleHelp;
                        return (
                          <IconCard
                            key={o.value}
                            icon={Icon}
                            active={accommodation === o.value}
                            onClick={() => {
                              setAccommodation(o.value);
                              clearError("accommodation");
                            }}
                          >
                            {o.label}
                          </IconCard>
                        );
                      })}
                    </div>
                    <FieldError message={errors.accommodation} />
                  </div>

                  <div>
                    <label htmlFor={id("notes")} className={labelCls}>
                      Demandes spéciales{optionalHint}
                    </label>
                    <textarea
                      id={id("notes")}
                      rows={4}
                      placeholder="Envies particulières, étapes à ne pas manquer, contraintes d'horaires…"
                      value={notes}
                      onChange={(e) => {
                        setNotes(e.target.value);
                        clearError("notes");
                      }}
                      aria-invalid={Boolean(errors.notes)}
                      className={cn(fieldCls(errors.notes), "mt-1.5 resize-y")}
                    />
                    <FieldError message={errors.notes} />
                  </div>

                  {/* ——— Récap « boarding pass » (identité nuit) ——— */}
                  <div className="overflow-hidden rounded-2xl bg-night">
                    <div className="px-5 pt-4 pb-4 sm:px-6">
                      <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-citrine uppercase">
                        Récapitulatif
                      </p>
                      <dl className="mt-3 grid gap-x-8 gap-y-3 font-mono text-[13px] sm:grid-cols-2">
                        {[
                          { k: "Passager", v: fullName || "—" },
                          { k: "Téléphone", v: phone || "—" },
                          { k: "Itinéraire", v: rangeLabel ?? "—" },
                          { k: "Départ de", v: departureCity || "—" },
                          {
                            k: "Voyageurs",
                            v: `${adults} adulte${adults > 1 ? "s" : ""}${
                              children > 0 ? ` + ${children} enfant${children > 1 ? "s" : ""}` : ""
                            }`,
                          },
                          { k: "Budget / pers.", v: budget ? labelOf(BUDGET_RANGES, budget) : "—" },
                          {
                            k: "Destinations",
                            v: selectedDestinations.map(destinationTitle).join(" · ") || "—",
                            wide: true,
                          },
                          ...(selectedOffers.length > 0
                            ? [
                                {
                                  k: "Offres",
                                  v: offers
                                    .filter((o) => selectedOffers.includes(o.slug))
                                    .map((o) => o.title)
                                    .join(" · "),
                                  wide: true,
                                },
                              ]
                            : []),
                          ...(voyage
                            ? [
                                {
                                  k: "Voyage organisé",
                                  v:
                                    voyages.find((v) => v.slug === voyage)?.title ??
                                    voyage,
                                  wide: true,
                                },
                              ]
                            : []),
                          {
                            k: "Hébergement",
                            v: accommodation ? labelOf(ACCOMMODATIONS, accommodation) : "—",
                          },
                        ].map((row) => (
                          <div key={row.k} className={cn(row.wide && "sm:col-span-2")}>
                            <dt className="text-[10px] font-bold tracking-[0.14em] text-white/45 uppercase">
                              {row.k}
                            </dt>
                            <dd className="mt-0.5 text-white/90">{row.v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    {/* Signature « billet » : code-barres décoratif */}
                    <div
                      aria-hidden
                      className="h-6 bg-white opacity-90"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(90deg, var(--color-night) 0 2px, transparent 2px 5px, var(--color-night) 5px 8px, transparent 8px 10px, var(--color-night) 10px 11px, transparent 11px 15px)",
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Honeypot anti-spam : invisible et insensible à l'autofill (readOnly),
          les bots le remplissent via JS — faux succès côté API. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={id("website")}>Ne pas remplir</label>
        <input
          id={id("website")}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          readOnly
        />
      </div>

      {/* ——— Navigation du wizard ——— */}
      <div className="flex flex-col-reverse gap-3 rounded-b-[28px] border-t border-ice bg-page/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="font-mono text-xs text-night-faint">N° {reference}</p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full px-5 py-3 text-sm font-semibold text-night-soft transition-colors hover:bg-ice/60 hover:text-night sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Précédent
            </button>
          ) : null}

          {step < 2 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-night px-7 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-night-soft active:scale-[0.98] sm:w-auto"
            >
              Suivant
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-citrine px-7 py-3.5 text-[15px] font-semibold text-night transition-all hover:bg-citrine-hover active:scale-[0.98] disabled:opacity-60 sm:w-auto"
            >
              {status === "sending" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
              {status === "sending" ? "Envoi en cours…" : "Confirmer ma demande"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
