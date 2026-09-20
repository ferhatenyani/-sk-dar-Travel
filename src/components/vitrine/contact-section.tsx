// Section contact — bas de page d'accueil : le formulaire « Composer mon
// voyage » est la pièce centrale (arrivée du bouton du header/hero) ;
// localisation et téléphone passent dessous. Mobile : le formulaire intégré
// laisse place à une carte CTA qui ouvre la feuille basse.
import { ArrowUpRight, Clock, MapPin, Phone } from "lucide-react";

import { ComposerCard } from "@/components/vitrine/composer";
import { TripRequestForm } from "@/components/vitrine/trip-request-form";
import { Container, SectionHeading } from "@/components/vitrine/primitives";
import {
  mapsEmbedUrl,
  mapsLink,
  telHref,
  type VitrineSettings,
} from "@/lib/vitrine";

/** Choix du formulaire (tags + options). */
type Choice = { slug: string; title: string };

/** Bas de page d'accueil : demande de devis + coordonnées et carte. */
export function ContactSection({
  settings,
  destinations,
  offers,
  voyages,
}: {
  settings: VitrineSettings;
  destinations: Choice[];
  offers: Choice[];
  voyages: Choice[];
}) {
  return (
    <section id="contact" className="scroll-mt-24 py-14 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Contact"
          title="Votre devis gratuit, en un formulaire"
          sub="Destinations, dates, budget : décrivez-nous votre projet et recevez une proposition claire sous 24 h — échangée par téléphone ou par e-mail, comme vous préférez."
          align="center"
        />

        {/* Le formulaire, pièce centrale (desktop) / carte CTA (mobile) */}
        <div className="mx-auto mt-8 max-w-3xl sm:mt-10">
          <div className="hidden sm:block">
            <TripRequestForm destinations={destinations} offers={offers} voyages={voyages} />
          </div>
          <ComposerCard />
        </div>

        {/* Localisation & contact direct, sous le formulaire */}
        <div className="mx-auto mt-10 max-w-3xl space-y-4 sm:mt-12">
          <div className="overflow-hidden rounded-3xl border border-ice bg-white shadow-[0_20px_48px_-32px_rgba(15,23,42,0.3)]">
            <iframe
              title="Carte — agence Üsküdar Travel à Sétif"
              src={mapsEmbedUrl()}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className="h-52 w-full border-0 sm:h-64"
            />
            <a
              href={mapsLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3.5 p-4 transition-colors hover:bg-ice/40 sm:p-5"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cobalt-soft text-cobalt">
                <MapPin className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-night">
                  {settings.address}
                </span>
                <span className="mt-0.5 block text-sm text-night-muted">
                  Ouvrir dans Google Maps — itinéraire
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-cobalt transition-transform duration-300 group-hover:-translate-y-0.5" />
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href={telHref(settings.phone)}
              className="flex items-center gap-4 rounded-3xl border border-ice bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-ice-strong hover:shadow-[0_16px_32px_-20px_rgba(15,23,42,0.4)]"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cobalt text-white">
                <Phone className="h-6 w-6" />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-bold text-night">
                  Par téléphone
                </span>
                <span className="mt-0.5 block truncate text-sm text-night-muted">
                  {settings.phone}
                </span>
              </span>
            </a>

            <p className="flex items-start gap-3 rounded-3xl bg-ice/50 p-5 text-sm leading-relaxed text-night-soft">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" />
              <span>
                Devis gratuit et sans engagement — passez nous voir à
                l&apos;agence, un café et votre voyage prend forme.
              </span>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
