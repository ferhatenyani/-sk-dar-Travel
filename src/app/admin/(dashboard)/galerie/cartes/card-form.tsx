"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import type { GalleryCard } from "@/db/schema";
import type { FormState } from "@/lib/form-state";
import { emptyFormState } from "@/lib/form-state";
import { createCard, setCardSections, updateCard } from "@/lib/actions/gallery";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";

import { CheckboxItem } from "../checkbox-item";

export type SectionOption = { id: number; title: string };

/**
 * Formulaire carte — création ("create") et édition ("edit").
 * L'image est obligatoire ; en édition, les cases à cocher remplacent
 * l'assignation de la carte aux sections (action setCardSections).
 */
export function CardForm({
  card,
  sections = [],
  assignedSectionIds = [],
}: {
  card?: GalleryCard;
  sections?: SectionOption[];
  assignedSectionIds?: number[];
}) {
  const isEdit = Boolean(card);
  const hasSectionPicker = isEdit && sections.length > 0;
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    isEdit
      ? async (_prev, formData) => {
          const result = await updateCard(card!.id, formData);
          if (result.status === "error") return result;

          const sectionIds = formData
            .getAll("sectionIds")
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value > 0);
          const linkResult = await setCardSections(card!.id, sectionIds);
          if (!linkResult.ok) {
            return { status: "error", message: linkResult.error, fieldErrors: {} };
          }
          return result;
        }
      : async (_prev, formData) => createCard(formData),
    emptyFormState,
  );

  useEffect(() => {
    if (state.status === "success" && !isEdit) {
      router.push("/admin/galerie/cartes");
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

      <Field label="Titre" htmlFor="title" error={fe.title}>
        <Input
          id="title"
          name="title"
          required
          defaultValue={card?.title ?? ""}
          placeholder="Ex. : Casbah d'Alger au coucher du soleil"
          invalid={Boolean(fe.title)}
        />
      </Field>

      <Field
        label="Description (optionnelle)"
        htmlFor="description"
        error={fe.description}
      >
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={card?.description ?? ""}
          placeholder="Légende affichée sous la photo (optionnelle)…"
          invalid={Boolean(fe.description)}
        />
      </Field>

      <div>
        <ImageUpload
          name="imageUrl"
          defaultValue={card?.imageUrl ?? ""}
          label="Image de la carte (obligatoire)"
          hint="JPG/PNG/WebP — compressée et convertie en WebP automatiquement (8 Mo max)."
        />
        {fe.imageUrl && (
          <p role="alert" className="mt-1.5 text-xs text-danger">
            {fe.imageUrl}
          </p>
        )}
      </div>

      <Field
        label="Texte alternatif (accessibilité)"
        htmlFor="alt"
        hint="Décrit l'image pour les lecteurs d'écran et le référencement."
        error={fe.alt}
      >
        <Input
          id="alt"
          name="alt"
          defaultValue={card?.alt ?? ""}
          placeholder="Ex. : Ruelle pavée de la Casbah baignée de lumière dorée"
          invalid={Boolean(fe.alt)}
        />
      </Field>

      {hasSectionPicker && (
        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-ink">
            Sections de la galerie
          </legend>
          <p className="mb-2.5 text-xs text-ink-muted">
            Cochez les sections dans lesquelles cette carte doit apparaître —
            une même carte peut figurer dans plusieurs sections.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {sections.map((section) => (
              <li key={section.id}>
                <CheckboxItem
                  name="sectionIds"
                  value={section.id}
                  label={section.title}
                  hint={assignedSectionIds.includes(section.id) ? "Actuellement associée" : undefined}
                />
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
        <Link href="/admin/galerie/cartes">
          <Button variant="secondary" type="button">
            Annuler
          </Button>
        </Link>
        <Button type="submit" loading={isPending}>
          {isPending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer la carte"}
        </Button>
      </div>
    </form>
  );
}
