import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Mot de passe oublié — Administration",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-page px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Mot de passe oublié
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Entrez votre e-mail pour recevoir un lien de réinitialisation.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
          <ForgotPasswordForm />
        </div>
        <p className="mt-6 text-center text-sm">
          <Link
            href="/admin/login"
            className="text-navy hover:underline"
          >
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
