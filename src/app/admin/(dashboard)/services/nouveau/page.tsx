import type { Metadata } from "next";

import { ServiceForm } from "../service-form";

import { BackLink } from "@/components/ui/back-link";

export const metadata: Metadata = {
  title: "Nouveau service — Administration",
};

export default function NewServicePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/admin/services" label="Retour aux services" />
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Nouveau service</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Renseignez les informations du service à afficher sur le site.
        </p>
      </header>
      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        <ServiceForm />
      </div>
    </div>
  );
}
