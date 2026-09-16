import type { Metadata } from "next";
import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion — Administration",
};

export default async function LoginPage() {
  // Session réellement valide : inutile d'afficher le formulaire. Un cookie
  // périmé (session révoquée/expirée) ne déclenche ici aucune redirection —
  // le formulaire s'affiche simplement.
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-page px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo.jpg"
            alt="Logo Üsküdar Travel"
            width={72}
            height={74}
            priority
            className="mb-4 rounded-xl border border-line shadow-sm"
          />
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Espace administrateur
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Connectez-vous pour gérer le site.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-ink-faint">
          Üsküdar Travel — accès réservé à l&apos;administration.
        </p>
      </div>
    </div>
  );
}
