import { ArrowRight } from "lucide-react";

import { ComposerTrigger } from "./composer";
import { Container, Eyebrow } from "./primitives";
import { Reveal } from "./reveal";

/** Bande de conversion réutilisable en fin de page. */
export function CtaBand({
  title = "Votre prochaine histoire commence ici",
  sub = "Décrivez-nous votre projet — destination, dates, budget — et nous nous occupons du reste, de A à Z.",
}: {
  title?: string;
  sub?: string;
}) {
  return (
    <section className="py-14 sm:py-20">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-night px-6 py-12 text-center sm:px-12 sm:py-16">
            {/* Décor : halo cobalt + disque citrine */}
            <div
              aria-hidden
              className="absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-cobalt/50 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -right-16 -bottom-20 h-56 w-56 rounded-full bg-citrine/25 blur-3xl"
            />
            <div className="relative">
              <Eyebrow className="justify-center text-citrine">Agence de voyage — Sétif</Eyebrow>
              <h2 className="mx-auto mt-3 max-w-xl text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
                {title}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white/70">
                {sub}
              </p>
              {/* CTA unique : « Composer mon voyage » emmène déjà vers le
                  formulaire (scroll sur la page, accueil #contact sinon). */}
              <div className="mt-8 flex justify-center">
                <ComposerTrigger variant="primary" size="lg">
                  Composer mon voyage
                  <ArrowRight className="h-4 w-4" />
                </ComposerTrigger>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
