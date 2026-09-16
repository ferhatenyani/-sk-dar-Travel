import type { Metadata } from "next";

import { SectionForm } from "../section-form";

import { BackLink } from "@/components/ui/back-link";

export const metadata: Metadata = {
  title: "Nouvelle section — Administration",
};

export default function NewSectionPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/admin/galerie" label="Retour à la galerie" />
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Nouvelle section</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Créez une section thématique, puis associez-y des cartes photo.
        </p>
      </header>
      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        <SectionForm />
      </div>
    </div>
  );
}
