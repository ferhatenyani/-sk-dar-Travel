"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldError(null);

    if (newPassword.length < 8) {
      setFieldError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldError("La confirmation ne correspond pas.");
      return;
    }

    setLoading(true);
    // Endpoint REST natif Better Auth (POST /api/auth/reset-password).
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword, token }),
    });
    setLoading(false);

    if (!res.ok) {
      setError(
        "Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation.",
      );
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/admin/login"), 2000);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {success && (
        <Alert tone="success">Mot de passe mis à jour. Redirection…</Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}
      {fieldError && <Alert tone="error">{fieldError}</Alert>}

      <Field label="Nouveau mot de passe" htmlFor="reset-password">
        <Input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </Field>

      <Field label="Confirmer" htmlFor="reset-confirm">
        <Input
          id="reset-confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </Field>

      <Button type="submit" className="w-full" loading={loading}>
        {loading ? "Enregistrement…" : "Définir le mot de passe"}
      </Button>
    </form>
  );
}
