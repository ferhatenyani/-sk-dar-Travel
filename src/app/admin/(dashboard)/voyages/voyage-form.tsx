"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import type { Voyage } from "@/db/schema";
import type { FormState } from "@/lib/form-state";
import { emptyFormState } from "@/lib/form-state";
import { createVoyage, updateVoyage } from "@/lib/actions/voyages";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { GalleryUpload } from "@/components/ui/gallery-upload";
import { Switch } from "@/components/ui/switch";

/**
 * Formulaire voyage organisé — création ("create") et édition ("edit").
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

  const fe = state.status === "error" ? state.fieldErrors : {};

  return (
    <form action={formAction} className="space-y-5">
      {state.status === "error" && (
        <Alert tone="error">{state.message}</Alert>
      )}
      {state.status === "success" && (
        <Alert tone="success">{state.message}</Alert>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Titre" htmlFor="title" error={fe.title}>
          <Input
            id="title"
            name="title"
            required
            defaultValue={voyage?.title ?? ""}
            placeholder="Ex. : Cappadoce — 8 jours en groupe"
            invalid={Boolean(fe.title)}
          />
        </Field>

        <Field
          label="Slug (URL)"
          htmlFor="slug"
          hint="Laisser vide pour le générer depuis le titre."
          error={fe.slug}
        >
          <Input
            id="slug"
            name="slug"
            defaultValue={voyage?.slug ?? ""}
            placeholder="cappadoce-8-jours"
            invalid={Boolean(fe.slug)}
          />
        </Field>
      </div>

      <Field label="Description" htmlFor="description" error={fe.description}>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={voyage?.description ?? ""}
          placeholder="Décrivez le voyage en quelques phrases (affiché sur la carte et la modale)…"
          invalid={Boolean(fe.description)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Dates de départ et de retour"
          htmlFor="departureDate"
          hint="Optionnelles — affichées sur les cartes et la modale."
          error={fe.departureDate ?? fe.returnDate}
        >
          <div className="flex items-center gap-2">
            <Input
              id="departureDate"
              name="departureDate"
              type="date"
              defaultValue={voyage?.departureDate ?? ""}
              aria-label="Date de départ"
              invalid={Boolean(fe.departureDate)}
            />
            <span className="text-ink-muted">→</span>
            <Input
              name="returnDate"
              type="date"
              defaultValue={voyage?.returnDate ?? ""}
              aria-label="Date de retour"
              invalid={Boolean(fe.returnDate)}
            />
          </div>
        </Field>

        <Field
          label="Prix affiché"
          htmlFor="price"
          hint="Texte libre, ex. « À partir de 89 000 DA ». Vide = « Sur devis »."
          error={fe.price}
        >
          <Input
            id="price"
            name="price"
            defaultValue={voyage?.price ?? ""}
            placeholder="À partir de 89 000 DA"
            invalid={Boolean(fe.price)}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
        <Field
          label="Ordre d'affichage"
          htmlFor="sortOrder"
          error={fe.sortOrder}
        >
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            max={999}
            defaultValue={voyage?.sortOrder ?? 0}
            invalid={Boolean(fe.sortOrder)}
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
        <GalleryUpload
          name="galleryImages"
          defaultValue={voyage?.galleryImages ?? []}
          max={6}
          label="Photos de la galerie"
          hint="Jusqu'à 6 photos — même compression WebP automatique."
        />
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
        error={fe.program}
      >
        <Textarea
          id="program"
          name="program"
          rows={6}
          defaultValue={voyage?.program ?? ""}
          placeholder={"J1 – Istanbul : arrivée et quartier historique\nJ2 – Cappadoce : vol en montgolfière…"}
          invalid={Boolean(fe.program)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Inclus"
          htmlFor="included"
          hint="Un élément par ligne (vols, hôtel, guides…)."
          error={fe.included}
        >
          <Textarea
            id="included"
            name="included"
            rows={5}
            defaultValue={(voyage?.included ?? []).join("\n")}
            placeholder={"Vols A/R au départ de Sétif\nHôtel 4* avec petit-déjeuner"}
            invalid={Boolean(fe.included)}
          />
        </Field>

        <Field
          label="Non inclus"
          htmlFor="excluded"
          hint="Un élément par ligne (visas, dépenses personnelles…)."
          error={fe.excluded}
        >
          <Textarea
            id="excluded"
            name="excluded"
            rows={5}
            defaultValue={(voyage?.excluded ?? []).join("\n")}
            placeholder={"Visa\nDépenses personnelles"}
            invalid={Boolean(fe.excluded)}
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
