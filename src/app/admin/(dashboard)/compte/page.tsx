import type { Metadata } from "next";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = {
  title: "Compte — Administration",
};

export default async function ComptePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Compte</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Connecté en tant que{" "}
          <span className="font-medium text-ink">{session?.user.email}</span>
        </p>
      </header>

      <section className="max-w-md rounded-xl border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold">Changer de mot de passe</h2>
        <p className="mb-5 text-sm text-ink-muted">
          Minimum 8 caractères. Vos autres sessions seront déconnectées.
        </p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
