import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import { siteUrl } from "@/lib/vitrine";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Üsküdar Travel",
    template: "%s — Üsküdar Travel",
  },
  description:
    "Üsküdar Travel — agence de voyage à Sétif : voyages organisés et sur-mesure, hôtellerie, billetterie, transferts et assurance.",
  openGraph: {
    type: "website",
    siteName: "Üsküdar Travel",
    locale: "fr_FR",
    images: [{ url: "/images/hero.webp", width: 1200, height: 630, alt: "Üsküdar Travel" }],
  },
};

export const viewport: Viewport = {
  // viewportFit=cover : la page s'étend sous l'encoche/la barre iOS, les
  // paddings env(safe-area-inset-*) prennent le relais (header, menu, panneau).
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning sur html et body : certaines extensions
    // navigateur (ColorZilla, traducteurs…) ajoutent classes/attributs sur
    // ces balises avant React — faux positifs d'hydratation.
    <html
      lang="fr"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
