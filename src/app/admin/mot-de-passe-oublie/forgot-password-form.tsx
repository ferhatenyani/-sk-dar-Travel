"use client";

import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSent(false);
    setLoading(true);

    // Endpoint REST natif Better Auth (POST /api/auth/request-password-reset).
    const res = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, redirectTo: "/admin/reinitialiser-mot-de-passe" }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Une erreur est survenue. Réessayez.");
      return;
    }
    // Succès : message générique (on ne révèle pas si l'e-mail existe).
    setSent(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {sent && (
        <Alert tone="success">
          Si un compte existe pour cet e-mail, un lien de réinitialisation vient
          d&apos;être envoyé.
        </Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}

      <Field label="Email" htmlFor="forgot-email">
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          required
          placeholder="vous@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Button type="submit" className="w-full" loading={loading}>
        {loading ? "Envoi…" : "Recevoir le lien"}
      </Button>
    </form>
  );
}
