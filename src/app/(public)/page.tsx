// Accueil — hero « carte pleine page » façon inspi3 : une photo aux coins
// arrondis sous la barre de navigation (voir site-header), voile dégradé et
// contenu (titre + CTAs) en bas à gauche. Le carrousel des destinations
// vit sous la carte. Le reste de la page est piloté par le CMS.
import Image from "next/image";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import {
  ArrowRight,
  ArrowUpRight,
  Check,

  Sparkles,
} from "lucide-react";

import { db } from "@/db";
import { services } from "@/db/schema";
import { ContactSection } from "@/components/vitrine/contact-section";
import { DestinationStrip } from "@/components/vitrine/destination-panel";
import { ContactButton } from "@/components/vitrine/site-header";
import {
  ButtonLink,
  Container,
  SectionHeading,
} from "@/components/vitrine/primitives";
import { Reveal } from "@/components/vitrine/reveal";
import { ServiceCard, type ServiceCardData } from "@/components/vitrine/service-card";
import { getPublishedGallery, getSettings } from "@/lib/public-data";
import {
  destinationImage,
  siteUrl,
  vitrineSettings,
  waLink,
  waServiceLink,
  WA_MESSAGE,
} from "@/lib/vitrine";

export const revalidate = 60;

const WHY_POINTS = [
  "Une équipe locale à Sétif, joignable 7 j/7",
  "Vols, hôtels, transferts : zéro paperasse pour vous",
  "Devis transparent, prix ferme — sans mauvaise surprise",
  "Des séjours pensés pour les familles et les groupes",
];

const FALLBACK_DESTINATIONS = [
  { slug: "algerie", title: "Algérie" },
  { slug: "turquie", title: "Turquie" },
  { slug: "tunisie", title: "Tunisie" },
  { slug: "egypte", title: "Égypte" },
  { slug: "malaisie", title: "Malaisie" },
];

/** Titre du hero : premier segment du titre CMS (avant « — »). */
function heroHeadline(title: string): string {
  return title.split("—")[0].trim();
}

export async function generateMetadata() {
  const settings = vitrineSettings(await getSettings());
  return {
    title: settings.seoTitle,
    description: settings.seoDescription,
    alternates: { canonical: "/" },
  };
}

export default async function HomePage() {
  const [rawSettings, gallery] = await Promise.all([
    getSettings(),
    getPublishedGallery(),
  ]);
  const settings = vitrineSettings(rawSettings);

  const destinations =
    gallery.length > 0
      ? gallery.map((s) => ({
          slug: s.slug,
          title: s.title,
          cardCount: s.cards.length,
          imageUrl: s.cards[0]?.imageUrl ?? destinationImage(s.slug),
        }))
      : FALLBACK_DESTINATIONS.map((d) => ({
          slug: d.slug,
          title: d.title,
          cardCount: 0,
          imageUrl: destinationImage(d.slug),
        }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: "Üsküdar Travel",
    description: settings.seoDescription,
    url: siteUrl(),
    telephone: "+213770505715",
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Sétif",
      addressCountry: "DZ",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ——— Hero façon inspi3 : carte photo pleine largeur, contenu en bas ——— */}
      <div className="w-full px-4 pt-1.5 sm:px-6 sm:pt-2 lg:px-10 lg:pt-2.5">
        <div className="relative h-[76svh] max-h-[800px] min-h-[540px] w-full overflow-hidden rounded-[16px] sm:rounded-[20px] lg:h-[min(86svh,840px)] lg:min-h-[620px]">
          <Image
            src={settings.heroImageUrl}
            alt="Paysage de destination proposé par Üsküdar Travel"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* Voile : assombrit le bas pour la lisibilité du contenu */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/25 to-night/10"
          />

          {/* Contenu : titre, accroche, CTAs */}
          <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-7 sm:px-8 sm:pb-10 lg:px-12 lg:pb-14">
            <div className="max-w-2xl">
              <Reveal>
                <h1 className="text-balance text-[34px] font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[56px]">
                  {heroHeadline(settings.heroTitle)}
                </h1>
              </Reveal>
              <Reveal delay={150}>
                <p className="mt-3 line-clamp-3 max-w-md text-[13px] leading-relaxed text-white/75 sm:mt-4 sm:text-[15px]">
                  {settings.heroText}
                </p>
              </Reveal>
              <Reveal delay={220}>
                <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8 sm:gap-4">
                  {/* CTA principal : pilule blanche + pastille flèche (inspi3) */}
                  <Link
                    href="/services"
                    className="group inline-flex items-center gap-3 rounded-full bg-white py-1.5 pl-6 pr-1.5 text-sm font-semibold text-night shadow-[0_18px_40px_-16px_rgba(15,23,42,0.65)] transition-all duration-200 hover:bg-ice active:scale-[0.98]"
                  >
                    Composer mon voyage
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-night text-white transition-transform duration-300 group-hover:rotate-45">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </Link>
                  <ContactButton onDark />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>

      {/* ——— Destinations : carrousel sous le hero (inspi3) ——— */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-9 sm:px-6 sm:pt-12 lg:px-10">
        <Reveal>
          <SectionHeading
            eyebrow="Destinations phares"
            title="Des escales qui donnent envie de faire ses valises"
            sub="De l'Algérie à la Malaisie : nos destinations les plus demandées — il n'y a plus qu'à choisir."
          />
        </Reveal>
        <Reveal delay={100} className="mt-7 sm:mt-9">
          <DestinationStrip destinations={destinations} />
        </Reveal>
      </section>

      {/* ——— Services ——— */}
      <section className="py-10 sm:py-16 lg:py-20">
        <Container>
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                eyebrow="Nos services"
                title="Votre voyage, calé de A à Z"
                sub="Vols, hôtels, transferts : vous rêvez, on organise. En formule organisée ou 100 % sur-mesure."
              />
              <ButtonLink href="/services" variant="ghost">
                Voir tous les services
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </Reveal>
          <HomeServices settings={settings} />
        </Container>
      </section>

      {/* ——— Pourquoi nous ——— */}
      <section className="py-10 sm:py-16 lg:py-20">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <SectionHeading
                eyebrow="Pourquoi nous choisir"
                title="Partez l'esprit léger, on s'occupe de tout"
                sub={settings.aboutText}
              />
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {WHY_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cobalt-soft text-cobalt">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className="text-sm leading-relaxed text-night-soft">{point}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink
                  href={waLink(settings.whatsappNumber, WA_MESSAGE)}
                  external
                >
                  Discuter de mon projet
                </ButtonLink>
                <ButtonLink href="/a-propos" variant="outline">
                  Découvrir l’agence
                </ButtonLink>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="relative mx-auto h-[340px] max-w-md sm:h-[420px]">
                <div className="absolute top-0 left-0 w-[72%] -rotate-3 overflow-hidden rounded-3xl shadow-[0_24px_48px_-20px_rgba(15,23,42,0.35)]">
                  <Image
                    src="/images/about-1.webp"
                    alt="Montgolfière au lever du soleil en Cappadoce"
                    width={520}
                    height={380}
                    className="h-auto w-full object-cover"
                  />
                </div>
                <div className="absolute right-0 bottom-0 w-[58%] rotate-2 overflow-hidden rounded-3xl shadow-[0_24px_48px_-20px_rgba(15,23,42,0.35)]">
                  <Image
                    src="/images/dz-gorges.webp"
                    alt="Les gorges du Rhumel à Constantine, Algérie"
                    width={420}
                    height={460}
                    className="h-auto w-full object-cover"
                  />
                </div>
                <div
                  aria-hidden
                  className="absolute bottom-16 -left-2 grid h-24 w-24 -rotate-8 place-items-center rounded-full bg-citrine text-center text-[11px] leading-tight font-bold text-night shadow-lg sm:-left-6 sm:h-28 sm:w-28"
                >
                  Depuis
                  <br />
                  Sétif
                  <Sparkles className="mt-0.5 h-3.5 w-3.5" />
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <ContactSection settings={settings} />
    </>
  );
}

/** Grille des services publiés (données DB). */
async function HomeServices({ settings }: { settings: ReturnType<typeof vitrineSettings> }) {
  const rows = await db
    .select()
    .from(services)
    .where(eq(services.published, true))
    .orderBy(asc(services.sortOrder), asc(services.id));

  if (rows.length === 0) {
    return (
      <p className="mt-10 rounded-3xl border border-dashed border-ice-strong bg-white p-8 text-center text-sm text-night-muted">
        Nos services arrivent très bientôt — contactez-nous directement sur
        WhatsApp pour préparer votre voyage.
      </p>
    );
  }

  const cards: ServiceCardData[] = rows.map((s) => ({
    slug: s.slug,
    title: s.title,
    description: s.description,
    price: s.price,
    imageUrl: s.imageUrl,
  }));

  return (
    // Mobile : carrousel horizontal à accroche (pas d'empilement vertical) ;
    // sm+ : grille classique.
    <div className="vt-no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-ps-4 px-4 pt-1 pb-4 sm:mx-0 sm:mt-10 sm:auto-rows-fr sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:scroll-ps-0 sm:px-0 lg:grid-cols-3">
      {cards.map((service, i) => (
        <Reveal
          key={service.slug}
          delay={(i % 3) * 70}
          // Pas de h-full ici : en flex, height:100% désactive le stretch
          // qui aligne justement les hauteurs ; la carte (h-full) remplit
          // l'item étiré.
          className="w-[78%] max-w-[320px] shrink-0 snap-center sm:w-auto sm:max-w-none sm:shrink"
        >
          <ServiceCard
            service={service}
            waHref={waServiceLink(settings.whatsappNumber, service.title)}
          />
        </Reveal>
      ))}
    </div>
  );
}
