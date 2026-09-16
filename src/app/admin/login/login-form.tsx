"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth-client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

type ErrorTone = "credentials" | "rate-limit" | "generic";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorTone | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    if (signInError) {
      if (signInError.status === 429) {
        setError("rate-limit");
      } else if (signInError.status === 401 || signInError.status === 400 || signInError.status === 403) {
        setError("credentials");
      } else {
        setError("generic");
      }
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && (
        <Alert tone="error">
          {error === "credentials" && "Email ou mot de passe incorrect."}
          {error === "rate-limit" && "Trop de tentatives. Réessayez dans une minute."}
          {error === "generic" && "Une erreur est survenue. Réessayez."}
        </Alert>
      )}

      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          placeholder="vous@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          invalid={error === "credentials"}
        />
      </Field>

      <Field label="Mot de passe" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          invalid={error === "credentials"}
        />
      </Field>

      <Button type="submit" className="w-full" loading={loading}>
        {loading ? "Connexion…" : "Se connecter"}
      </Button>

      <p className="text-center text-xs text-ink-muted">
        <a href="/admin/mot-de-passe-oublie" className="text-navy hover:underline">
          Mot de passe oublié ?
        </a>
      </p>
    </form>
  );
}
