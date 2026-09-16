"use client";

import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth-client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setFieldError(null);

    if (newPassword.length < 8) {
      setFieldError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldError("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }

    setLoading(true);
    const { error: changeError } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setLoading(false);

    if (changeError) {
      setError(
        changeError.status === 401 || changeError.status === 400
          ? "Mot de passe actuel incorrect."
          : "Une erreur est survenue. Réessayez.",
      );
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {success && (
        <Alert tone="success">Mot de passe mis à jour.</Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}
      {fieldError && <Alert tone="error">{fieldError}</Alert>}

      <Field label="Mot de passe actuel" htmlFor="current-password">
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </Field>

      <Field label="Nouveau mot de passe" htmlFor="new-password">
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </Field>

      <Field label="Confirmer le nouveau mot de passe" htmlFor="confirm-password">
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </Field>

      <Button type="submit" loading={loading}>
        {loading ? "Enregistrement…" : "Mettre à jour"}
      </Button>
    </form>
  );
}
