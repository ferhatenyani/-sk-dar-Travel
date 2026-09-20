import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";

import { db } from "@/db";
import { gallerySections, tripRequests } from "@/db/schema";
import { BackLink } from "@/components/ui/back-link";
import { telHref } from "@/lib/vitrine";
import {
  ACCOMMODATIONS,
  BUDGET_RANGES,
  TRIP_TYPES,
  labelOf,
} from "@/lib/trip-options";
import { DemandeDetailForm } from "../demande-detail-form";
import { StatusBadge, formatDate, formatDateTime } from "../status";

export const metadata: Metadata = {
  title: "Demande de voyage — Administration",
};

export default async function DemandeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const demandeId = Number(id);
  if (!Number.isInteger(demandeId)) notFound();

  const [demande] = await db
    .select()
    .from(tripRequests)
    .where(eq(tripRequests.id, demandeId))
    .limit(1);
  if (!demande) notFound();

  // Titres affichables (demande), même si dépubliés depuis.
  const sections = await db
    .select({ slug: gallerySections.slug, title: gallerySections.title })
    .from(gallerySections);
  const destinationTitle = (slug: string) =>
    slug === "autre"
      ? "À définir"
      : (sections.find((s) => s.slug === slug)?.title ?? slug);

  const facts: { label: string; value: string }[] = [
    {
      label: "Destinations",
      value: demande.destinations.map(destinationTitle).join(", "),
    },
    {
      label: "Offres concernées",
      value: demande.offerTitles.length
        ? demande.offerTitles.join(", ")
        : "Aucune en particulier",
    },
    {
      label: "Voyage organisé",
      value: demande.voyageTitle ?? "Aucun",
    },
    { label: "Ville de départ", value: demande.departureCity },
    { label: "Départ", value: formatDate(demande.departureDate) },
    { label: "Retour", value: demande.returnDate ? formatDate(demande.returnDate) : "—" },
    {
      label: "Voyageurs",
      value: `${demande.adults} adulte${demande.adults > 1 ? "s" : ""}${
        demande.children > 0 ? ` + ${demande.children} enfant${demande.children > 1 ? "s" : ""}` : ""
      }`,
    },
    { label: "Type de voyage", value: labelOf(TRIP_TYPES, demande.tripType) },
    { label: "Budget / personne", value: labelOf(BUDGET_RANGES, demande.budget) },
    { label: "Hébergement", value: labelOf(ACCOMMODATIONS, demande.accommodation) },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <BackLink href="/admin/demandes" label="Retour aux demandes" />

      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{demande.fullName}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Reçue le {formatDateTime(demande.createdAt)}
          </p>
        </div>
        <StatusBadge status={demande.status} />
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[1.25fr_1fr]">
        {/* Le projet de voyage */}
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold">Le voyage demandé</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-xs font-medium tracking-wide text-ink-faint uppercase">
                    {fact.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-ink">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {demande.notes ? (
            <div className="rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold">Demandes spéciales</h2>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-ink-secondary">
                {demande.notes}
              </p>
            </div>
          ) : null}
        </div>

        {/* Contact + suivi */}
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
            <h2 className="text-base font-semibold">Contacter le voyageur</h2>
            <div className="mt-3 space-y-2.5">
              <a
                href={telHref(demande.phone)}
                className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-navy-border hover:text-navy"
              >
                <Phone className="size-4 text-ink-faint" />
                {demande.phone}
              </a>
              <a
                href={`mailto:${demande.email}`}
                className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-navy-border hover:text-navy"
              >
                <Mail className="size-4 shrink-0 text-ink-faint" />
                <span className="truncate">{demande.email}</span>
              </a>
            </div>
          </div>

          <DemandeDetailForm
            id={demande.id}
            status={demande.status}
            adminNote={demande.adminNote}
          />
        </div>
      </div>
    </div>
  );
}
