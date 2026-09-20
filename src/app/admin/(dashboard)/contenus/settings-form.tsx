"use client";

import { useActionState } from "react";

import type { SiteSettings } from "@/db/schema";
import { updateSettings } from "@/lib/actions/settings";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { emptyFormState, type FormState } from "@/lib/form-state";

/** Champs éditables de la ligne unique site_settings (colonnes nullables normalisées en ""). */
export type SettingsFormValues = Pick<
  SiteSettings,
  | "heroTitle"
  | "heroText"
  | "aboutText"
  | "phone"
  | "address"
  | "seoTitle"
  | "seoDescription"
> & {
  logoUrl: string;
  heroImageUrl: string;
  facebookUrl: string;
  instagramUrl: string;
};

/**
 * Formulaire d'édition des contenus du site public (ligne unique id = 1),
 * organisé en 4 sections : accueil, à propos, coordonnées & réseaux, SEO.
 */
export function SettingsForm({ settings }: { settings: SettingsFormValues }) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => updateSettings(formData),
    emptyFormState,
  );

  const fe = state.status === "error" ? state.fieldErrors : {};

  return (
    <form action={formAction} className="space-y-6">
      {state.status === "error" && <Alert tone="error">{state.message}</Alert>}
      {state.status === "success" && <Alert tone="success">{state.message}</Alert>}

      {/* ——— Page d'accueil ——— */}
      <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-base font-semibold">Page d&apos;accueil</h2>
        <div className="mt-4 space-y-5">
          <Field label="Titre principal" htmlFor="heroTitle" error={fe.heroTitle}>
            <Input
              id="heroTitle"
              name="heroTitle"
              required
              defaultValue={settings.heroTitle}
              placeholder="Üsküdar Travel — Voyages organisés & sur-mesure"
              invalid={Boolean(fe.heroTitle)}
            />
          </Field>

          <Field label="Texte d'accueil" htmlFor="heroText" error={fe.heroText}>
            <Textarea
              id="heroText"
              name="heroText"
              rows={5}
              required
              defaultValue={settings.heroText}
              placeholder="Présentez l'agence en quelques phrases…"
              invalid={Boolean(fe.heroText)}
            />
          </Field>

          <div>
            <h3 className="mb-3 text-sm font-medium text-ink">Bannière hero</h3>
            <div className="rounded-xl border border-line bg-page p-4">
              <ImageUpload
                name="heroImageUrl"
                defaultValue={settings.heroImageUrl}
                label="Bannière de la page d'accueil"
                hint="Grande image de bannière de la page d'accueil — compressée et convertie en WebP automatiquement."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ——— À propos ——— */}
      <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-base font-semibold">À propos</h2>
        <div className="mt-4 space-y-5">
          <Field label="Texte de la page « À propos »" htmlFor="aboutText" error={fe.aboutText}>
            <Textarea
              id="aboutText"
              name="aboutText"
              rows={7}
              required
              defaultValue={settings.aboutText}
              placeholder="Histoire, équipe, engagements…"
              invalid={Boolean(fe.aboutText)}
            />
          </Field>
        </div>
      </section>

      {/* ——— Coordonnées & réseaux ——— */}
      <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-base font-semibold">Coordonnées &amp; réseaux</h2>
        <div className="mt-4 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Téléphone" htmlFor="phone" error={fe.phone}>
              <Input
                id="phone"
                name="phone"
                required
                defaultValue={settings.phone}
                placeholder="0770505715"
                invalid={Boolean(fe.phone)}
              />
            </Field>

            <Field
              label="Adresse"
              htmlFor="address"
              hint="Plus Code ou adresse affichée sur le site et la carte."
              error={fe.address}
            >
              <Input
                id="address"
                name="address"
                defaultValue={settings.address}
                placeholder="6C23+XHW, Sétif"
                invalid={Boolean(fe.address)}
              />
            </Field>
          </div>

          <div className="rounded-xl border border-line bg-page p-4">
            <ImageUpload
              name="logoUrl"
              defaultValue={settings.logoUrl}
              label="Logo du site"
              hint="Affiché dans l'en-tête du site public. Vide = nom seul."
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Page Facebook" htmlFor="facebookUrl" error={fe.facebookUrl}>
              <Input
                id="facebookUrl"
                name="facebookUrl"
                defaultValue={settings.facebookUrl}
                placeholder="https://facebook.com/…"
                invalid={Boolean(fe.facebookUrl)}
              />
            </Field>

            <Field label="Compte Instagram" htmlFor="instagramUrl" error={fe.instagramUrl}>
              <Input
                id="instagramUrl"
                name="instagramUrl"
                defaultValue={settings.instagramUrl}
                placeholder="https://instagram.com/…"
                invalid={Boolean(fe.instagramUrl)}
              />
            </Field>
          </div>
        </div>
      </section>

      {/* ——— SEO ——— */}
      <section className="rounded-xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-base font-semibold">SEO</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Titre et description par défaut des moteurs de recherche.
        </p>
        <div className="mt-4 space-y-5">
          <Field label="Titre SEO" htmlFor="seoTitle" error={fe.seoTitle}>
            <Input
              id="seoTitle"
              name="seoTitle"
              defaultValue={settings.seoTitle}
              placeholder="Üsküdar Travel — Agence de voyage à Sétif"
              invalid={Boolean(fe.seoTitle)}
            />
          </Field>

          <Field label="Description SEO" htmlFor="seoDescription" error={fe.seoDescription}>
            <Textarea
              id="seoDescription"
              name="seoDescription"
              rows={3}
              defaultValue={settings.seoDescription}
              placeholder="Voyages organisés et sur-mesure depuis Sétif…"
              invalid={Boolean(fe.seoDescription)}
            />
          </Field>
        </div>
      </section>

      {/* ——— Actions ——— */}
      <div className="sticky bottom-4 z-10 flex items-center justify-end rounded-xl border border-line bg-surface px-4 py-3 shadow-sm">
        <Button type="submit" loading={isPending}>
          {isPending ? "Enregistrement…" : "Enregistrer les modifications"}
        </Button>
      </div>
    </form>
  );
}
