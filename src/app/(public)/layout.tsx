import type { ReactNode } from "react";

import { SiteFooter } from "@/components/vitrine/site-footer";
import SiteHeader from "@/components/vitrine/site-header";
import { SmoothScroll } from "@/components/vitrine/smooth-scroll";
import { ComposerProvider } from "@/components/vitrine/composer";
import {
  getPublishedDestinations,
  getPublishedOffers,
  getPublishedVoyageChoices,
  getSettings,
} from "@/lib/public-data";
import { vitrineSettings } from "@/lib/vitrine";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [settings, destinations, offers, voyages] = await Promise.all([
    getSettings(),
    getPublishedDestinations(),
    getPublishedOffers(),
    getPublishedVoyageChoices(),
  ]);

  return (
    <div className="vt-root flex min-h-dvh flex-col bg-white text-night antialiased">
      <SmoothScroll />
      {/* Posé avant le premier paint : active les révélations au défilement
          tout en gardant la page visible sans JavaScript. */}
      <script
        dangerouslySetInnerHTML={{
          __html: "document.documentElement.classList.add('vt-js')",
        }}
      />
      <ComposerProvider destinations={destinations} offers={offers} voyages={voyages}>
        <SiteHeader settings={vitrineSettings(settings)} />
        <main className="flex-1">{children}</main>
        <SiteFooter settings={vitrineSettings(settings)} />
      </ComposerProvider>
    </div>
  );
}
