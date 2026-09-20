// Page « Voyages organisés » : tous les départs programmés du CMS, en
// grille. Une carte (ou le lien d'accueil `?voyage=slug`) ouvre la modale
// de détail ; la CTA de la modale ouvre le wizard avec le voyage
// pré-sélectionné. Section jumelle de /services, même stratégie ISR.
import type { Metadata } from "next";
import { Suspense } from "react";

import { CtaBand } from "@/components/vitrine/cta-band";
import { Container, Eyebrow } from "@/components/vitrine/primitives";
import { VoyageBrowser } from "@/components/vitrine/voyage-browser";
import { getPublishedVoyages } from "@/lib/public-data";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Voyages organisés",
  description:
    "Nos voyages organisés au départ de Sétif : départs programmés, programme jour par jour, vols, hôtels et transferts pris en charge. Devis gratuit sous 24 h.",
  alternates: { canonical: "/voyages-organises" },
};

export default async function VoyagesOrganisesPage() {
  const voyages = await getPublishedVoyages();

  return (
    <div className="py-10 sm:py-14 lg:py-16">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow className="justify-center">Voyages organisés</Eyebrow>
          <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-bold tracking-tight text-night text-balance sm:text-5xl">
            Nos voyages organisés du moment
          </h1>
          <p className="mt-3 text-base leading-relaxed text-night-muted">
            Dates, programme, prix : tout est calé à l&apos;avance — il n&apos;y
            a plus qu&apos;à choisir votre voyage et nous confier la suite.
          </p>
        </div>

        {voyages.length === 0 ? (
          <p className="mt-10 rounded-3xl border border-dashed border-ice-strong bg-white p-8 text-center text-sm text-night-muted">
            Aucun départ programmé pour le moment — composez votre voyage
            sur-mesure via le formulaire d&apos;accueil.
          </p>
        ) : (
          <Suspense>
            <VoyageBrowser voyages={voyages} />
          </Suspense>
        )}
      </Container>

      {/* Fin de page : réorientation sur-mesure (même gabarit que /services). */}
      <CtaBand
        title="Aucun départ ne vous convient ?"
        sub="Décrivez-nous le voyage dont vous rêvez — dates, budget, envies — et nous le composons sur-mesure, de A à Z."
      />
    </div>
  );
}
