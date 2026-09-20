import type { Metadata } from "next";
import Image from "next/image";
import { isUploadedImage } from "@/lib/images";
import Link from "next/link";
import { asc } from "drizzle-orm";

import { db } from "@/db";
import { services } from "@/db/schema";
import { moveService } from "@/lib/actions/services";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@/components/ui/icons";
import { DeleteServiceButton, EditLink, MoveButtons } from "./row-actions";

export const metadata: Metadata = {
  title: "Services — Administration",
};

export default async function ServicesPage() {
  const rows = await db
    .select()
    .from(services)
    .orderBy(asc(services.sortOrder), asc(services.id));

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {rows.length} service{rows.length > 1 ? "s" : ""} — l&apos;ordre ci-dessous
            est celui affiché sur le site.
          </p>
        </div>
        <Link href="/admin/services/nouveau">
          <Button>
            <IconPlus className="size-4" />
            Nouveau service
          </Button>
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong bg-surface p-10 text-center">
          <p className="text-sm text-ink-muted">
            Aucun service pour le moment. Créez le premier pour l&apos;afficher sur le
            site.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((service, index) => (
            <li
              key={service.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-sm sm:gap-4 sm:p-4"
            >
              <MoveButtons
                id={service.id}
                onMove={moveService}
                isFirst={index === 0}
                isLast={index === rows.length - 1}
              />

              {service.imageUrl ? (
                <Image
                  src={service.imageUrl}
                  unoptimized={isUploadedImage(service.imageUrl)}
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
                  <span className="truncate font-medium text-ink">{service.title}</span>
                  {service.published ? (
                    <Badge variant="success">Publié</Badge>
                  ) : (
                    <Badge variant="warning">Brouillon</Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-ink-muted">
                  /{service.slug}
                  {service.price ? ` — ${service.price}` : ""}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <EditLink href={`/admin/services/${service.id}`} label={service.title} />
                <DeleteServiceButton id={service.id} title={service.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
