import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { asc } from "drizzle-orm";

import { db } from "@/db";
import { voyages } from "@/db/schema";
import { moveVoyage } from "@/lib/actions/voyages";
import { voyageDatesLabel } from "@/lib/voyages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@/components/ui/icons";
import { EditLink, MoveButtons } from "../services/row-actions";
import { DeleteVoyageButton } from "./row-actions";

export const metadata: Metadata = {
  title: "Voyages organisés — Administration",
};

export default async function VoyagesPage() {
  const rows = await db
    .select()
    .from(voyages)
    .orderBy(asc(voyages.sortOrder), asc(voyages.id));

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Voyages organisés</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {rows.length} voyage{rows.length > 1 ? "s" : ""} — l&apos;ordre ci-dessous
            est celui affiché sur le site (accueil et page publique).
          </p>
        </div>
        <Link href="/admin/voyages/nouveau">
          <Button>
            <IconPlus className="size-4" />
            Nouveau voyage
          </Button>
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong bg-surface p-10 text-center">
          <p className="text-sm text-ink-muted">
            Aucun voyage organisé pour le moment. Créez le premier pour
            l&apos;afficher sur le site.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((voyage, index) => {
            const dates = voyageDatesLabel(voyage.departureDate, voyage.returnDate);
            return (
              <li
                key={voyage.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-sm sm:gap-4 sm:p-4"
              >
                <MoveButtons
                  id={voyage.id}
                  onMove={moveVoyage}
                  isFirst={index === 0}
                  isLast={index === rows.length - 1}
                />

                {voyage.imageUrl ? (
                  <Image
                    src={voyage.imageUrl}
                    alt=""
                    width={64}
                    height={48}
                    className="h-12 w-16 shrink-0 rounded-lg border border-line object-cover"
                  />
                ) : (
                  <div className="h-12 w-16 shrink-0 rounded-lg border border-dashed border-line bg-page" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-ink">{voyage.title}</span>
                    {voyage.published ? (
                      <Badge variant="success">Publié</Badge>
                    ) : (
                      <Badge variant="warning">Brouillon</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    /{voyage.slug}
                    {dates ? ` — ${dates}` : ""}
                    {voyage.price ? ` — ${voyage.price}` : ""}
                    {voyage.galleryImages.length > 0
                      ? ` — ${voyage.galleryImages.length} photo${voyage.galleryImages.length > 1 ? "s" : ""} de galerie`
                      : ""}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <EditLink href={`/admin/voyages/${voyage.id}`} label={voyage.title} />
                  <DeleteVoyageButton id={voyage.id} title={voyage.title} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
