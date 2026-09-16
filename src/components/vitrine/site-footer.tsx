import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { telHref, type VitrineSettings, waLink, WA_MESSAGE } from "@/lib/vitrine";
import { Container, FacebookIcon, InstagramIcon, WhatsAppIcon } from "./primitives";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/a-propos", label: "À propos" },
  { href: "/services", label: "Services" },
  { href: "/galerie", label: "Galerie" },
  { href: "/#contact", label: "Contact" },
];

export function SiteFooter({ settings }: { settings: VitrineSettings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto overflow-hidden bg-night text-white">
      <Container className="relative z-10 pb-10 pt-14 sm:pt-16">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Üsküdar Travel — accueil">
              <Image
                src={settings.logoUrl}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 rounded-full bg-white object-cover"
              />
              <span className="text-lg font-bold tracking-tight">
                Üsküdar <span className="text-citrine">Travel</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Agence de voyage à Sétif — voyages organisés et sur-mesure, hôtellerie,
              billetterie, transferts et assurance, pour des séjours sereins en famille
              ou en groupe.
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              {settings.facebookUrl ? (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook Üsküdar Travel"
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-citrine hover:text-citrine"
                >
                  <FacebookIcon className="h-4 w-4" />
                </a>
              ) : null}
              {settings.instagramUrl ? (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram Üsküdar Travel"
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-citrine hover:text-citrine"
                >
                  <InstagramIcon className="h-4 w-4" />
                </a>
              ) : null}
              <a
                href={waLink(settings.whatsappNumber, WA_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp Üsküdar Travel"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-whatsapp hover:text-whatsapp"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          <nav aria-label="Plan du site">
            <h2 className="text-sm font-semibold tracking-[0.14em] text-white/50 uppercase">
              Navigation
            </h2>
            <ul className="mt-4 space-y-2.5">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/80 transition-colors hover:text-citrine"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold tracking-[0.14em] text-white/50 uppercase">
              Contact
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={telHref(settings.phone)}
                  className="flex items-center gap-2.5 text-white/80 transition-colors hover:text-citrine"
                >
                  <Phone className="h-4 w-4 shrink-0 text-white/40" />
                  {settings.phone}
                </a>
              </li>
              <li>
                <a
                  href={waLink(settings.whatsappNumber, WA_MESSAGE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-white/80 transition-colors hover:text-whatsapp"
                >
                  <WhatsAppIcon className="h-4 w-4 shrink-0 text-white/40" />
                  WhatsApp {settings.whatsappNumber}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${settings.email}`}
                  className="flex items-center gap-2.5 text-white/80 transition-colors hover:text-citrine"
                >
                  <Mail className="h-4 w-4 shrink-0 text-white/40" />
                  {settings.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-white/80">
                <MapPin className="h-4 w-4 shrink-0 text-white/40" />
                {settings.address}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row">
          <p>© {year} Üsküdar Travel — Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <Link href="/#contact" className="transition-colors hover:text-white">
              Nous écrire
            </Link>
            <span aria-hidden className="h-3 w-px bg-white/20" />
            <Link href="/admin/login" className="transition-colors hover:text-white">
              Espace administrateur
            </Link>
          </div>
        </div>
      </Container>

      {/* Filigrane géant façon inspi1 */}
      <div
        aria-hidden
        className="pointer-events-none relative z-0 -mb-[4vw] flex justify-center overflow-hidden select-none"
      >
        <span className="translate-y-[22%] text-[16.5vw] leading-none font-bold tracking-tight whitespace-nowrap text-white/[0.05]">
          Üsküdar Travel
        </span>
      </div>
    </footer>
  );
}
