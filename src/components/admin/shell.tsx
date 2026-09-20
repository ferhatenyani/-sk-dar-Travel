"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/cn";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  IconBriefcase,
  IconFileText,
  IconHome,
  IconImage,
  IconInbox,
  IconLogOut,
  IconMenu,
  IconUser,
  IconX,
} from "@/components/ui/icons";

const NAV = [
  { href: "/admin", label: "Accueil", icon: IconHome, exact: true },
  { href: "/admin/demandes", label: "Demandes", icon: IconInbox },
  { href: "/admin/services", label: "Services", icon: IconBriefcase },
  { href: "/admin/galerie", label: "Galerie", icon: IconImage },
  { href: "/admin/contenus", label: "Contenus", icon: IconFileText },
  { href: "/admin/compte", label: "Compte", icon: IconUser },
];

export function AdminShell({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await authClient.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-col gap-0.5 px-3">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-navy-soft text-navy"
                : "text-ink-secondary hover:bg-page hover:text-ink",
            )}
          >
            <Icon className="size-[18px] shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href="/admin" className="flex items-center gap-2.5 px-3 pt-1">
      <Image
        src="/logo.jpg"
        alt="Logo Üsküdar Travel"
        width={36}
        height={37}
        className="rounded-md border border-line"
      />
      <span className="text-sm font-semibold tracking-tight">
        Üsküdar Travel
        <span className="block text-xs font-normal text-ink-muted">Administration</span>
      </span>
    </Link>
  );

  const userBlock = (
    <div className="border-t border-line p-3">
      <p className="mb-2 truncate px-1 text-xs text-ink-muted" title={userEmail}>
        {userEmail}
      </p>
      <Button
        variant="secondary"
        size="sm"
        className="w-full"
        loading={loggingOut}
        onClick={logout}
      >
        {!loggingOut && <IconLogOut className="size-4" />}
        Se déconnecter
      </Button>
    </div>
  );

  return (
    <div className="min-h-dvh bg-page">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-line">{brand}</div>
        <div className="flex-1 overflow-y-auto py-3">{nav}</div>
        {userBlock}
      </aside>

      {/* Topbar mobile */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={mobileOpen}
          className="inline-flex size-9 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-page hover:text-ink"
        >
          <IconMenu className="size-5" />
        </button>
      </header>

      {/* Slide-over mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-surface shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-line pr-3">
              {brand}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer le menu"
                className="inline-flex size-9 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-page hover:text-ink"
              >
                <IconX className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3">{nav}</div>
            {userBlock}
          </div>
        </div>
      )}

      {/* Contenu */}
      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
