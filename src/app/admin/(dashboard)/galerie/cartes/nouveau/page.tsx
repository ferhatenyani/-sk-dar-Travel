import type { Metadata } from "next";

import { CardForm } from "../card-form";

import { BackLink } from "@/components/ui/back-link";

export const metadata: Metadata = {
  title: "Nouvelle carte — Administration",
};

export default function NewCardPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/admin/galerie/cartes" label="Retour aux cartes" />
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Nouvelle carte</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Ajoutez une photo à la galerie — vous pourrez ensuite l&apos;associer
          à une ou plusieurs sections.
        </p>
      </header>
      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        <CardForm />
      </div>
    </div>
  );
}
