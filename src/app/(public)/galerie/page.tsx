// Galerie — sections thématiques empilées, cartes en arche (inspi1).
import Image from "next/image";
import { Images } from "lucide-react";

import { CtaBand } from "@/components/vitrine/cta-band";
import { Container, Eyebrow } from "@/components/vitrine/primitives";
import { Reveal } from "@/components/vitrine/reveal";
import { getPublishedGallery } from "@/lib/public-data";

export const revalidate = 60;

export const metadata = {
  title: "Galerie",
  description:
    "Turquie, Tunisie, Égypte, Malaisie, Algérie : explorez en images les destinations proposées par Üsküdar Travel, agence de voyage à Sétif.",
  alternates: { canonical: "/galerie" },
};

export default async function GaleriePage() {
  const gallery = await getPublishedGallery();

  return (
    <>
      {/* Bandeau d’en-tête */}
      <section className="bg-gradient-to-b from-ice/70 to-white">
        <Container className="pt-10 pb-12 text-center sm:pt-14 sm:pb-14">
          <Reveal>
            <Eyebrow className="justify-center">Galerie</Eyebrow>
            <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-bold tracking-tight text-night text-balance sm:text-5xl">
              Nos destinations en images
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-night-muted">
              Laissez-vous inspirer — chaque image correspond à une étape que
              nous pouvons intégrer à votre voyage.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* Sections empilées */}
      <section className="py-6 sm:py-10">
        <Container>
          {gallery.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-ice-strong bg-white p-8 text-center text-sm text-night-muted">
              La galerie est en cours de préparation — contactez-nous pour
              découvrir nos destinations.
            </p>
          ) : (
            <div className="space-y-16 sm:space-y-20">
              {gallery.map((section) => (
                <div key={section.id} id={section.slug} className="scroll-mt-24">
                  <Reveal>
                    <div className="flex flex-wrap items-end justify-between gap-3">
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
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-ice bg-white px-3 py-1.5 text-xs font-semibold text-night-soft">
                        <Images className="h-3.5 w-3.5 text-cobalt" />
                        {section.cards.length}{" "}
                        {section.cards.length > 1 ? "cartes" : "carte"}
                      </span>
                    </div>
                  </Reveal>

                  {/* Mobile/tablet : carrousel à accroche. La bord gauche
                      (pl-7) donne un point de départ décalé à droite — la
                      1re carte ne touche pas le bord de l'écran — et
                      scroll-pl aligne les cartes snappées sur ce départ. */}
                  <div className="vt-no-scrollbar -mx-4 mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-7 pl-7 pr-4 pb-4 sm:-mx-6 sm:scroll-pl-8 sm:gap-5 sm:pl-8 sm:pr-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:scroll-pl-0 lg:px-0">
                    {section.cards.map((card, i) => (
                      <Reveal
                        key={card.title}
                        delay={(i % 4) * 60}
                        className="w-[74vw] max-w-[270px] shrink-0 snap-start sm:w-[250px] lg:w-auto"
                      >
                        <figure
                          className={`group relative block aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-night/10 ${
                            i % 2 === 1 ? "lg:translate-y-6" : ""
                          }`}
                        >
                          <Image
                            src={card.imageUrl}
                            alt={card.alt || card.title}
                            fill
                            sizes="(max-width: 1024px) 250px, 22vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div
                            aria-hidden
                            className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/20 to-transparent"
                          />
                          <figcaption className="absolute inset-x-3.5 bottom-3.5">
                            <p className="text-[15px] leading-snug font-bold text-white">
                              {card.title}
                            </p>
                            {card.description ? (
                              <p className="mt-1 text-xs leading-relaxed text-white/75 line-clamp-2">
                                {card.description}
                              </p>
                            ) : null}
                          </figcaption>
                        </figure>
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
        title="Une destination vous fait de l'œil ?"
        sub="Dites-nous laquelle : nous vous préparons un programme et un devis personnalisés, sans engagement."
      />
    </>
  );
}
