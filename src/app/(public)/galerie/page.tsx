// Galerie — sections thématiques, cartes façon magazine : photo, légende
// éditoriale sous l'image, pastille numérotée et demande de devis par carte.
import Image from "next/image";
import { ArrowUpRight, Images } from "lucide-react";

import { CtaBand } from "@/components/vitrine/cta-band";
import { Container, Eyebrow } from "@/components/vitrine/primitives";
import { Reveal } from "@/components/vitrine/reveal";
import { getPublishedGallery, getSettings } from "@/lib/public-data";
import { vitrineSettings, waLink } from "@/lib/vitrine";

export const revalidate = 60;

export const metadata = {
  title: "Galerie",
  description:
    "Turquie, Tunisie, Égypte, Malaisie, Algérie : explorez en images les destinations proposées par Üsküdar Travel, agence de voyage à Sétif.",
  alternates: { canonical: "/galerie" },
};

type GalleryCardData = {
  title: string;
  description: string | null;
  imageUrl: string;
  alt: string;
};

/** Carte photo façon éditorial : image + légende détachée en dessous. */
function GalleryCard({
  card,
  index,
  waHref,
  staggered,
}: {
  card: GalleryCardData;
  index: number;
  waHref: string;
  staggered: boolean;
}) {
  return (
    <a
      href={waHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Demander des informations sur « ${card.title} »`}
      className={`group block ${staggered ? "lg:translate-y-6" : ""}`}
    >
      <figure className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-ice ring-1 ring-night/10 transition-shadow duration-300 group-hover:shadow-[0_28px_56px_-28px_rgba(15,23,42,0.45)]">
        <Image
          src={card.imageUrl}
          alt={card.alt || card.title}
          fill
          sizes="(max-width: 1024px) 250px, 22vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />
        {/* Pastille numérotée + flèche d'action sur la photo */}
        <span className="absolute top-3 left-3 inline-flex h-7 items-center rounded-full border border-white/25 bg-night/35 px-2.5 text-[11px] font-bold tracking-widest text-white tabular-nums backdrop-blur-md">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          aria-hidden
          className="absolute top-3 right-3 grid h-8 w-8 translate-y-1 place-items-center rounded-full bg-white text-night opacity-0 shadow-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </figure>
      <div className="px-1 pt-3">
        <h3 className="text-[15px] leading-snug font-bold text-night transition-colors group-hover:text-cobalt">
          {card.title}
        </h3>
        {card.description ? (
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-night-muted">
            {card.description}
          </p>
        ) : (
          <p className="mt-1 text-[13px] leading-relaxed text-night-faint">
            Intéressé(e) ? Un message suffit pour intégrer cette étape à votre voyage.
          </p>
        )}
      </div>
    </a>
  );
}

export default async function GaleriePage() {
  const [settings, gallery] = await Promise.all([
    getSettings(),
    getPublishedGallery(),
  ]);
  const s = vitrineSettings(settings);

  return (
    <>
      {/* Bandeau d’en-tête */}
      <section>
        <Container className="pt-10 pb-12 text-center sm:pt-14 sm:pb-14">
          <Reveal>
            <Eyebrow className="justify-center">Galerie</Eyebrow>
            <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-bold tracking-tight text-night text-balance sm:text-5xl">
              Votre prochaine escale, en images
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-night-muted">
              Chaque photo est une étape que nous pouvons intégrer à votre
              voyage — envoyez-nous un coup de cœur, on s’occupe du reste.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* Sections empilées */}
      <section className="pb-14 sm:pb-20">
        <Container>
          {gallery.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-ice-strong bg-white p-8 text-center text-sm text-night-muted">
              La galerie est en cours de préparation — contactez-nous pour
              découvrir nos destinations.
            </p>
          ) : (
            <div className="space-y-16 sm:space-y-24">
              {gallery.map((section, sectionIndex) => (
                <div key={section.id} id={section.slug} className="scroll-mt-24">
                  <Reveal>
                    {/* En-tête de section : filet, numéro, titre, méta */}
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold tracking-widest text-cobalt tabular-nums">
                        {String(sectionIndex + 1).padStart(2, "0")}
                      </span>
                      <span aria-hidden className="h-px flex-1 bg-ice-strong/70" />
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-ice bg-white px-3 py-1.5 text-xs font-semibold text-night-soft">
                        <Images className="h-3.5 w-3.5 text-cobalt" />
                        {section.cards.length}{" "}
                        {section.cards.length > 1 ? "cartes" : "carte"}
                      </span>
                    </div>
                    <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
                      <div className="max-w-xl">
                        <h2 className="text-2xl font-bold tracking-tight text-night sm:text-3xl">
                          {section.title}
                        </h2>
                        {section.description ? (
                          <p className="mt-2 text-sm leading-relaxed text-night-muted">
                            {section.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </Reveal>

                  <div className="vt-no-scrollbar -mx-4 mt-7 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
                    {section.cards.map((card, i) => (
                      <Reveal
                        key={card.title}
                        delay={(i % 4) * 60}
                        className="w-[230px] shrink-0 snap-start sm:w-[250px] lg:w-auto"
                      >
                        <GalleryCard
                          card={card}
                          index={i}
                          staggered={i % 2 === 1}
                          waHref={waLink(
                            s.whatsappNumber,
                            `Bonjour Üsküdar Travel ! J'ai repéré « ${card.title} » dans votre galerie. Comment l'intégrer à mon voyage ?`,
                          )}
                        />
                      </Reveal>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>

      <CtaBand
        settings={s}
        title="Un coup de cœur pour une destination ?"
        sub="Dites-nous laquelle : nous vous préparons un programme et un devis personnalisés, sans engagement."
      />
    </>
  );
}
