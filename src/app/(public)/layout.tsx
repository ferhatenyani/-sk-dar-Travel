import type { ReactNode } from "react";

import { SiteFooter } from "@/components/vitrine/site-footer";
import SiteHeader from "@/components/vitrine/site-header";
import { SmoothScroll } from "@/components/vitrine/smooth-scroll";
import { WhatsAppFab } from "@/components/vitrine/whatsapp-fab";
import { getSettings } from "@/lib/public-data";
import { vitrineSettings } from "@/lib/vitrine";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const settings = vitrineSettings(await getSettings());

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
      <SiteHeader settings={settings} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
      <WhatsAppFab settings={settings} />
    </div>
  );
}
