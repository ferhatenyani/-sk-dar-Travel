// Page détail d'une destination (section galerie publiée) : photos + texte
// + formulaire « Composer mon voyage » avec la destination pré-cochée.
import Image from "next/image";
import { isUploadedImage } from "@/lib/images";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Camera } from "lucide-react";

import { ComposerCard } from "@/components/vitrine/composer";
import { TripRequestForm } from "@/components/vitrine/trip-request-form";
import { Chip, Container, Eyebrow } from "@/components/vitrine/primitives";
import { Reveal } from "@/components/vitrine/reveal";
import {
  getPublishedDestinations,
  getPublishedGallery,
  getPublishedOffers,
  getPublishedVoyageChoices,
} from "@/lib/public-data";
import { destinationImage } from "@/lib/vitrine";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const gallery = await getPublishedGallery();
  const section = gallery.find((s) => s.slug === slug);
  if (!section) return { title: "Destination introuvable" };
  return {
    title: `Voyage en ${section.title}`,
    description:
      section.description ||
      `Séjours organisés et sur-mesure en ${section.title} avec Üsküdar Travel, agence de voyage à Sétif. Devis gratuit sous 24 h.`,
    alternates: { canonical: `/destinations/${section.slug}` },
  };
}

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [gallery, destinations, offers, voyageChoices] = await Promise.all([
    getPublishedGallery(),
    getPublishedDestinations(),
    getPublishedOffers(),
    getPublishedVoyageChoices(),
  ]);

  const section = gallery.find((s) => s.slug === slug);
  if (!section) notFound();

  const heroImage = section.cards[0]?.imageUrl ?? destinationImage(section.slug);
  const others = destinations.filter((d) => d.slug !== section.slug);

  return (
    <>
      {/* Bandeau photo pleine largeur (dans la gouttière commune) */}
      <section>
        <Container className="pt-8 sm:pt-12">
          <Link
            href="/galerie"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-night-muted transition-colors hover:text-cobalt"
          >
            <ArrowLeft className="h-4 w-4" />
            Toutes les destinations
          </Link>

          <div className="relative mt-4 h-[300px] overflow-hidden rounded-[28px] bg-ice shadow-[0_28px_56px_-28px_rgba(15,23,42,0.45)] sm:h-[380px] lg:h-[440px]">
            <Image
              src={heroImage}
              unoptimized={isUploadedImage(heroImage)}
              alt={`Destination ${section.title}`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/20 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
              <Chip glass>
                <Camera className="h-3.5 w-3.5" />
                {section.cards.length}{' '}
                {section.cards.length > 1 ? "escales" : "escale"}
              </Chip>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white text-balance sm:text-5xl">
                Partez en {section.title}
              </h1>
              {section.description ? (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
                  {section.description}
                </p>
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      {/* Photos de la destination */}
      {section.cards.length > 0 ? (
        <section className="pt-10 sm:pt-14">
          <Container>
            <Reveal>
              <Eyebrow>En images</Eyebrow>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-night sm:text-3xl">
                Les escales qui font {section.title}
              </h2>
            </Reveal>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.cards.map((card, i) => (
                <Reveal key={card.title} delay={(i % 3) * 60}>
                  <figure className="group overflow-hidden rounded-3xl border border-ice bg-white">
                    <span className="relative block aspect-[4/3] overflow-hidden">
                      <Image
                        src={card.imageUrl}
                        unoptimized={isUploadedImage(card.imageUrl)}
                        alt={card.alt || card.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </span>
                    <figcaption className="p-4">
                      <span className="block text-[15px] font-bold text-night">
                        {card.title}
                      </span>
                      {card.description ? (
                        <span className="mt-1 block text-[13px] leading-relaxed text-night-muted">
                          {card.description}
                        </span>
                      ) : null}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* Formulaire pré-rempli avec la destination */}
      <section className="py-12 sm:py-16">
        <Container>
          <Reveal>
            <Eyebrow>Devis gratuit</Eyebrow>
            <h2 className="mt-2 max-w-xl text-2xl font-bold tracking-tight text-night text-balance sm:text-3xl">
              Composez votre voyage en {section.title}
            </h2>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-night-muted">
              Quelques détails suffisent : un conseiller vous rappelle avec un
              premier programme et un prix ferme, sous 24 h ouvrées.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-7 max-w-3xl">
              {/* Desktop : formulaire intégré ; mobile : carte CTA qui ouvre
                  la feuille basse (destination pré-cochée). */}
              <div className="hidden sm:block">
                <TripRequestForm
                  destinations={destinations}
                  offers={offers}
                  voyages={voyageChoices}
                  defaultDestinations={[section.slug]}
                  idPrefix="vt-destination"
                />
              </div>
              <ComposerCard prefill={{ destinations: [section.slug] }} />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Autres destinations */}
      {others.length > 0 ? (
        <section className="pb-16 sm:pb-20">
          <Container>
            <Reveal>
              <Eyebrow>Continuez à rêver</Eyebrow>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-night sm:text-3xl">
                Nos autres destinations
              </h2>
            </Reveal>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((other, i) => (
                <Reveal key={other.slug} delay={(i % 4) * 60}>
                  <Link
                    href={`/destinations/${other.slug}`}
                    className="group flex items-center justify-between gap-3 rounded-3xl border border-ice bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-ice-strong hover:shadow-[0_16px_32px_-20px_rgba(15,23,42,0.4)]"
                  >
                    <span className="min-w-0 text-sm font-bold text-night">
                      {other.title}
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
