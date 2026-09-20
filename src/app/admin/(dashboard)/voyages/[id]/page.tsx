import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { voyages } from "@/db/schema";
import { VoyageForm } from "../voyage-form";

import { BackLink } from "@/components/ui/back-link";

export const metadata: Metadata = {
  title: "Modifier le voyage organisé — Administration",
};

export default async function EditVoyagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const voyageId = Number(id);
  if (!Number.isInteger(voyageId)) notFound();

  const [voyage] = await db.select().from(voyages).where(eq(voyages.id, voyageId)).limit(1);
  if (!voyage) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/admin/voyages" label="Retour aux voyages organisés" />
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Modifier le voyage organisé</h1>
        <p className="mt-1 text-sm text-ink-muted">
          <span className="font-medium text-ink">{voyage.title}</span>{" "}
          <span className="text-ink-faint">/{voyage.slug}</span>
        </p>
      </header>
      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        <VoyageForm voyage={voyage} />
      </div>
    </div>
  );
}
