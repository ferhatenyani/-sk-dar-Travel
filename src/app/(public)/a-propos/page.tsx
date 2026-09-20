// À propos — présentation de l’agence (texte CMS + compléments).
import Image from "next/image";
import { ArrowRight, BadgeCheck, Compass, Handshake, Wallet } from "lucide-react";

import {
  Container,
  Eyebrow,
  SectionHeading,
} from "@/components/vitrine/primitives";
import { Reveal } from "@/components/vitrine/reveal";
import { CtaBand } from "@/components/vitrine/cta-band";
import { ComposerTrigger } from "@/components/vitrine/composer";
import { getSettings } from "@/lib/public-data";
import { vitrineSettings } from "@/lib/vitrine";

export const revalidate = 60;

export const metadata = {
  title: "À propos",
  description:
    "Üsküdar Travel, agence de voyage à Sétif : une équipe locale qui organise vos voyages clés en main, en famille ou en groupe.",
  alternates: { canonical: "/a-propos" },
};

const VALUES = [
  {
    icon: Handshake,
    title: "Prise en charge complète",
    text: "Vols, hôtels, transferts, assurance : un interlocuteur unique pour tout votre séjour, du départ au retour.",
  },
  {
    icon: Wallet,
    title: "Devis clairs",
    text: "Des tarifs transparents, expliqués ligne par ligne avant votre décision. Aucune surprise sur la route.",
  },
  {
    icon: Compass,
    title: "Organisé ou sur-mesure",
    text: "Circuits accompagnés vers nos destinations phares, ou itinéraire dessiné sur mesure selon vos envies.",
  },
  {
    icon: BadgeCheck,
    title: "Famille & groupes",
    text: "Nous voyageons nous-mêmes en famille : rythmes, chambres, repas — tout est pensé pour le confort de tous.",
  },
];

export default async function AProposPage() {
  const settings = vitrineSettings(await getSettings());
  const aboutText = settings.aboutText;

  return (
    <>
      {/* Bandeau d’en-tête */}
      <section>
        <Container className="pt-10 pb-14 text-center sm:pt-14 sm:pb-16">
          <Reveal>
            <Eyebrow className="justify-center">À propos</Eyebrow>
            <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-bold tracking-tight text-night text-balance sm:text-5xl">
              L’agence qui organise tout, pour que vous profitiez
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-night-muted">
              Üsküdar Travel accompagne les voyageurs de Sétif et d’Algérie vers
              les plus belles destinations, avec une obsession : que vous n’ayez
              à vous occuper de rien.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* Histoire + collage */}
      <section className="py-6 sm:py-10">
        <Container>
          <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_1fr]">
            <Reveal>
              <div className="space-y-5 text-base leading-relaxed text-night-soft">
                <p className="text-lg font-medium text-night">{aboutText}</p>
                <p>
                  Née à Sétif, notre agence est d’abord une équipe de passionnés
                  qui connaissent chaque destination par cœur : Istanbul et la
                  Cappadoce, les plages de Tunisie, les pyramides d’Égypte, les
                  tours de Kuala Lumpur — et bien sûr les merveilles de l’Algérie,
                  de Constantine au Sahara.
                </p>
                <p>
                  Nous savons qu’un voyage réussi se joue dans les détails : un
                  transfert ponctuel, un hôtel bien placé, une assurance qui
                  répond présente. C’est pourquoi nous prenons tout en charge,
                  pour que votre seule mission soit de faire vos valises.
                </p>
                <p className="font-semibold text-night">
                  L’équipe Üsküdar Travel — Sétif, Algérie
                </p>
                <div className="pt-2">
                  <ComposerTrigger size="lg">
                    Faire connaissance — composer mon voyage
                    <ArrowRight className="h-4 w-4" />
                  </ComposerTrigger>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="relative mx-auto h-[420px] max-w-md lg:h-[520px]">
                <div className="absolute top-0 left-0 w-[78%] -rotate-2 overflow-hidden rounded-3xl shadow-[0_24px_48px_-20px_rgba(15,23,42,0.35)]">
                  <Image
                    src="/images/about-2.webp"
                    alt="La côte algéroise et ses bâtiments blancs"
                    width={560}
                    height={420}
                    className="h-auto w-full object-cover"
                  />
                </div>
                <div className="absolute top-[46%] right-0 w-[52%] rotate-3 overflow-hidden rounded-3xl shadow-[0_24px_48px_-20px_rgba(15,23,42,0.35)]">
                  <Image
                    src="/images/dz-alger.webp"
                    alt="Une place animée d’Alger"
                    width={420}
                    height={480}
                    className="h-auto w-full object-cover"
                  />
                </div>
                <div className="absolute bottom-0 left-2 w-[62%] -rotate-1 overflow-hidden rounded-3xl shadow-[0_24px_48px_-20px_rgba(15,23,42,0.35)]">
                  <Image
                    src="/images/dz-constantine.webp"
                    alt="Le pont Sidi M’Cid enjambant les gorges du Rhumel, à Constantine"
                    width={480}
                    height={340}
                    className="h-auto w-full object-cover"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Valeurs */}
      <section className="py-14 sm:py-20">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Nos engagements"
              title="Nos promesses — sans petites lignes"
              align="center"
            />
          </Reveal>
          <div className="mt-10 grid gap-5 sm:auto-rows-fr sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value, i) => (
              <Reveal key={value.title} delay={i * 70}>
                <div className="h-full rounded-3xl border border-ice bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-ice-strong hover:shadow-[0_24px_48px_-24px_rgba(15,23,42,0.25)]">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cobalt-soft text-cobalt">
                    <value.icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <h2 className="mt-4 text-base font-bold text-night">{value.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-night-muted">
                    {value.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <CtaBand
        title="Prêt à boucler vos valises ?"
        sub="Un appel ou un message suffit : nous construisons votre voyage ensemble, sans engagement."
      />
    </>
  );
}
