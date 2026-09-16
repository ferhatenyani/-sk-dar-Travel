import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { services } from "@/db/schema";
import { ServiceForm } from "../service-form";

import { BackLink } from "@/components/ui/back-link";

export const metadata: Metadata = {
  title: "Modifier le service — Administration",
};

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const serviceId = Number(id);
  if (!Number.isInteger(serviceId)) notFound();

  const [service] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
  if (!service) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/admin/services" label="Retour aux services" />
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Modifier le service</h1>
        <p className="mt-1 text-sm text-ink-muted">
          <span className="font-medium text-ink">{service.title}</span>{" "}
          <span className="text-ink-faint">/{service.slug}</span>
        </p>
      </header>
      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        <ServiceForm service={service} />
      </div>
    </div>
  );
}
