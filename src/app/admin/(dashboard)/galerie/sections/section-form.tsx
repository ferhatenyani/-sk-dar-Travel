"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import type { GallerySection } from "@/db/schema";
import type { FormState } from "@/lib/form-state";
import { emptyFormState } from "@/lib/form-state";
import { createSection, updateSection } from "@/lib/actions/gallery";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

/**
 * Formulaire section — création ("create") et édition ("edit").
 * Le slug est auto-généré depuis le titre si laissé vide.
 */
export function SectionForm({ section }: { section?: GallerySection }) {
  const isEdit = Boolean(section);
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    isEdit
      ? async (_prev, formData) => updateSection(section!.id, formData)
      : async (_prev, formData) => createSection(formData),
    emptyFormState,
  );

  useEffect(() => {
    if (state.status === "success" && !isEdit) {
      router.push("/admin/galerie");
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
            defaultValue={section?.title ?? ""}
            placeholder="Ex. : Nos destinations phares"
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
            defaultValue={section?.slug ?? ""}
            placeholder="nos-destinations-phares"
            invalid={Boolean(fe.slug)}
          />
        </Field>
      </div>

      <Field
        label="Description (optionnelle)"
        htmlFor="description"
        error={fe.description}
      >
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={section?.description ?? ""}
          placeholder="Décrivez cette section de la galerie en quelques phrases…"
          invalid={Boolean(fe.description)}
        />
      </Field>

      <div className="flex flex-col gap-5 rounded-xl border border-line bg-page p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="sm:max-w-[200px] sm:flex-1">
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
              defaultValue={section?.sortOrder ?? 0}
              invalid={Boolean(fe.sortOrder)}
            />
          </Field>
        </div>

        <Switch
          name="published"
          defaultChecked={section?.published ?? true}
          label="Publié"
          hint="Les sections dépubliées ne sont pas visibles sur le site public."
        />
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
        <Link href="/admin/galerie">
          <Button variant="secondary" type="button">
            Annuler
          </Button>
        </Link>
        <Button type="submit" loading={isPending}>
          {isPending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer la section"}
        </Button>
      </div>
    </form>
  );
}
