"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { Voyage } from "@/db/schema";
import type { FormState } from "@/lib/form-state";
import { emptyFormState } from "@/lib/form-state";
import { createVoyage, updateVoyage } from "@/lib/actions/voyages";
import { fieldErrorsOf, linesOf, voyageSchema } from "@/lib/voyage-schema";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { GalleryUpload } from "@/components/ui/gallery-upload";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";

/** Champs textuels contrôlés du formulaire (liste + dates en ISO). */
type FieldName =
  | "title"
  | "slug"
  | "description"
  | "price"
  | "departureDate"
  | "returnDate"
  | "program"
  | "included"
  | "excluded"
  | "sortOrder";

const FIELD_IDS: Record<FieldName, string> = {
  title: "title",
  slug: "slug",
  description: "description",
  price: "price",
  departureDate: "departureDate",
  returnDate: "returnDate",
  program: "program",
  included: "included",
  excluded: "excluded",
  sortOrder: "sortOrder",
};

/**
 * Formulaire voyage organisé — création ("create") et édition ("edit").
 * Champs contrôlés + validation zod partagée (lib/voyage-schema) : retour
 * immédiat à la sortie de champ / à la saisie, sans attendre
 * l'enregistrement — et aucune saisie effacée si une erreur serveur remonte
 * (les champs contrôlés ne sont pas réinitialisés par l'action).
 * Le slug est auto-généré depuis le titre si laissé vide ; les listes
 * (galerie, inclus, non inclus) sont « une valeur par ligne ».
 */
export function VoyageForm({ voyage }: { voyage?: Voyage }) {
  const isEdit = Boolean(voyage);
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    isEdit
      ? async (_prev, formData) => updateVoyage(voyage!.id, formData)
      : async (_prev, formData) => createVoyage(formData),
    emptyFormState,
  );

  useEffect(() => {
    if (state.status === "success" && !isEdit) {
      router.push("/admin/voyages");
    }
  }, [state, isEdit, router]);

  /* ——— Champs contrôlés ——— */
  const [values, setValues] = useState<Record<FieldName, string>>({
    title: voyage?.title ?? "",
    slug: voyage?.slug ?? "",
    description: voyage?.description ?? "",
    price: voyage?.price ?? "",
    departureDate: voyage?.departureDate ?? "",
    returnDate: voyage?.returnDate ?? "",
    program: voyage?.program ?? "",
    included: (voyage?.included ?? []).join("\n"),
    excluded: (voyage?.excluded ?? []).join("\n"),
    sortOrder: String(voyage?.sortOrder ?? 0),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const touchedRef = useRef<Record<string, boolean>>({});

  /** Objet d'entrée du schéma (les listes sortent en tableaux ; published
      n'a aucune règle : valeur factice). */
  function collect() {
    return {
      title: values.title,
      slug: values.slug,
      description: values.description,
      price: values.price,
      departureDate: values.departureDate,
      returnDate: values.returnDate,
      program: values.program,
      included: linesOf(values.included),
      excluded: linesOf(values.excluded),
      sortOrder: values.sortOrder,
      published: voyage?.published ?? true,
    };
  }

  function validate(): Record<string, string> {
    const parsed = voyageSchema.safeParse(collect());
    return parsed.success ? {} : fieldErrorsOf(parsed.error);
  }

  /** Rafraîchit les erreurs affichées : champ touché en argument, ou tous
      les champs déjà touchés/en erreur. */
  function refreshErrors(fields?: string[]) {
    const all = validate();
    setErrors((prev) => {
      const keys = fields ?? [...new Set([...Object.keys(prev), ...Object.keys(touchedRef.current)])];
      const next: Record<string, string> = {};
      for (const key of keys) {
        if (all[key]) next[key] = all[key];
      }
      return next;
    });
    return all;
  }

  function setField(name: FieldName, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
    // Retour immédiat : le champ affiché en erreur se corrige à la saisie ;
    // le retour dépendant du départ (retour > départ) se met à jour aussi.
    const related = name === "departureDate" && errors.returnDate ? ["returnDate"] : [];
    if (errors[name] || related.length > 0) {
      refreshErrors([name, ...related]);
    }
  }

  function onBlurField(name: FieldName) {
    touchedRef.current[name] = true;
    refreshErrors([name]);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const all = validate();
    if (Object.keys(all).length > 0) {
      // Bloque l'envoi : tous les retours s'affichent sans rien effacer.
      event.preventDefault();
      for (const key of Object.keys(all)) touchedRef.current[key] = true;
      setErrors(all);
      const firstKey = Object.keys(all).find((k) => k in FIELD_IDS) ?? Object.keys(all)[0];
      const el = document.getElementById(FIELD_IDS[firstKey as FieldName] ?? firstKey);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el instanceof HTMLElement) el.focus({ preventScroll: true });
    }
  }

  const fe = errors;
  const feServer = state.status === "error" ? state.fieldErrors : {};
  const merged = { ...feServer, ...fe };

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="space-y-5">
      {state.status === "error" && (
        <Alert tone="error">{state.message}</Alert>
      )}
      {state.status === "success" && (
        <Alert tone="success">{state.message}</Alert>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Titre" htmlFor="title" error={fe.title ?? feServer.title}>
          <Input
            id="title"
            name="title"
            required
            value={values.title}
            onChange={(e) => setField("title", e.target.value)}
            onBlur={() => onBlurField("title")}
            placeholder="Ex. : Cappadoce — 8 jours en groupe"
            invalid={Boolean(merged.title)}
          />
        </Field>

        <Field
          label="Slug (URL)"
          htmlFor="slug"
          hint="Laisser vide pour le générer depuis le titre."
          error={fe.slug ?? feServer.slug}
        >
          <Input
            id="slug"
            name="slug"
            value={values.slug}
            onChange={(e) => setField("slug", e.target.value)}
            onBlur={() => onBlurField("slug")}
            placeholder="cappadoce-8-jours"
            invalid={Boolean(merged.slug)}
          />
        </Field>
      </div>

      <Field label="Description" htmlFor="description" error={fe.description ?? feServer.description}>
        <Textarea
          id="description"
          name="description"
          rows={4}
          value={values.description}
          onChange={(e) => setField("description", e.target.value)}
          onBlur={() => onBlurField("description")}
          placeholder="Décrivez le voyage en quelques phrases (affiché sur la carte et la modale)…"
          invalid={Boolean(merged.description)}
        />
      </Field>

      {/* Dates : un sélecteur maison par date (jj/mm/aaaa) — chaque champ
          dans sa propre colonne, aucun débordement quel que soit l'écran. */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Date de départ"
          htmlFor="departureDate"
          hint="Optionnelle — affichée sur les cartes et la modale."
          error={fe.departureDate ?? feServer.departureDate}
        >
          <DatePicker
            id="departureDate"
            name="departureDate"
            ariaLabel="Date de départ"
            value={values.departureDate}
            invalid={Boolean(merged.departureDate)}
            onChange={(iso) => {
              setField("departureDate", iso);
              onBlurField("departureDate");
            }}
          />
        </Field>

        <Field
          label="Date de retour"
          htmlFor="returnDate"
          hint="Optionnelle — après le départ."
          error={fe.returnDate ?? feServer.returnDate}
        >
          <DatePicker
            id="returnDate"
            name="returnDate"
            ariaLabel="Date de retour"
            value={values.returnDate}
            invalid={Boolean(merged.returnDate)}
            onChange={(iso) => {
              setField("returnDate", iso);
              onBlurField("returnDate");
            }}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Prix affiché"
          htmlFor="price"
          hint="Texte libre, ex. « À partir de 89 000 DA ». Vide = « Sur devis »."
          error={fe.price ?? feServer.price}
        >
          <Input
            id="price"
            name="price"
            value={values.price}
            onChange={(e) => setField("price", e.target.value)}
            onBlur={() => onBlurField("price")}
            placeholder="À partir de 89 000 DA"
            invalid={Boolean(merged.price)}
          />
        </Field>

        <Field label="Ordre d'affichage" htmlFor="sortOrder" error={fe.sortOrder ?? feServer.sortOrder}>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            max={999}
            value={values.sortOrder}
            onChange={(e) => setField("sortOrder", e.target.value)}
            onBlur={() => onBlurField("sortOrder")}
            invalid={Boolean(merged.sortOrder)}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-5 rounded-xl border border-line bg-page p-4">
        <ImageUpload
          name="imageUrl"
          defaultValue={voyage?.imageUrl ?? ""}
          label="Image de couverture"
          hint="JPG/PNG/WebP — compressée et convertie en WebP automatiquement (8 Mo max)."
        />
        <div id="galleryImages">
          <GalleryUpload
            name="galleryImages"
            defaultValue={voyage?.galleryImages ?? []}
            max={6}
            label="Photos de la galerie"
            hint="Jusqu'à 6 photos — même compression WebP automatique."
          />
        </div>
        <Switch
          name="published"
          defaultChecked={voyage?.published ?? true}
          label="Publié"
          hint="Les voyages dépubliés ne sont pas visibles sur le site public."
        />
      </div>

      <Field
        label="Programme (jour par jour)"
        htmlFor="program"
        hint="Une ligne par jour, ex. « J1 – Istanbul : arrivée et quartier historique »."
        error={fe.program ?? feServer.program}
      >
        <Textarea
          id="program"
          name="program"
          rows={6}
          value={values.program}
          onChange={(e) => setField("program", e.target.value)}
          onBlur={() => onBlurField("program")}
          placeholder={"J1 – Istanbul : arrivée et quartier historique\nJ2 – Cappadoce : vol en montgolfière…"}
          invalid={Boolean(merged.program)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Inclus"
          htmlFor="included"
          hint="Un élément par ligne (vols, hôtel, guides…)."
          error={fe.included ?? feServer.included}
        >
          <Textarea
            id="included"
            name="included"
            rows={5}
            value={values.included}
            onChange={(e) => setField("included", e.target.value)}
            onBlur={() => onBlurField("included")}
            placeholder={"Vols A/R au départ de Sétif\nHôtel 4* avec petit-déjeuner"}
            invalid={Boolean(merged.included)}
          />
        </Field>

        <Field
          label="Non inclus"
          htmlFor="excluded"
          hint="Un élément par ligne (visas, dépenses personnelles…)."
          error={fe.excluded ?? feServer.excluded}
        >
          <Textarea
            id="excluded"
            name="excluded"
            rows={5}
            value={values.excluded}
            onChange={(e) => setField("excluded", e.target.value)}
            onBlur={() => onBlurField("excluded")}
            placeholder={"Visa\nDépenses personnelles"}
            invalid={Boolean(merged.excluded)}
          />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
        <Link href="/admin/voyages">
          <Button variant="secondary" type="button">
            Annuler
          </Button>
        </Link>
        <Button type="submit" loading={isPending}>
          {isPending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer le voyage"}
        </Button>
      </div>
    </form>
  );
}
