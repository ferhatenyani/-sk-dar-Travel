import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

/* ——— Conteneur de page ——— */

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  // Gouttière unifiée avec le hero (px-4 / px-6 / px-10) : aucun contenu ne
  // colle au bord de l'écran, quelle que soit la page.
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10", className)}>
      {children}
    </div>
  );
}

/* ——— Boutons / liens d'action ——— */

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60";

const BUTTON_SIZES = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-[15px]",
} as const;

const BUTTON_VARIANTS = {
  /** CTA principal — le jaune est réservé aux appels à l'action. */
  primary:
    "bg-citrine text-night shadow-[0_10px_24px_-12px_rgba(250,204,21,0.7)] hover:bg-citrine-hover hover:shadow-[0_14px_28px_-12px_rgba(250,204,21,0.8)] active:scale-[0.98]",
  /** Action secondaire pleine. */
  night: "bg-night text-white hover:bg-night-soft active:scale-[0.98]",
  /** Lien integré / tertiaire. */
  ghost: "text-cobalt hover:text-cobalt-hover",
  outline:
    "border border-ice-strong bg-white text-night hover:border-night-muted hover:bg-ice/40 active:scale-[0.98]",
  "outline-light":
    "border border-white/30 bg-white/5 text-white hover:bg-white/15 active:scale-[0.98]",
} as const;

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  external = false,
  ...props
}: Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
  className?: string;
  external?: boolean;
}) {
  return (
    <Link
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(BUTTON_BASE, BUTTON_SIZES[size], BUTTON_VARIANTS[variant], className)}
      {...props}
    />
  );
}

/* ——— Pastilles / tags ——— */

export function Chip({
  children,
  className = "",
  glass = false,
}: {
  children: ReactNode;
  className?: string;
  /** Verre dépoli, pour les tags posés sur une photo. */
  glass?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full text-xs font-medium",
        glass
          ? "border border-white/25 bg-night/35 px-3 py-1.5 text-white backdrop-blur-md"
          : "border border-ice bg-white px-3 py-1.5 text-night-soft",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ——— Titres de section ——— */

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-cobalt uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "left",
  dark = false,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  align?: "left" | "center";
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
      )}
    >
      {eyebrow ? (
        <Eyebrow className={cn(dark && "text-citrine")}>{eyebrow}</Eyebrow>
      ) : null}
      <h2
        className={cn(
          "mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl",
          dark ? "text-white" : "text-night",
        )}
      >
        {title}
      </h2>
      {sub ? (
        <p className={cn("mt-3 text-base leading-relaxed", dark ? "text-white/70" : "text-night-muted")}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}

/* ——— Icônes de marques (absentes de lucide-react) ——— */

export function FacebookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M13.5 21.5v-7.4h2.5l.44-3.1H13.5V9.03c0-.9.28-1.6 1.66-1.6h1.4V4.63c-.68-.09-1.43-.17-2.17-.17-2.4 0-4.02 1.46-4.02 4.1v2.44H7.9v3.1h2.47v7.4h3.13Z" />
    </svg>
  );
}

export function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.1" cy="6.9" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}
