// Page détail d'une offre (service du CMS) : présentation + formulaire
// « Composer mon voyage » pré-rempli avec l'offre concernée.
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, asc, eq, ne } from "drizzle-orm";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { db } from "@/db";
import { services } from "@/db/schema";
import { ComposerCard } from "@/components/vitrine/composer";
import { TripRequestForm } from "@/components/vitrine/trip-request-form";
import {
  Chip,
  Container,
  Eyebrow,
  SectionHeading,
} from "@/components/vitrine/primitives";
import { Reveal } from "@/components/vitrine/reveal";
import {
  getPublishedDestinations,
  getPublishedOffers,
  getPublishedVoyageChoices,
} from "@/lib/public-data";
import { destinationImage } from "@/lib/vitrine";

export const revalidate = 60;

async function getService(slug: string) {
  const [service] = await db
    .select()
    .from(services)
    .where(and(eq(services.slug, slug), eq(services.published, true)))
    .limit(1);
  return service ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return { title: "Service introuvable" };
  return {
    title: service.title,
    description:
      service.description ||
      `${service.title} chez Üsküdar Travel, agence de voyage à Sétif : devis gratuit sous 24 h.`,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

/** Arguments du service, mis en avant à côté du formulaire. */
const ARGUMENTS = [
  "Devis détaillé, prix ferme — sans frais cachés",
  "Des dates et un rythme qui vous ressemblent",
  "Prise en charge complète : vols, hôtel, transferts",
];

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();

  const [destinations, offers, voyageChoices, siblings] = await Promise.all([
    getPublishedDestinations(),
    getPublishedOffers(),
    getPublishedVoyageChoices(),
    db
      .select({ slug: services.slug, title: services.title, imageUrl: services.imageUrl })
      .from(services)
      .where(and(eq(services.published, true), ne(services.slug, slug)))
      .orderBy(asc(services.sortOrder), asc(services.id))
      .limit(6),
  ]);

  return (
    <>
      <section>
        <Container className="pt-8 pb-4 sm:pt-12">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-night-muted transition-colors hover:text-cobalt"
          >
            <ArrowLeft className="h-4 w-4" />
            Tous les services
          </Link>
        </Container>
      </section>

      <section className="pb-4 sm:pb-8">
        <Container>
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
            {/* Visuel + arguments */}
            <Reveal>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-ice shadow-[0_28px_56px_-28px_rgba(15,23,42,0.45)]">
                {service.imageUrl ? (
                  <Image
                    src={service.imageUrl}
                    alt={service.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover"
                  />
                ) : (
                  <Image
                    src={destinationImage("turquie")}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover opacity-60"
                  />
                )}
                {service.price ? (
                  <Chip glass className="absolute bottom-4 left-4 text-sm">
                    {service.price}
                  </Chip>
                ) : null}
              </div>

              <ul className="mt-6 grid gap-2.5">
                {ARGUMENTS.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cobalt-soft text-cobalt">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className="text-sm leading-relaxed text-night-soft">{point}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Texte */}
            <Reveal delay={100}>
              <div>
                <Eyebrow>Service</Eyebrow>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-night text-balance sm:text-4xl">
                  {service.title}
                </h1>
                {service.description ? (
                  <p className="mt-3 text-base leading-relaxed text-night-muted">
                    {service.description}
                  </p>
                ) : null}
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Wizard pleine largeur (même gabarit que l'accueil) ; mobile : carte CTA */}
      <section className="pb-14 sm:pb-20">
        <Container>
          <div className="mx-auto max-w-3xl">
            <div className="hidden sm:block">
              <TripRequestForm
                destinations={destinations}
                offers={offers}
                voyages={voyageChoices}
                defaultOffers={[service.slug]}
                idPrefix="vt-service"
              />
            </div>
            <ComposerCard prefill={{ offers: [service.slug] }} />
          </div>
        </Container>
      </section>

      {/* Autres services */}
      {siblings.length > 0 ? (
        <section className="py-12 sm:py-16">
          <Container>
            <Reveal>
              <SectionHeading
                eyebrow="À découvrir aussi"
                title="Nos autres services"
              />
            </Reveal>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {siblings.map((sibling, i) => (
                <Reveal key={sibling.slug} delay={(i % 3) * 60}>
                  <Link
                    href={`/services/${sibling.slug}`}
                    className="group flex items-center gap-4 rounded-3xl border border-ice bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-ice-strong hover:shadow-[0_16px_32px_-20px_rgba(15,23,42,0.4)]"
                  >
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-ice">
                      {sibling.imageUrl ? (
                        <Image
                          src={sibling.imageUrl}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-bold text-night">
                      {sibling.title}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-night-faint transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-cobalt" />
                  </Link>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
