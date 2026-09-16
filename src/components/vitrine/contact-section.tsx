// Section contact — bas de page d'accueil : formulaire e-mail + WhatsApp,
// sans page dédiée. Mobile first : empilée, WhatsApp mis en avant.
import { Clock, Mail, Phone } from "lucide-react";

import { ContactForm } from "@/components/vitrine/contact-form";
import { Container, Eyebrow, SectionHeading, WhatsAppIcon } from "@/components/vitrine/primitives";
import { telHref, type VitrineSettings, waLink, WA_MESSAGE } from "@/lib/vitrine";

/** Bas de page d'accueil : formulaire e-mail + contact direct WhatsApp. */
export function ContactSection({ settings }: { settings: VitrineSettings }) {
  return (
    <section id="contact" className="scroll-mt-24 py-14 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Contact"
          title="Votre devis gratuit, en un message"
          sub="Destination, dates, budget : décrivez-nous votre projet et recevez une proposition claire sous 24 h — ou tapez-nous sur WhatsApp pour aller encore plus vite."
          align="center"
        />

        <div className="mx-auto mt-8 grid max-w-5xl items-start gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
          {/* Formulaire e-mail (premier dans le flux mobile) */}
          <ContactForm />

          {/* Contact direct */}
          <div className="space-y-4">
            <a
              href={waLink(settings.whatsappNumber, WA_MESSAGE)}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-3xl border border-whatsapp/30 bg-whatsapp/5 p-5 transition-all hover:-translate-y-0.5 hover:border-whatsapp/60 hover:shadow-[0_16px_32px_-20px_rgba(37,211,102,0.5)] sm:p-6"
            >
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-whatsapp text-white">
                  <WhatsAppIcon className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-night">
                    WhatsApp — le plus rapide
                  </h2>
                  <p className="mt-0.5 truncate text-sm text-night-muted">
                    {settings.whatsappNumber}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-night-soft">
                Ouvrez la conversation, un membre de l&apos;équipe vous répond
                directement.
              </p>
            </a>

            <div className="grid gap-4 sm:auto-rows-fr sm:grid-cols-2">
              <a
                href={telHref(settings.phone)}
                className="flex h-full items-center gap-3 rounded-3xl border border-ice bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-ice-strong sm:flex-col sm:items-start sm:p-5"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cobalt-soft text-cobalt">
                  <Phone className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-night">Téléphone</span>
                  <span className="block truncate text-sm text-night-muted">
                    {settings.phone}
                  </span>
                </span>
              </a>

              <a
                href={`mailto:${settings.email}`}
                className="flex h-full items-center gap-3 rounded-3xl border border-ice bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-ice-strong sm:flex-col sm:items-start sm:p-5"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cobalt-soft text-cobalt">
                  <Mail className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-night">E-mail</span>
                  <span className="block truncate text-sm text-night-muted">
                    {settings.email}
                  </span>
                </span>
              </a>
            </div>

            <p className="flex items-start gap-3 rounded-3xl bg-ice/50 p-5 text-sm leading-relaxed text-night-soft">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" />
              <span>
                Devis gratuit et sans engagement — passez aussi nous voir à{" "}
                {settings.address}, un café et votre voyage prend forme.
              </span>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center lg:hidden">
          <Eyebrow className="justify-center text-night-faint">
            Réponse sous 24 h ouvrées
          </Eyebrow>
        </div>
      </Container>
    </section>
  );
}
