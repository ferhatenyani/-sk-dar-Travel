import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { ChevronRight, Inbox } from "lucide-react";

import { db } from "@/db";
import { gallerySections, TRIP_STATUSES, tripRequests, type TripStatus } from "@/db/schema";
import { formatDate, formatDateTime, StatusBadge, TRIP_STATUS_LABELS } from "./status";

export const metadata: Metadata = {
  title: "Demandes de voyage — Administration",
};

/** Filtre par statut via ?statut= (liens des onglets). */
function isStatus(value: string | undefined): value is TripStatus {
  return (TRIP_STATUSES as readonly string[]).includes(value ?? "");
}

export default async function DemandesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut } = await searchParams;
  const filter = isStatus(statut) ? statut : undefined;

  const [counts, rows, sections] = await Promise.all([
    db
      .select({ status: tripRequests.status, count: sql<number>`count(*)::int` })
      .from(tripRequests)
      .groupBy(tripRequests.status),
    db
      .select()
      .from(tripRequests)
      .where(filter ? eq(tripRequests.status, filter) : undefined)
      .orderBy(desc(tripRequests.createdAt), desc(tripRequests.id))
      .limit(200),
    // Toutes les sections (même dépubliées) : les anciennes demandes restent lisibles.
    db.select({ slug: gallerySections.slug, title: gallerySections.title }).from(gallerySections),
  ]);

  /** Slug destination → titre affichable (« autre » = choix libre). */
  const destinationTitle = (slug: string) =>
    slug === "autre"
      ? "À définir"
      : (sections.find((s) => s.slug === slug)?.title ?? slug);

  const countOf = (status: TripStatus) =>
    counts.find((c) => c.status === status)?.count ?? 0;
  const total = counts.reduce((sum, c) => sum + c.count, 0);

  const tabs: { value?: TripStatus; label: string; count: number }[] = [
    { label: "Toutes", count: total },
    ...TRIP_STATUSES.map((s) => ({
      value: s,
      label: TRIP_STATUS_LABELS[s],
      count: countOf(s),
    })),
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Demandes de voyage</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Demandes de devis envoyées via « Composer mon voyage » — à traiter par
          téléphone ou par e-mail.
        </p>
      </header>

      {/* Onglets de filtre par statut */}
      <nav aria-label="Filtrer par statut" className="mb-4 flex flex-wrap gap-1.5">
        {tabs.map((tab) => {
          const active = filter === tab.value || (!filter && !tab.value);
          const href = tab.value ? `/admin/demandes?statut=${tab.value}` : "/admin/demandes";
          return (
            <Link
              key={tab.label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-navy bg-navy text-white"
                  : "border-line bg-surface text-ink-secondary hover:border-navy-border hover:text-navy"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 text-xs tabular-nums ${
                  active ? "bg-white/20" : "bg-page text-ink-muted"
                }`}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center">
          <Inbox className="mx-auto size-8 text-ink-faint" />
          <p className="mt-3 text-sm font-medium text-ink">Aucune demande</p>
          <p className="mt-1 text-sm text-ink-muted">
            {filter
              ? `Aucune demande « ${TRIP_STATUS_LABELS[filter]} » pour le moment.`
              : "Les demandes envoyées depuis le formulaire du site apparaîtront ici."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((d) => (
            <li key={d.id}>
              <Link
                href={`/admin/demandes/${d.id}`}
                className="group block rounded-xl border border-line bg-surface p-4 shadow-sm transition-colors hover:border-navy-border hover:bg-navy-soft/30 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{d.fullName}</p>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {d.phone}
                      {d.email ? ` · ${d.email}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {d.offerTitles.length > 0 ? (
                      <span className="inline-flex items-center rounded-full border border-line bg-page px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-ink-secondary">
                        {d.offerTitles.length} offre{d.offerTitles.length > 1 ? "s" : ""}
                      </span>
                    ) : null}
                    <StatusBadge status={d.status} />
                    <ChevronRight className="size-4 text-ink-faint transition-colors group-hover:text-navy" />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-secondary">
                  <span className="font-medium">
                    {d.destinations.map(destinationTitle).join(", ") || "—"}
                  </span>
                  {d.departureDate ? (
                    <>
                      <span className="text-ink-faint">·</span>
                      <span>
                        Départ {formatDate(d.departureDate)}
                        {d.returnDate ? ` → retour ${formatDate(d.returnDate)}` : ""}
                      </span>
                    </>
                  ) : null}
                  {d.adults != null ? (
                    <>
                      <span className="text-ink-faint">·</span>
                      <span>
                        {d.adults} adulte{d.adults > 1 ? "s" : ""}
                        {d.children ? ` + ${d.children} enfant${d.children > 1 ? "s" : ""}` : ""}
                      </span>
                    </>
                  ) : null}
                </div>

                <p className="mt-2 text-xs text-ink-faint">
                  Reçue le {formatDateTime(d.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
