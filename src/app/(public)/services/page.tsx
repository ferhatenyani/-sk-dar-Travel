// Services — grille des services publiés du CMS.
import { asc, eq } from "drizzle-orm";
import { CalendarCheck, MessagesSquare, PlaneTakeoff } from "lucide-react";

import { db } from "@/db";
import { services as servicesTable } from "@/db/schema";
import { CtaBand } from "@/components/vitrine/cta-band";
import {
  Container,
  Eyebrow,
  SectionHeading,
} from "@/components/vitrine/primitives";
import { Reveal } from "@/components/vitrine/reveal";
import { ServiceCard } from "@/components/vitrine/service-card";
import { getSettings } from "@/lib/public-data";
import { vitrineSettings, waServiceLink } from "@/lib/vitrine";

export const revalidate = 60;

export const metadata = {
  title: "Nos services",
  description:
    "Voyages organisés et sur-mesure, hôtellerie, billetterie, transferts et assurance : découvrez tous les services d’Üsküdar Travel, agence de voyage à Sétif.",
  alternates: { canonical: "/services" },
};

const STEPS = [
  {
    icon: MessagesSquare,
    title: "1. On discute",
    text: "Un message sur WhatsApp ou via le formulaire : destination, dates, voyageurs, budget. C'est déjà presque parti.",
  },
  {
    icon: CalendarCheck,
    title: "2. On prépare",
    text: "Vous recevez un programme et un devis clairs, sans frais cachés. On ajuste ensemble jusqu'à ce que tout vous ressemble.",
  },
  {
    icon: PlaneTakeoff,
    title: "3. Vous partez",
    text: "Billets, hôtel, transferts, assurance : tout est réglé avant le départ. Vous n'avez plus qu'à profiter.",
  },
];

export default async function ServicesPage() {
  const settings = vitrineSettings(await getSettings());

  const rows = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.published, true))
    .orderBy(asc(servicesTable.sortOrder), asc(servicesTable.id));

  return (
    <>
      {/* Bandeau d’en-tête */}
      <section>
        <Container className="pt-10 pb-14 text-center sm:pt-14 sm:pb-16">
          <Reveal>
            <Eyebrow className="justify-center">Nos services</Eyebrow>
            <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-bold tracking-tight text-night text-balance sm:text-5xl">
              Partir n’a jamais été aussi simple
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-night-muted">
              Vols, hôtels, transferts, assurance : chaque service se réserve
              seul ou s’assemble en séjour complet. Le devis est gratuit — et
              le reste aussi.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* Grille des services */}
      <section className="py-4 sm:py-8">
        <Container>
          {rows.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-ice-strong bg-white p-8 text-center text-sm text-night-muted">
              Nos services arrivent très bientôt — contactez-nous directement
              sur WhatsApp pour préparer votre voyage.
            </p>
          ) : (
            <div className="grid gap-5 sm:auto-rows-fr sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((service, i) => (
                <Reveal key={service.id} delay={(i % 3) * 70}>
                  <ServiceCard
                    service={{
                      slug: service.slug,
                      title: service.title,
                      description: service.description,
                      price: service.price,
                      imageUrl: service.imageUrl,
                    }}
                    waHref={waServiceLink(settings.whatsappNumber, service.title)}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* Comment ça marche */}
      <section className="py-14 sm:py-20">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Comment ça marche"
              title="De la première idée au décollage, en trois étapes"
              align="center"
            />
          </Reveal>
          <div className="mt-10 grid gap-5 md:auto-rows-fr md:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 80}>
                <div className="relative h-full rounded-3xl border border-ice bg-white p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-night text-citrine">
                    <step.icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <h2 className="mt-4 text-base font-bold text-night">{step.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-night-muted">
                    {step.text}
                  </p>
                  {i < STEPS.length - 1 ? (
                    <span
                      aria-hidden
                      className="absolute top-1/2 -right-3 hidden h-0.5 w-6 border-t-2 border-dashed border-ice-strong md:block"
                    />
                  ) : null}
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <CtaBand
        settings={settings}
        title="Votre prochaine destination n'attend que vous"
        sub="Organisé ou sur-mesure, près ou loin : parlons-en maintenant — concevoir votre voyage ne coûte rien, partir en vaut la peine."
      />
    </>
  );
}
