import type { Metadata } from "next";

import { VoyageForm } from "../voyage-form";

import { BackLink } from "@/components/ui/back-link";

export const metadata: Metadata = {
  title: "Nouveau voyage organisé — Administration",
};

export default function NewVoyagePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/admin/voyages" label="Retour aux voyages organisés" />
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Nouveau voyage organisé</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Renseignez les informations du départ à afficher sur le site.
        </p>
      </header>
      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        <VoyageForm />
      </div>
    </div>
  );
}
