import type { Metadata } from "next";
import Link from "next/link";

import {
  IconBriefcase,
  IconChevronDown,
  IconFileText,
  IconImage,
  IconUser,
} from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Accueil — Administration",
};

const MODULES = [
  {
    href: "/admin/services",
    title: "Services",
    description: "Gérez l'offre de l'agence : titres, descriptions, prix, images et publication.",
    icon: IconBriefcase,
  },
  {
    href: "/admin/galerie",
    title: "Galerie",
    description: "Sections thématiques et cartes photo — réordonnez, publiez, associez.",
    icon: IconImage,
  },
  {
    href: "/admin/contenus",
    title: "Contenus",
    description: "Textes de la vitrine, coordonnées, réseaux sociaux, logo et SEO.",
    icon: IconFileText,
  },
  {
    href: "/admin/compte",
    title: "Compte",
    description: "Mot de passe de votre accès administrateur.",
    icon: IconUser,
  },
];

export default function AdminHomePage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Administration</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Gérez le contenu du site Üsküdar Travel.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {MODULES.map(({ href, title, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-4 rounded-xl border border-line bg-surface p-5 shadow-sm transition-colors hover:border-navy-border hover:bg-navy-soft/40"
          >
            <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-navy-soft text-navy group-hover:bg-navy group-hover:text-white transition-colors">
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between">
                <span className="font-medium text-ink">{title}</span>
                <IconChevronDown className="size-4 -rotate-90 text-ink-faint transition-colors group-hover:text-navy" />
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-ink-muted">
                {description}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
