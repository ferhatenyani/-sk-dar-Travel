import type { Metadata } from "next";
import Link from "next/link";
import { asc, count, eq } from "drizzle-orm";

import { db } from "@/db";
import { gallerySections, sectionCards } from "@/db/schema";
import { moveSection } from "@/lib/actions/gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconImage, IconPlus } from "@/components/ui/icons";
import {
  DeleteSectionButton,
  EditLink,
  MoveButtons,
} from "./row-actions";

export const metadata: Metadata = {
  title: "Galerie — Administration",
};

export default async function GalleryPage() {
  const rows = await db
    .select({
      id: gallerySections.id,
      title: gallerySections.title,
      slug: gallerySections.slug,
      description: gallerySections.description,
      published: gallerySections.published,
      cardCount: count(sectionCards.cardId),
    })
    .from(gallerySections)
    .leftJoin(sectionCards, eq(sectionCards.sectionId, gallerySections.id))
    .groupBy(gallerySections.id)
    .orderBy(asc(gallerySections.sortOrder), asc(gallerySections.id));

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Galerie</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {rows.length} section{rows.length > 1 ? "s" : ""} — l&apos;ordre
            ci-dessous est celui affiché sur le site.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/galerie/cartes">
            <Button variant="secondary">
              <IconImage className="size-4" />
              Cartes photo
            </Button>
          </Link>
          <Link href="/admin/galerie/sections/nouveau">
            <Button>
              <IconPlus className="size-4" />
              Nouvelle section
            </Button>
          </Link>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong bg-surface p-10 text-center">
          <p className="text-sm text-ink-muted">
            Aucune section pour le moment. Créez la première pour organiser la
            galerie du site.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((section, index) => (
            <li
              key={section.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-sm sm:gap-4 sm:p-4"
            >
              <MoveButtons
                id={section.id}
                onMove={moveSection}
                isFirst={index === 0}
                isLast={index === rows.length - 1}
                label={`la section ${section.title}`}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium text-ink">{section.title}</span>
                  {section.published ? (
                    <Badge variant="success">Publié</Badge>
                  ) : (
                    <Badge variant="warning">Brouillon</Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-ink-muted">
                  /{section.slug} — {section.cardCount} carte
                  {section.cardCount > 1 ? "s" : ""} liée
                  {section.cardCount > 1 ? "s" : ""}
                </p>
                {section.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-ink-secondary">
                    {section.description}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <EditLink
                  href={`/admin/galerie/sections/${section.id}`}
                  label={section.title}
                />
                <DeleteSectionButton id={section.id} title={section.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
