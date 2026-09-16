"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import type { Service } from "@/db/schema";
import type { FormState } from "@/lib/form-state";
import { emptyFormState } from "@/lib/form-state";
import { createService, updateService } from "@/lib/actions/services";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { Switch } from "@/components/ui/switch";

/**
 * Formulaire service — utilisé en création (mode "create") et édition ("edit").
 * Le slug est auto-généré depuis le titre si laissé vide.
 */
export function ServiceForm({ service }: { service?: Service }) {
  const isEdit = Boolean(service);
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    isEdit
      ? async (_prev, formData) => updateService(service!.id, formData)
      : async (_prev, formData) => createService(formData),
    emptyFormState,
  );

  useEffect(() => {
    if (state.status === "success" && !isEdit) {
      router.push("/admin/services");
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
            defaultValue={service?.title ?? ""}
            placeholder="Ex. : Voyages organisés"
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
            defaultValue={service?.slug ?? ""}
            placeholder="voyages-organises"
            invalid={Boolean(fe.slug)}
          />
        </Field>
      </div>

      <Field label="Description" htmlFor="description" error={fe.description}>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={service?.description ?? ""}
          placeholder="Décrivez ce service en quelques phrases…"
          invalid={Boolean(fe.description)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Prix affiché"
          htmlFor="price"
          hint="Texte libre, ex. « À partir de 45 000 DA ». Vide = non affiché."
          error={fe.price}
        >
          <Input
            id="price"
            name="price"
            defaultValue={service?.price ?? ""}
            placeholder="À partir de 45 000 DA"
            invalid={Boolean(fe.price)}
          />
        </Field>

        <Field label="Ordre d'affichage" htmlFor="sortOrder" error={fe.sortOrder}>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            max={999}
            defaultValue={service?.sortOrder ?? 0}
            invalid={Boolean(fe.sortOrder)}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-5 rounded-xl border border-line bg-page p-4">
        <ImageUpload
          name="imageUrl"
          defaultValue={service?.imageUrl ?? ""}
          label="Image du service"
          hint="JPG/PNG/WebP — compressée et convertie en WebP automatiquement (8 Mo max)."
        />
        <Switch
          name="published"
          defaultChecked={service?.published ?? true}
          label="Publié"
          hint="Les services dépubliés ne sont pas visibles sur le site public."
        />
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
        <Link href="/admin/services">
          <Button variant="secondary" type="button">
            Annuler
          </Button>
        </Link>
        <Button type="submit" loading={isPending}>
          {isPending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer le service"}
        </Button>
      </div>
    </form>
  );
}
