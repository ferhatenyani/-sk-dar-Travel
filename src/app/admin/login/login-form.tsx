"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

type ErrorTone = "credentials" | "rate-limit" | "generic";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={error === "credentials"}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-1.5 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-ink-faint transition-colors hover:bg-page hover:text-ink"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>
      </Field>

      <Button type="submit" className="w-full" loading={loading}>
        {loading ? "Connexion…" : "Se connecter"}
      </Button>

      {/* Lien masqué : à réactiver une fois Resend configuré (sender + domaine
          vérifiés). Les pages mot-de-passe-oublie / reinitialiser restent en
          place et sont couvertes par l'E2E.
      <p className="text-center text-xs text-ink-muted">
        <a href="/admin/mot-de-passe-oublie" className="text-navy hover:underline">
          Mot de passe oublié ?
        </a>
      </p>
      */}
    </form>
  );
}
