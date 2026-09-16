"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, Mail, Menu, Phone, X } from "lucide-react";

import { cn } from "@/lib/cn";
import { telHref, waLink, WA_MESSAGE, type VitrineSettings } from "@/lib/vitrine";
import { WhatsAppIcon } from "./primitives";

const NAV_ITEMS = [
  { href: "/", label: "Accueil" },
  { href: "/a-propos", label: "À propos" },
  { href: "/services", label: "Services" },
  { href: "/galerie", label: "Galerie" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function linkCls(active: boolean, compact = false): string {
  return cn(
    "whitespace-nowrap rounded-full font-medium transition-all duration-200",
    compact ? "px-3 py-1.5 text-[13px]" : "px-3.5 py-2 text-sm",
    active
      ? "bg-cobalt text-white shadow-[0_6px_16px_-8px_rgba(37,99,235,0.8)]"
      : "text-night-soft hover:bg-ice/70 hover:text-night",
  );
}

/** Pastille circulaire commune aux boutons « Planifier » / « Contact ». */
function buttonCircle(onDark: boolean, children: ReactNode) {
  return (
    <span
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-full shadow-[0_8px_18px_-8px_rgba(15,23,42,0.35)] transition-transform duration-200 group-hover:scale-105 sm:h-10 sm:w-10",
        onDark
          ? "bg-white/15 ring-1 ring-white/30 backdrop-blur-md text-white"
          : "bg-white ring-1 ring-ice",
      )}
    >
      {children}
    </span>
  );
}

/** Bouton « Planifier » : pastille blanche + icône WhatsApp verte. */
export function PlanButton({
  settings,
  onDark = false,
  textClassName = "",
}: {
  settings: VitrineSettings;
  /** Variante posée sur la photo du hero (verre blanc, texte blanc). */
  onDark?: boolean;
  /** Classes additionnelles pour le texte (ex. responsive). */
  textClassName?: string;
}) {
  return (
    <a
      href={waLink(settings.whatsappNumber, WA_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Planifier mon voyage sur WhatsApp"
      className={cn(
        "group flex items-center gap-2.5 rounded-full p-1 transition-colors sm:pr-4",
        onDark ? "hover:bg-white/10" : "hover:bg-ice/60",
      )}
    >
      {buttonCircle(
        onDark,
        <WhatsAppIcon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />,
      )}
      <span
        className={cn(
          "hidden text-sm font-semibold whitespace-nowrap md:block",
          onDark ? "text-white" : "text-night",
          textClassName,
        )}
      >
        Planifier mon voyage
      </span>
    </a>
  );
}

/**
 * Bouton « Contact » du hero : ancre vers la section contact en bas de
 * page (défilement doux via scroll-behavior sur html).
 */
export function ContactButton({ onDark = false }: { onDark?: boolean }) {
  return (
    <a
      href="#contact"
      aria-label="Aller à la section contact"
      className={cn(
        "group flex items-center gap-2.5 rounded-full p-1 transition-colors sm:pr-4",
        onDark ? "hover:bg-white/10" : "hover:bg-ice/60",
      )}
    >
      {buttonCircle(
        onDark,
        <Mail className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />,
      )}
      <span
        className={cn(
          "text-sm font-semibold whitespace-nowrap",
          onDark ? "text-white" : "text-night",
        )}
      >
        Demander un devis
      </span>
    </a>
  );
}

function Logo({
  settings,
  onDark = false,
}: {
  settings: VitrineSettings;
  onDark?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="Üsküdar Travel — accueil"
      className={cn(
        // Respiration généreuse entre le bord de la pastille et le contenu
        // au survol (état hover perceptible sans coller le texte).
        "-my-1 flex min-w-0 items-center gap-2 rounded-full px-2.5 py-1.5 transition-colors",
        onDark ? "hover:bg-white/10" : "hover:bg-ice/70",
      )}
    >
      <Image
        src={settings.logoUrl}
        alt=""
        width={38}
        height={38}
        className="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10"
      />
      <span
        className={cn(
          "text-[15px] font-bold tracking-tight",
          onDark ? "text-white" : "text-night",
          // Masqué < 480px : visible sur mobile dès 480px.
          "hidden min-[480px]:block",
        )}
      >
        Üsküdar <span className={onDark ? "text-citrine" : "text-cobalt"}>Travel</span>
      </span>
    </Link>
  );
}

/** Bouton « ☰ Menu » façon inspi3 : icône + libellé, collé au bord droit. */
function MenuButton({
  open,
  onToggle,
  id,
}: {
  open: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={id}
      aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
      className="flex shrink-0 items-center gap-2 rounded-full px-2.5 py-2.5 transition-colors hover:bg-ice/70"
    >
      <span className="hidden text-[13px] font-bold tracking-[0.12em] text-night uppercase min-[400px]:block">
        {open ? "Fermer" : "Menu"}
      </span>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-night text-white">
        {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
      </span>
    </button>
  );
}

/**
 * Menu plein écran (mobile/tablet) : prise de contrôle totale, grands liens
 * numérotés animés en cascade, CTA WhatsApp et coordonnées en pied de menu.
 */
function MobileMenu({
  settings,
  open,
  onClose,
  id,
}: {
  settings: VitrineSettings;
  open: boolean;
  onClose: () => void;
  id: string;
}) {
  const pathname = usePathname();
  if (!open) return null;
  return (
    <div
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navigation"
      className="fixed inset-0 z-[70] flex flex-col bg-white lg:hidden"
    >
      {/* En-tête du menu : même rangée que la barre (logo à gauche, croix à droite) */}
      <div className="flex items-center justify-between border-b border-ice/70 px-4 py-2.5 sm:px-6">
        <Logo settings={settings} />
        <MenuButton open onToggle={onClose} id={id} />
      </div>

      <nav aria-label="Navigation principale" className="flex-1 overflow-y-auto px-6 py-8 sm:px-10 sm:py-10">
        <ul className="mx-auto max-w-md space-y-1 sm:max-w-lg">
          {NAV_ITEMS.map((item, i) => {
            const active = isActive(pathname, item.href);
            return (
              <li
                key={item.href}
                className="vt-menu-item"
                style={{ animationDelay: `${90 + i * 70}ms` }}
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className="group flex items-baseline gap-4 rounded-2xl px-2 py-3 transition-colors hover:bg-ice/50 sm:gap-5"
                >
                  <span className="text-xs font-bold tracking-widest text-cobalt tabular-nums">
                    0{i + 1}
                  </span>
                  <span
                    className={cn(
                      "text-[32px] font-bold tracking-tight transition-colors sm:text-4xl",
                      active ? "text-cobalt" : "text-night group-hover:text-night-soft",
                    )}
                  >
                    {item.label}
                  </span>
                  <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 self-center text-cobalt opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="vt-menu-item border-t border-ice/70 px-6 py-5 sm:px-10" style={{ animationDelay: "380ms" }}>
        <div className="mx-auto max-w-md sm:max-w-lg">
          <a
            href={waLink(settings.whatsappNumber, WA_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center justify-center gap-2.5 rounded-full bg-citrine px-6 py-3.5 text-[15px] font-bold text-night shadow-[0_14px_32px_-14px_rgba(250,204,21,0.8)] transition-all hover:bg-citrine-hover active:scale-[0.98]"
          >
            <WhatsAppIcon className="h-5 w-5 text-whatsapp" />
            Planifier mon voyage
          </a>
          <div className="mt-4 flex items-center justify-center gap-5 text-sm text-night-muted">
            <a
              href={telHref(settings.phone)}
              className="flex items-center gap-1.5 transition-colors hover:text-cobalt"
            >
              <Phone className="h-3.5 w-3.5" />
              {settings.phone}
            </a>
            <a
              href={`mailto:${settings.email}`}
              className="flex items-center gap-1.5 transition-colors hover:text-cobalt"
            >
              <Mail className="h-3.5 w-3.5" />
              E-mail
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Contenu de la barre : logo à gauche ; liens inline + bouton WhatsApp à
 * droite sur desktop ; bouton WhatsApp (icône seule) + « ☰ Menu » à droite
 * sur mobile/tablet.
 */
function NavContent({
  settings,
  compact = false,
  menuOpen,
  onToggleMenu,
}: {
  settings: VitrineSettings;
  /** Variante serrée de la barre verre. */
  compact?: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <Logo settings={settings} />

      <nav aria-label="Navigation principale" className="hidden lg:block">
        <ul className="flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={linkCls(isActive(pathname, item.href), compact)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex items-center gap-1 sm:gap-1.5">
        <PlanButton settings={settings} />
        <div className="lg:hidden">
          <MenuButton open={menuOpen} onToggle={onToggleMenu} id="vt-mobile-menu" />
        </div>
      </div>
    </div>
  );
}

/**
 * Chrome de navigation global (style inspi3) : une barre blanche au-dessus
 * du contenu sur toutes les pages (le hero vit sous la barre), remplacée
 * après défilement par une barre fixe pleine largeur en verre dépoli.
 */
export default function SiteHeader({ settings }: { settings: VitrineSettings }) {
  const [glassVisible, setGlassVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sentinel = document.querySelector("[data-nav-sentinel]");
    if (!sentinel) return;
    const io = new IntersectionObserver(
      (entries) => setGlassVisible(!entries[0]?.isIntersecting),
      { threshold: 0 },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      {/* Barre statique pleine largeur, au-dessus du contenu (toutes pages),
          sans filet : la barre et le hero ne font qu'un visuellement */}
      <header data-nav-sentinel className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-2.5 sm:px-6 lg:px-10">
          <NavContent
            settings={settings}
            menuOpen={menuOpen}
            onToggleMenu={() => setMenuOpen((v) => !v)}
          />
        </div>
      </header>

      {/* Barre fixe pleine largeur, verre dépoli (après défilement) */}
      {glassVisible ? (
        <div className="fixed inset-x-0 top-0 z-50 border-b border-ice/70 bg-white/80 backdrop-blur-lg">
          <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-2 sm:px-6 lg:px-10">
            <NavContent
              settings={settings}
              compact
              menuOpen={menuOpen}
              onToggleMenu={() => setMenuOpen((v) => !v)}
            />
          </div>
        </div>
      ) : null}

      <MobileMenu
        settings={settings}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        id="vt-mobile-menu"
      />
    </>
  );
}
