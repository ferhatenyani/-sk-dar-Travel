import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe — Administration",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-page px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Nouveau mot de passe
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Choisissez un mot de passe d&apos;au moins 8 caractères.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <p className="text-sm text-ink-muted">
              Lien invalide ou expiré.{" "}
              <Link href="/admin/mot-de-passe-oublie" className="text-navy hover:underline">
                Demandez un nouveau lien.
              </Link>
            </p>
          )}
        </div>
        <p className="mt-6 text-center text-sm">
          <Link href="/admin/login" className="text-navy hover:underline">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
